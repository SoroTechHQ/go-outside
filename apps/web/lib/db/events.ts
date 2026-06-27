import { supabaseAdmin } from "../supabase";
import { adaptEvent, type DbEventRow } from "./adapters";
import type { EventItem } from "@gooutside/demo-data";

const EVENT_SELECT = `
  id, slug, title, description, short_description,
  banner_url, gallery_urls, start_datetime, end_datetime,
  total_capacity, tickets_sold, status, is_featured,
  avg_rating, reviews_count, saves_count, tags,
  organizer_id, is_online, custom_location, is_age_restricted,
  policies, activities, social_links,
  categories (id, name, slug, icon_key, color, is_active, sort_order),
  venues (id, name, city, address, latitude, longitude),
  ticket_types (id, name, price, price_type, quantity_total, quantity_sold, is_active, max_per_user)
`;

function isCurrentOrFutureEvent(row: DbEventRow) {
  const now = Date.now();
  const endsAt = row.end_datetime ? new Date(row.end_datetime).getTime() : null;
  const startsAt = new Date(row.start_datetime).getTime();
  return endsAt != null ? endsAt > now : startsAt > now;
}

function adaptCurrentOrFutureEvents(data: DbEventRow[] | null) {
  const results: EventItem[] = [];
  for (const row of (data ?? []).filter(isCurrentOrFutureEvent)) {
    try {
      results.push(adaptEvent(row));
    } catch (e) {
      console.error("[adaptCurrentOrFutureEvents] skipping event", row.id, e);
    }
  }
  return results;
}

// All published events
export async function getPublishedEvents(): Promise<EventItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("start_datetime", { ascending: true });

  if (error) { console.error("[getPublishedEvents]", error); return []; }
  return adaptCurrentOrFutureEvents(data as unknown as DbEventRow[]);
}

// Single event by slug (published only — public)
export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  // Try primary slug column first
  let { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  // Fall back to slug_v2 in case the URL uses the alternate slug
  if ((error || !data) && !error) {
    const fallback = await supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("slug_v2", slug)
      .eq("status", "published")
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) return null;
  try {
    return adaptEvent(data as unknown as DbEventRow);
  } catch (e) {
    console.error("[getEventBySlug] adaptEvent failed for slug", slug, e);
    return null;
  }
}

// Any-status event by slug — only for the organizer who owns it (preview mode)
export async function getEventBySlugForPreview(
  slug: string,
  clerkId: string,
): Promise<EventItem | null> {
  // Resolve the internal user id first
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (!user) return null;

  let { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .eq("organizer_id", user.id)
    .maybeSingle();

  if ((error || !data) && !error) {
    const fallback = await supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("slug_v2", slug)
      .eq("organizer_id", user.id)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) return null;
  try {
    return adaptEvent(data as unknown as DbEventRow);
  } catch (e) {
    console.error("[getEventBySlugForPreview] adaptEvent failed for slug", slug, e);
    return null;
  }
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
  return adaptCurrentOrFutureEvents(
    (data as unknown as DbEventRow[])
    .filter((row) => row.categories?.slug === categorySlug)
  );
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
  return adaptCurrentOrFutureEvents(data as unknown as DbEventRow[]);
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
  return adaptCurrentOrFutureEvents(
    (data as unknown as DbEventRow[])
    .filter((row) => row.categories?.slug === categorySlug)
    .slice(0, limit)
  );
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

  let results = adaptCurrentOrFutureEvents(data as unknown as DbEventRow[]);

  if (opts.category) {
    results = results.filter((e) => e.categorySlug === opts.category);
  }

  return results;
}

// Collision-resistant event slug (no nanoid dependency)
function shortId(): string {
  return Math.random().toString(36).slice(2, 6);
}

export async function createUniqueEventSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("slug")
    .like("slug", `${base}%`);

  const existingSlugs = new Set((existing ?? []).map((e: { slug: string }) => e.slug));

  if (!existingSlugs.has(base)) return base;

  let candidate: string;
  let attempts = 0;
  do {
    candidate = `${base}-${shortId()}`;
    attempts++;
    if (attempts > 20) throw new Error("Could not generate unique slug after 20 attempts");
  } while (existingSlugs.has(candidate));

  return candidate;
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
  return adaptCurrentOrFutureEvents(data as unknown as DbEventRow[]);
}
