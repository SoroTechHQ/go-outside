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

// All published events
export async function getPublishedEvents(): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("start_datetime", { ascending: true });

  if (error) { console.error("[getPublishedEvents]", error); return []; }
  return (data as unknown as DbEventRow[]).map(adaptEvent);
}

// Single event by slug
export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return adaptEvent(data as unknown as DbEventRow);
}

// Events in a given category
export async function getEventsByCategory(categorySlug: string): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .eq("categories.slug", categorySlug)
    .order("start_datetime", { ascending: true });

  if (error) { console.error("[getEventsByCategory]", error); return []; }
  return (data as unknown as DbEventRow[])
    .filter((row) => row.categories?.slug === categorySlug)
    .map(adaptEvent);
}

// Featured events (home / dashboard)
export async function getFeaturedEvents(limit = 6): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("start_datetime", { ascending: true })
    .limit(limit);

  if (error) { console.error("[getFeaturedEvents]", error); return []; }
  return (data as unknown as DbEventRow[]).map(adaptEvent);
}

// Similar events (same category, excluding the current one)
export async function getSimilarEvents(
  categorySlug: string,
  excludeSlug: string,
  limit = 3
): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .neq("slug", excludeSlug)
    .order("start_datetime", { ascending: true })
    .limit(20); // fetch more then filter — can't filter on joined column directly

  if (error) { console.error("[getSimilarEvents]", error); return []; }
  return (data as unknown as DbEventRow[])
    .filter((row) => row.categories?.slug === categorySlug)
    .slice(0, limit)
    .map(adaptEvent);
}

// Full-text + category search
export async function searchEvents(opts: {
  query?: string;
  category?: string;
}): Promise<EventItem[]> {
  let q = supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published");

  if (opts.query) {
    q = q.textSearch("title", opts.query, { type: "websearch" });
  }

  const { data, error } = await q.order("start_datetime", { ascending: true }).limit(60);
  if (error) { console.error("[searchEvents]", error); return []; }

  let results = (data as unknown as DbEventRow[]).map(adaptEvent);

  if (opts.category) {
    results = results.filter((e) => e.categorySlug === opts.category);
  }

  return results;
}

// Events by organizer user ID
export async function getEventsByOrganizer(organizerUserId: string): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("organizer_id", organizerUserId)
    .eq("status", "published")
    .order("start_datetime", { ascending: false });

  if (error) { console.error("[getEventsByOrganizer]", error); return []; }
  return (data as unknown as DbEventRow[]).map(adaptEvent);
}
