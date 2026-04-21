import { NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { humanizeDbError } from "../../../../lib/db-errors";

const USER_PUBLIC_SELECT = [
  "first_name",
  "last_name",
  "username",
  "bio",
  "phone",
  "role",
  "avatar_url",
  "cover_url",
  "location_city",
  "location_city_name",
  "location_region",
  "location_country",
  "location_formatted",
  "location_place_id",
  "location_source",
  "interests",
  "vibe",
  "pulse_score",
  "pulse_tier",
  "onboarding_complete",
] as const;

type PublicUserDto = Partial<Record<(typeof USER_PUBLIC_SELECT)[number], unknown>>;

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_PUBLIC_SELECT.join(", "))
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (error || !data) return jsonError(404, "User not found");

  // Silently sync username to Clerk if Supabase has one that Clerk doesn't know about
  const sbUsername = (data as unknown as Record<string, unknown>).username as string | null;
  if (sbUsername && sbUsername !== clerk.username) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerk.id, { username: sbUsername });
    } catch (e) {
      console.warn("[GET /api/users/me] clerk username sync skipped:", (e as Error).message);
    }
  }

  return jsonNoStore(data as PublicUserDto);
}

export async function PATCH(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "users-me-patch",
    key: getActorKey(req, clerk.id),
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json() as Record<string, unknown>;
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  // Whitelist updatable scalar fields
  const allowed = [
    "first_name", "last_name", "username", "bio", "phone",
    "location_city", "location_city_name", "location_region",
    "location_country", "location_formatted", "location_place_id",
    "location_source",
    "interests", "vibe",
    "pulse_score", "pulse_tier", "onboarding_complete",
    "avatar_url", "cover_url",
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // PostGIS point: convert lat/lng floats → EWKT string Supabase accepts
  const lat = body.location_lat as number | undefined;
  const lng = body.location_lng as number | undefined;
  if (lat != null && lng != null && lat !== 0 && lng !== 0) {
    updates.location_point = `SRID=4326;POINT(${lng} ${lat})`;
  }

  // Upsert — creates the row if the Clerk webhook hasn't fired yet
  const base = {
    clerk_id:   clerk.id,
    email:      clerk.emailAddresses[0]?.emailAddress ?? "",
    first_name: clerk.firstName ?? "User",
    last_name:  clerk.lastName  ?? "",
    role:       (existing?.role as "admin" | "organizer" | "attendee" | undefined) ?? "attendee",
  };

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert({ ...base, ...updates }, { onConflict: "clerk_id" })
    .select(USER_PUBLIC_SELECT.join(", "))
    .single();

  if (error) {
    console.error("[PATCH /api/users/me]", error);
    const { message, status } = humanizeDbError(error);
    return jsonError(status, message);
  }

  // Sync username to Clerk so users can sign in with it
  const newUsername = typeof body.username === "string" && body.username.trim()
    ? body.username.trim()
    : null;
  if (newUsername) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerk.id, { username: newUsername });
    } catch (clerkErr: unknown) {
      const msg = clerkErr instanceof Error ? clerkErr.message : String(clerkErr);
      console.error("[PATCH /api/users/me] clerk username sync failed", msg);
      // Username took in Supabase but Clerk rejected it (likely already taken in Clerk).
      // Roll back the Supabase username so both stores stay in sync.
      await supabaseAdmin
        .from("users")
        .update({ username: null, updated_at: new Date().toISOString() })
        .eq("clerk_id", clerk.id);
      const taken = msg.toLowerCase().includes("taken") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("unique");
      return jsonError(409, taken ? "That username is already taken. Choose a different one to continue." : "Couldn't save username. Please try again.");
    }
  }

  return jsonNoStore(data as PublicUserDto);
}
