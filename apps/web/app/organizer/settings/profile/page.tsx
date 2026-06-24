import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { ProfileSettingsClient } from "./ProfileSettingsClient";

export default async function OrganizerProfileSettingsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabaseAdmin
    .from("organizer_profiles")
    .select("id, organization_name, bio, website_url, logo_url, cover_url, location_city, social_links, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return <ProfileSettingsClient profile={profile} userId={user.id} />;
}
