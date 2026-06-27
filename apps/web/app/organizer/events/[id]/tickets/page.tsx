import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";
import { EventEditHub } from "../EventEditHub";
import { TicketsClient } from "./TicketsClient";

export default async function EventTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const [{ data: event }, { data: ticketTypes }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id, title, slug, status, start_datetime, banner_url, organizer_id")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("ticket_types")
      .select("*")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
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

  return (
    <EventEditHub event={hubEvent}>
      <TicketsClient
        eventId={event.id}
        eventStartAt={event.start_datetime ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
        initialTicketTypes={(ticketTypes ?? []) as Parameters<typeof TicketsClient>[0]["initialTicketTypes"]}
      />
    </EventEditHub>
  );
}
