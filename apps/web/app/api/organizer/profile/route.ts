import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  enforceRateLimit,
  enforceSameOrigin,
  getActorKey,
  jsonError,
  jsonNoStore,
} from "../../../../lib/api-security";

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");

  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select("organization_name, bio, website_url, logo_url, cover_url, social_links, location_city, slug, status, verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return jsonError(404, "Organizer profile not found");

  return jsonNoStore(data);
}

export async function PATCH(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "organizer-profile-patch",
    key: getActorKey(req, clerk.id),
    limit: 10,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");

  const body = (await req.json()) as Record<string, unknown>;

  const allowed = ["organization_name", "bio", "website_url", "logo_url", "cover_url", "social_links", "location_city", "slug"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return jsonError(400, "No valid fields to update");
  }

  if (updates.slug !== undefined) {
    const slug = updates.slug as string | null;
    if (slug) {
      if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
        return jsonError(400, "Slug must be 3–30 lowercase letters, numbers, or hyphens");
      }
      const { count } = await supabaseAdmin
        .from("organizer_profiles")
        .select("id", { count: "exact", head: true })
        .eq("slug", slug)
        .neq("user_id", user.id);
      if (count && count > 0) return jsonError(409, "This URL is already taken");
    }
  }

  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select("organization_name, bio, website_url, logo_url, cover_url, social_links, location_city, slug, status, verified_at")
    .single();

  if (error) {
    console.error("[PATCH /api/organizer/profile]", error);
    return jsonError(500, "Failed to update organizer profile");
  }

  return jsonNoStore(data);
}
