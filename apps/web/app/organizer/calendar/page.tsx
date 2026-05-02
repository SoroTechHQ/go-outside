import { supabaseAdmin } from "../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { CalendarClient } from "./CalendarClient";

export type CalendarEvent = {
  id: string;
  title: string;
  startDatetime: string | null;
  status: "published" | "draft" | "archived" | string;
  ticketsSold: number;
  totalCapacity: number | null;
  slug: string;
};

export default async function OrganizerCalendarPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  if (user.role !== "organizer" && user.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Organizer access required.
        </p>
      </div>
    );
  }

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title, start_datetime, status, tickets_sold, total_capacity, slug")
    .eq("organizer_id", user.id)
    .order("start_datetime", { ascending: true });

  const calendarEvents: CalendarEvent[] = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    startDatetime: e.start_datetime,
    status: e.status,
    ticketsSold: e.tickets_sold ?? 0,
    totalCapacity: e.total_capacity,
    slug: e.slug,
  }));

  return <CalendarClient events={calendarEvents} />;
}
