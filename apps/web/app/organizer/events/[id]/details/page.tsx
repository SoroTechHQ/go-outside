import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";
import { EventEditHub } from "../EventEditHub";
import { DetailsClient } from "./DetailsClient";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const { data: event } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, description, short_description,
      banner_url, gallery_urls, video_url, tags,
      activities, policies, is_age_restricted,
      start_datetime, status, organizer_id
    `)
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return notFound();

  const hubEvent = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status,
    start_datetime: event.start_datetime,
    banner_url: event.banner_url,
  };

  return (
    <EventEditHub event={hubEvent}>
      <DetailsClient event={event as typeof event & { gallery_urls: string[] | null; activities: unknown; policies: unknown }} />
    </EventEditHub>
  );
}
