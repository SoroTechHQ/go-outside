import { supabaseAdmin } from "../supabase";
import type { GroqTool } from "./groq-client";

// ── Extras cost estimates by category ────────────────────────────────────────
const EXTRAS_BY_CATEGORY: Record<string, { extras: number; transport: number }> = {
  "club-night":    { extras: 120, transport: 30 },
  "nightlife":     { extras: 120, transport: 30 },
  "concert":       { extras: 60,  transport: 25 },
  "music":         { extras: 60,  transport: 25 },
  "rooftop-bar":   { extras: 90,  transport: 25 },
  "food-drink":    { extras: 80,  transport: 20 },
  "food-festival": { extras: 80,  transport: 20 },
  "arts":          { extras: 40,  transport: 20 },
  "tech":          { extras: 0,   transport: 20 },
  "networking":    { extras: 0,   transport: 20 },
  "sports":        { extras: 30,  transport: 25 },
  "wellness":      { extras: 20,  transport: 20 },
  "community":     { extras: 30,  transport: 20 },
  "default":       { extras: 60,  transport: 25 },
};

function estimateExtras(categorySlug: string | null): { extras: number; transport: number } {
  return EXTRAS_BY_CATEGORY[categorySlug ?? "default"] ?? EXTRAS_BY_CATEGORY["default"];
}

function resolveDate(dateStr: string | null | undefined): { from: string; to: string } | null {
  if (!dateStr) return null;
  const now = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  const norm = dateStr.toLowerCase().trim();
  if (norm === "today" || norm === "tonight") {
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  }
  if (norm === "tomorrow") {
    const t = new Date(now); t.setDate(t.getDate() + 1);
    return { from: startOfDay(t).toISOString(), to: endOfDay(t).toISOString() };
  }
  if (norm === "weekend") {
    const fri = new Date(now);
    fri.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
    return { from: startOfDay(fri).toISOString(), to: endOfDay(sun).toISOString() };
  }
  if (norm === "this week") {
    const sun = new Date(now); sun.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    return { from: now.toISOString(), to: endOfDay(sun).toISOString() };
  }
  // Try as raw date
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { from: startOfDay(d).toISOString(), to: endOfDay(d).toISOString() };
    }
  } catch {
    // ignore
  }
  return null;
}

// ── Tool: search_events ───────────────────────────────────────────────────────
export async function searchEvents(args: {
  query?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  date?: string;
  is_free?: boolean;
  city?: string;
  location_hint?: string;
  limit?: number;
}) {
  const now = new Date().toISOString();
  const limit = Math.min(args.limit ?? 8, 20);

  let q = supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, short_description, description, start_datetime,
      banner_url, saves_count, avg_rating, is_featured, tags,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active)
    `)
    .eq("status", "published")
    .gte("start_datetime", now)
    .order("start_datetime", { ascending: true })
    .limit(limit);

  if (args.query) {
    q = q.textSearch("search_vector", args.query, { type: "websearch" });
  }

  const dateRange = resolveDate(args.date) ??
    (args.date_from ? { from: args.date_from, to: args.date_to ?? new Date(Date.now() + 45 * 86400000).toISOString() } : null);
  if (dateRange) {
    q = q.gte("start_datetime", dateRange.from).lte("start_datetime", dateRange.to);
  }

  const { data, error } = await q;
  if (error) return { error: error.message, events: [] };

  const events = (data ?? []).map((e: Record<string, unknown>) => {
    const cat = Array.isArray(e.categories) ? e.categories[0] : e.categories;
    const venue = Array.isArray(e.venues) ? e.venues[0] : e.venues;
    const tickets = (e.ticket_types as Array<{price: number|null; price_type: string|null; is_active: boolean|null}> | null) ?? [];
    const activePrices = tickets.filter(t => t.is_active !== false).map(t => Number(t.price ?? 0));
    const minPrice = activePrices.length ? Math.min(...activePrices) : 0;
    const extras = estimateExtras((cat as {slug?: string} | null)?.slug ?? null);
    const totalEstimate = minPrice + extras.extras + extras.transport;

    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      href: `/events/${e.slug}`,
      start_datetime: e.start_datetime,
      category: (cat as {name?: string} | null)?.name ?? null,
      category_slug: (cat as {slug?: string} | null)?.slug ?? null,
      venue: (venue as {name?: string} | null)?.name ?? null,
      city: (venue as {city?: string} | null)?.city ?? "Accra",
      ticket_price_ghs: minPrice,
      price_label: minPrice === 0 ? "Free" : `GHS ${minPrice}`,
      estimated_extras_ghs: extras.extras + extras.transport,
      estimated_total_ghs: totalEstimate,
      short_description: (e.short_description as string | null) ?? (e.description as string | null)?.slice(0, 120) ?? null,
      banner_url: e.banner_url,
      saves_count: e.saves_count,
      is_featured: e.is_featured,
    };
  });

  return { events, count: events.length };
}

// ── Tool: get_budget_options ──────────────────────────────────────────────────
export async function getBudgetOptions(args: {
  budget_ghs: number;
  date?: string;
  city?: string;
}) {
  const now = new Date().toISOString();
  const dateRange = resolveDate(args.date) ?? { from: now, to: new Date(Date.now() + 3 * 86400000).toISOString() };

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, short_description, description, start_datetime,
      banner_url, is_featured, saves_count,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active)
    `)
    .eq("status", "published")
    .gte("start_datetime", dateRange.from)
    .lte("start_datetime", dateRange.to)
    .order("start_datetime", { ascending: true })
    .limit(40);

  if (error) return { error: error.message, events: [] };

  const budget = args.budget_ghs;
  const events = (data ?? [])
    .map((e: Record<string, unknown>) => {
      const cat = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const venue = Array.isArray(e.venues) ? e.venues[0] : e.venues;
      const tickets = (e.ticket_types as Array<{price: number|null; price_type: string|null; is_active: boolean|null}> | null) ?? [];
      const activePrices = tickets.filter(t => t.is_active !== false).map(t => Number(t.price ?? 0));
      const minPrice = activePrices.length ? Math.min(...activePrices) : 0;
      const extras = estimateExtras((cat as {slug?: string} | null)?.slug ?? null);
      const totalEstimate = minPrice + extras.extras + extras.transport;
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        href: `/events/${e.slug}`,
        banner_url: e.banner_url,
        start_datetime: e.start_datetime,
        category: (cat as {name?: string} | null)?.name ?? null,
        category_slug: (cat as {slug?: string} | null)?.slug ?? null,
        venue: (venue as {name?: string} | null)?.name ?? null,
        city: (venue as {city?: string} | null)?.city ?? "Accra",
        ticket_price_ghs: minPrice,
        estimated_extras_ghs: extras.extras + extras.transport,
        estimated_total_ghs: totalEstimate,
        fits_budget: totalEstimate <= budget,
        budget_remaining_ghs: budget - totalEstimate,
        cost_breakdown: `Ticket GHS ${minPrice} + extras est. GHS ${extras.extras + extras.transport} = GHS ${totalEstimate} total`,
        price_label: minPrice === 0 ? "Free" : `GHS ${minPrice}`,
        short_description: (e.short_description as string | null) ?? (e.description as string | null)?.slice(0, 120) ?? null,
      };
    })
    .filter(e => e.estimated_total_ghs <= budget * 1.15) // allow 15% stretch
    .sort((a, b) => {
      // Prefer those that fit budget; among those, prefer cheaper
      if (a.fits_budget && !b.fits_budget) return -1;
      if (!a.fits_budget && b.fits_budget) return 1;
      return a.estimated_total_ghs - b.estimated_total_ghs;
    })
    .slice(0, 8);

  return {
    budget_ghs: budget,
    date_range: args.date ?? "next few days",
    events,
    count: events.length,
  };
}

// ── Tool: get_trending_events ─────────────────────────────────────────────────
export async function getTrendingEvents(args: {
  city?: string;
  category?: string;
  limit?: number;
}) {
  const now = new Date().toISOString();
  const limit = Math.min(args.limit ?? 6, 12);

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, short_description, banner_url, start_datetime,
      saves_count, avg_rating, trending_score,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active)
    `)
    .eq("status", "published")
    .gte("start_datetime", now)
    .order("trending_score", { ascending: false, nullsFirst: false })
    .order("saves_count", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return { error: error.message, events: [] };

  const events = (data ?? []).map((e: Record<string, unknown>) => {
    const cat = Array.isArray(e.categories) ? e.categories[0] : e.categories;
    const venue = Array.isArray(e.venues) ? e.venues[0] : e.venues;
    const tickets = (e.ticket_types as Array<{price: number|null; price_type: string|null; is_active: boolean|null}> | null) ?? [];
    const activePrices = tickets.filter(t => t.is_active !== false).map(t => Number(t.price ?? 0));
    const minPrice = activePrices.length ? Math.min(...activePrices) : 0;
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      href: `/events/${e.slug}`,
      banner_url: e.banner_url,
      start_datetime: e.start_datetime,
      category: (cat as {name?: string} | null)?.name ?? null,
      category_slug: (cat as {slug?: string} | null)?.slug ?? null,
      venue: (venue as {name?: string} | null)?.name ?? null,
      city: (venue as {city?: string} | null)?.city ?? "Accra",
      price_label: minPrice === 0 ? "Free" : `GHS ${minPrice}`,
      saves_count: e.saves_count,
      trending_score: e.trending_score,
      short_description: e.short_description,
    };
  });

  return { events, count: events.length };
}

// ── Tool: get_user_profile ────────────────────────────────────────────────────
export async function getUserProfile(clerkId: string) {
  if (!clerkId) return { error: "Not authenticated", profile: null };

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, pulse_score, pulse_tier, interests, location_city_name, bio")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return { profile: null };

  const [savedResult, ticketsResult, edgesResult] = await Promise.all([
    supabaseAdmin
      .from("graph_edges")
      .select("to_id")
      .eq("from_id", user.id)
      .eq("edge_type", "save")
      .limit(10),
    supabaseAdmin
      .from("tickets")
      .select("events!inner(title, categories(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("graph_edges")
      .select("to_id, edge_type")
      .eq("from_id", user.id)
      .in("edge_type", ["follows", "friends"])
      .limit(20),
  ]);

  const recentEvents = (ticketsResult.data ?? [])
    .map((t: Record<string, unknown>) => {
      const ev = Array.isArray(t.events) ? t.events[0] : t.events;
      return (ev as {title?: string} | null)?.title;
    })
    .filter(Boolean);

  return {
    profile: {
      pulse_score: user.pulse_score,
      pulse_tier: user.pulse_tier,
      interests: user.interests ?? [],
      city: user.location_city_name ?? "Accra",
      bio: user.bio,
      saved_event_count: savedResult.data?.length ?? 0,
      recently_attended: recentEvents,
      social_connections: edgesResult.data?.length ?? 0,
    },
  };
}

// ── Tool: get_event_details ───────────────────────────────────────────────────
export async function getEventDetails(args: {
  event_id?: string;
  event_slug?: string;
}) {
  if (!args.event_id && !args.event_slug) return { error: "event_id or event_slug required" };

  let q = supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, description, short_description, start_datetime, end_datetime,
      banner_url, cover_url, status, tags, is_featured, avg_rating,
      categories (name, slug),
      venues (name, city, address),
      organizers (id, name, bio, logo_url),
      ticket_types (id, name, price, price_type, capacity, is_active)
    `);

  if (args.event_id) {
    q = q.eq("id", args.event_id);
  } else {
    q = q.eq("slug", args.event_slug!);
  }

  const { data, error } = await q.maybeSingle();
  if (error || !data) return { error: error?.message ?? "Event not found" };

  return { event: data };
}

// ── Tool: get_friends_activity ────────────────────────────────────────────────
export async function getFriendsActivity(clerkId: string, args: { upcoming_only?: boolean }) {
  if (!clerkId) return { error: "Not authenticated", events: [] };

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return { events: [] };

  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id")
    .eq("from_id", user.id)
    .in("edge_type", ["follows", "friends"])
    .limit(30);

  const friendIds = (edges ?? []).map((e: {to_id: string}) => e.to_id).filter(Boolean);
  if (friendIds.length === 0) return { events: [], message: "No friends or follows found yet." };

  const now = new Date().toISOString();
  let ticketQ = supabaseAdmin
    .from("tickets")
    .select("event_id, user_id, events!inner(id, title, slug, start_datetime, banner_url, categories(name,slug), venues(name,city))")
    .in("user_id", friendIds);

  if (args.upcoming_only !== false) {
    ticketQ = ticketQ.gte("events.start_datetime", now);
  }

  const { data: tickets } = await ticketQ.limit(20);

  const eventMap = new Map<string, { event: Record<string, unknown>; friends_count: number }>();
  for (const ticket of tickets ?? []) {
    const ev = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
    if (!ev) continue;
    const id = ev.id as string;
    if (eventMap.has(id)) {
      eventMap.get(id)!.friends_count++;
    } else {
      eventMap.set(id, { event: ev as Record<string, unknown>, friends_count: 1 });
    }
  }

  const events = Array.from(eventMap.values())
    .sort((a, b) => b.friends_count - a.friends_count)
    .map(({ event: e, friends_count }) => {
      const cat = Array.isArray(e.categories) ? (e.categories as unknown[])[0] : e.categories;
      const venue = Array.isArray(e.venues) ? (e.venues as unknown[])[0] : e.venues;
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        href: `/events/${e.slug}`,
        banner_url: e.banner_url,
        start_datetime: e.start_datetime,
        category: (cat as {name?: string} | null)?.name ?? null,
        venue: (venue as {name?: string} | null)?.name ?? null,
        city: (venue as {city?: string} | null)?.city ?? "Accra",
        friends_going: friends_count,
        social_proof: friends_count === 1 ? "1 person you follow is going" : `${friends_count} people you follow are going`,
      };
    });

  return { events, count: events.length };
}

// ── Tool: get_organizer_events ────────────────────────────────────────────────
export async function getOrganizerEvents(args: {
  organizer_name?: string;
  organizer_id?: string;
  upcoming_only?: boolean;
}) {
  const now = new Date().toISOString();

  let q = supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, short_description, start_datetime, banner_url,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active),
      organizers (id, name, logo_url)
    `)
    .eq("status", "published");

  if (args.upcoming_only !== false) {
    q = q.gte("start_datetime", now);
  }

  if (args.organizer_id) {
    q = q.eq("organizer_id", args.organizer_id);
  } else if (args.organizer_name) {
    const { data: org } = await supabaseAdmin
      .from("organizers")
      .select("id")
      .ilike("name", `%${args.organizer_name}%`)
      .maybeSingle();
    if (!org) return { error: `Organizer "${args.organizer_name}" not found`, events: [] };
    q = q.eq("organizer_id", org.id);
  }

  const { data, error } = await q.order("start_datetime", { ascending: true }).limit(10);
  if (error) return { error: error.message, events: [] };

  return { events: data ?? [], count: (data ?? []).length };
}

// ── Tool registry — maps LLM tool names to executor functions ─────────────────
export type ToolName =
  | "search_events"
  | "get_budget_options"
  | "get_trending_events"
  | "get_user_profile"
  | "get_event_details"
  | "get_friends_activity"
  | "get_organizer_events";

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  clerkId: string,
): Promise<unknown> {
  const normalizedArgs = normalizeToolArgs(args);
  switch (name) {
    case "search_events":         return searchEvents(normalizedArgs as Parameters<typeof searchEvents>[0]);
    case "get_budget_options":    return getBudgetOptions(normalizedArgs as Parameters<typeof getBudgetOptions>[0]);
    case "get_trending_events":   return getTrendingEvents(normalizedArgs as Parameters<typeof getTrendingEvents>[0]);
    case "get_user_profile":      return getUserProfile(clerkId);
    case "get_event_details":     return getEventDetails(normalizedArgs as Parameters<typeof getEventDetails>[0]);
    case "get_friends_activity":  return getFriendsActivity(clerkId, normalizedArgs as { upcoming_only?: boolean });
    case "get_organizer_events":  return getOrganizerEvents(normalizedArgs as Parameters<typeof getOrganizerEvents>[0]);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function normalizeToolArgs(args: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (value === "" || value === null || typeof value === "undefined") continue;

    if (["limit", "budget_ghs"].includes(key) && typeof value === "string") {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) normalized[key] = numeric;
      continue;
    }

    if (["is_free", "upcoming_only"].includes(key) && typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true") normalized[key] = true;
      if (lower === "false") normalized[key] = false;
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

// ── Groq tool definitions (sent to LLM) ──────────────────────────────────────
export const GOOUTSIDE_TOOLS: GroqTool[] = [
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search GoOutside events by keyword, category, location, date, or vibe. Use this for general event discovery.",
      parameters: {
        type: "object",
        properties: {
          query:         { type: "string",  description: "Free text to search" },
          category:      { type: "string",  description: "music | food-drink | arts | tech | networking | sports | community | nightlife | wellness" },
          date:          { type: "string",  description: "today | tonight | tomorrow | weekend | this week | monday...sunday | YYYY-MM-DD" },
          is_free:       { type: "boolean", description: "Only return free events" },
          city:          { type: "string",  description: "Accra | Kumasi | Takoradi" },
          location_hint: { type: "string",  description: "Neighborhood: Osu | Labone | East Legon | Spintex | Tema | Legon | Ridge | Cantonments" },
          limit:         { type: "number",  description: "Number of results (default 8, max 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_budget_options",
      description: "Find events the user can actually afford. Accounts for ticket price PLUS estimated extras (drinks, food, transport). Use whenever user mentions a specific GHS amount or budget.",
      parameters: {
        type: "object",
        required: ["budget_ghs"],
        properties: {
          budget_ghs: { type: "number", description: "Total budget in Ghana Cedis (GHS)" },
          date:       { type: "string", description: "today | tonight | tomorrow | weekend | YYYY-MM-DD" },
          city:       { type: "string", description: "Accra | Kumasi | Takoradi" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_trending_events",
      description: "Get what's trending and popular on GoOutside right now. Use when user asks what's hot, buzzing, viral, or popular.",
      parameters: {
        type: "object",
        properties: {
          city:     { type: "string", description: "Accra | Kumasi | Takoradi" },
          category: { type: "string" },
          limit:    { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Get the current user's interests, pulse score, tier, city, and recent activity. Call this first in any personalized recommendation to understand who you're talking to.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_event_details",
      description: "Get full details about one specific event. Use when user asks about a specific event by name or wants to know more about it.",
      parameters: {
        type: "object",
        properties: {
          event_id:   { type: "string" },
          event_slug: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_friends_activity",
      description: "Find what events the user's friends and followed people are going to. Use when user asks about social plans or what their network is doing.",
      parameters: {
        type: "object",
        properties: {
          upcoming_only: { type: "boolean", description: "Default true" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_organizer_events",
      description: "Get upcoming events from a specific event organizer or brand. Use when user asks about events by a particular organizer.",
      parameters: {
        type: "object",
        properties: {
          organizer_name: { type: "string" },
          organizer_id:   { type: "string" },
          upcoming_only:  { type: "boolean" },
        },
      },
    },
  },
];
