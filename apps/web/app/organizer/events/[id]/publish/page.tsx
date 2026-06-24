import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";
import { EventEditHub } from "../EventEditHub";
import { PublishClient } from "./PublishClient";

export default async function EventPublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const [{ data: event }, { count: activeTicketCount }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id, title, slug, status, start_datetime, end_datetime, banner_url, organizer_id, description, tags, categories(name)")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("ticket_types")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("is_active", true),
  ]);

  if (!event || event.organizer_id !== user.id) return notFound();

  const hubEvent = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status,
    start_datetime: event.start_datetime,
    banner_url: event.banner_url,
  };

  const ev = event as typeof event & { categories: { name: string } | null };
  const readinessChecks = {
    hasTitle: Boolean(event.title),
    hasDescription: Boolean(event.description),
    hasBanner: Boolean(event.banner_url),
    hasTickets: (activeTicketCount ?? 0) > 0,
    hasDate: Boolean(event.start_datetime),
  };

  return (
    <EventEditHub event={hubEvent}>
      <PublishClient
        event={hubEvent}
        category={ev.categories?.name ?? null}
        readiness={readinessChecks}
        tags={event.tags ?? []}
      />
    </EventEditHub>
  );
}
