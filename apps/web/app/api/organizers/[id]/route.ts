import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

// GET /api/organizers/[id]  — public organizer profile by user_id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("organizer_profiles")
    .select(`
      user_id, organization_name, bio, status, total_events, verified,
      cover_url, logo_url, website, instagram, twitter,
      users!organizer_profiles_user_id_fkey (
        id, first_name, last_name, location_city, avatar_url
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

  const row = data as typeof data & {
    users: { id: string; first_name: string; last_name: string; location_city: string | null; avatar_url: string | null } | null;
  };

  const organizer = {
    id: row.user_id,
    name: row.organization_name,
    bio: row.bio ?? "",
    city: row.users?.location_city ?? "Accra",
    coverUrl: row.cover_url ?? null,
    logoUrl: row.logo_url ?? null,
    totalEvents: row.total_events ?? 0,
    verified: row.verified ?? false,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    twitter: row.twitter ?? null,
    avatarUrl: row.users?.avatar_url ?? null,
  };

  return NextResponse.json(organizer);
}
