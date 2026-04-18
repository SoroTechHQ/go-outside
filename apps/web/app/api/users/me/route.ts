import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    "avatar_url",
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
    .select("*")
    .single();

  if (error) {
    console.error("[PATCH /api/users/me]", error);
    const isUsernameConflict = error.code === "23505" && error.message.includes("username");
    return NextResponse.json(
      { error: isUsernameConflict ? "That username is already taken" : error.message },
      { status: isUsernameConflict ? 409 : 500 }
    );
  }

  return NextResponse.json(data);
}
