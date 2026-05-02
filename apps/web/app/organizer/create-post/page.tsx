import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { PostComposerClient } from "./PostComposerClient";

export default async function OrganizerCreatePostPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, start_datetime, slug")
    .eq("organizer_id", user.id)
    .eq("status", "published")
    .order("start_datetime", { ascending: false })
    .limit(20);

  return (
    <PostComposerClient
      organizerName={`${user.first_name} ${user.last_name}`.trim()}
      ownEvents={(events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.start_datetime,
        slug: e.slug,
      }))}
    />
  );
}
