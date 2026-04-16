import { supabaseAdmin } from "../supabase";
import { adaptEvent, type DbEventRow } from "./adapters";
import type { EventItem } from "@gooutside/demo-data";

const EVENT_SELECT = `
  id, slug, title, description, short_description,
  banner_url, gallery_urls, start_datetime, end_datetime,
  total_capacity, tickets_sold, status, is_featured,
  avg_rating, reviews_count, saves_count, tags,
  organizer_id, is_online, custom_location,
  categories (id, name, slug, icon_key, color, is_active, sort_order),
  venues (id, name, city, address),
  ticket_types (id, name, price, price_type, quantity_total, quantity_sold, is_active)
`;

export async function getSavedEvents(supabaseUserId: string): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("saved_events")
    .select(`events (${EVENT_SELECT})`)
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getSavedEvents]", error); return []; }

  return (data as unknown as { events: DbEventRow }[] ?? [])
    .map((row) => row.events)
    .filter(Boolean)
    .map((ev) => ({ ...adaptEvent(ev as DbEventRow), saved: true }));
}

export async function isEventSaved(
  supabaseUserId: string,
  eventId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("saved_events")
    .select("id")
    .eq("user_id", supabaseUserId)
    .eq("event_id", eventId)
    .maybeSingle();
  return !!data;
}
