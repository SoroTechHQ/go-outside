import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

type UserJoin = { id: string; first_name: string; last_name: string; location_city: string | null; avatar_url: string | null; cover_url: string | null } | null;
type SocialLinks = { instagram?: string; twitter?: string; facebook?: string; [key: string]: string | undefined } | null;

async function fetchOrganizer(id: string) {
  // Try with is_founding_organizer first (available after migration 012)
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
      is_founding_organizer,
      users!organizer_profiles_user_id_fkey (
        id, first_name, last_name, location_city, avatar_url, cover_url
      )
    `)
    .eq("user_id", id)
    .eq("status", "approved")
    .maybeSingle();

  // If the column doesn't exist yet (migration not run), fall back without it
  if (error?.message?.includes("is_founding_organizer")) {
    const { data: fallback, error: fallbackError } = await supabaseAdmin
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

    return { data: fallback, error: fallbackError, isFoundingOrganizer: false };
  }

  return { data, error, isFoundingOrganizer: (data as any)?.is_founding_organizer ?? false };
}

// GET /api/organizers/[id]  — public organizer profile by user_id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error, isFoundingOrganizer } = await fetchOrganizer(id);

  if (error) {
    console.error("[GET /api/organizers/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

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
    id:                  row.user_id,
    name:                row.organization_name,
    bio:                 row.bio ?? "",
    slug:                row.slug ?? null,
    city:                row.location_city ?? row.users?.location_city ?? "Accra",
    coverUrl:            row.cover_url ?? row.users?.cover_url ?? null,
    logoUrl:             row.logo_url ?? null,
    avatarUrl:           row.users?.avatar_url ?? null,
    totalEvents:         row.total_events ?? 0,
    verified:            row.status === "approved" && row.verified_at != null,
    isFoundingOrganizer: isFoundingOrganizer,
    websiteUrl:          row.website_url ?? null,
    instagram:           socials.instagram ?? null,
    twitter:             socials.twitter   ?? null,
    facebook:            socials.facebook  ?? null,
  };

  return NextResponse.json(organizer);
}
