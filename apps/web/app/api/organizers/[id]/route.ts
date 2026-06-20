import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

// GET /api/organizers/[id]  — public organizer profile by user_id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Join organizer_profiles + users in one query.
  // Use the real column names that exist in the DB:
  //   - website_url  (not "website")
  //   - social_links (JSONB — not top-level "instagram"/"twitter" columns)
  //   - verified_at  (not "verified" boolean)
  //   - cover_url    (added in migration 027; may be null for older rows)
  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(`
      user_id,
      organization_name,
      bio,
      slug,
      status,
      verified_at,
      logo_url,
      cover_url,
      website_url,
      social_links,
      location_city,
      total_events,
      users!organizer_profiles_user_id_fkey (
        id, first_name, last_name, location_city, avatar_url, cover_url
      )
    `)
    .eq("user_id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("[GET /api/organizers/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  type UserJoin = { id: string; first_name: string; last_name: string; location_city: string | null; avatar_url: string | null; cover_url: string | null } | null;
  type SocialLinks = { instagram?: string; twitter?: string; facebook?: string; [key: string]: string | undefined } | null;
  const row = data as typeof data & {
    users: UserJoin;
    social_links: SocialLinks;
    website_url: string | null;
    cover_url: string | null;
    location_city: string | null;
    verified_at: string | null;
    slug: string | null;
  };

  const socials = row.social_links ?? {};

  const organizer = {
    id:          row.user_id,
    name:        row.organization_name,
    bio:         row.bio ?? "",
    slug:        row.slug ?? null,
    city:        row.location_city ?? row.users?.location_city ?? "Accra",
    // cover: prefer organizer cover, fall back to user cover
    coverUrl:    row.cover_url ?? row.users?.cover_url ?? null,
    logoUrl:     row.logo_url ?? null,
    avatarUrl:   row.users?.avatar_url ?? null,
    totalEvents: row.total_events ?? 0,
    // verified = status approved AND has a verified_at timestamp
    verified:    row.status === "approved" && row.verified_at != null,
    websiteUrl:  row.website_url ?? null,
    // Extract from social_links JSONB — these are the real column locations
    instagram:   socials.instagram ?? null,
    twitter:     socials.twitter   ?? null,
    facebook:    socials.facebook  ?? null,
  };

  return NextResponse.json(organizer);
}
