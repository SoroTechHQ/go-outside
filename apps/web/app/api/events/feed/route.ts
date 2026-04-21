import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getPublishedEvents, getFeaturedEvents } from "../../../../lib/db/events";
import { supabaseAdmin } from "../../../../lib/supabase";
import type { EventItem } from "@gooutside/demo-data";

const INITIAL_COUNT = 6;
const PAGE_SIZE = 4;

type Filters = { categories: string[]; query: string; when: string };

// ─── Scarcity state from DB ───────────────────────────────────

type ScarcityRow = {
  event_id: string;
  state: "normal" | "low" | "critical" | "sold_out";
  tickets_remaining: number | null;
  scarcity_label: string;
};

async function getScarcityMap(): Promise<Map<string, ScarcityRow>> {
  const { data } = await supabaseAdmin
    .from("scarcity_state")
    .select("event_id, state, tickets_remaining, scarcity_label");

  const map = new Map<string, ScarcityRow>();
  if (data) {
    for (const row of data as ScarcityRow[]) map.set(row.event_id, row);
  }
  return map;
}

// ─── Graph edge weights (global trending signals) ─────────────

async function getGlobalEdgeWeights(): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, weight")
    .eq("to_type", "event");

  const map = new Map<string, number>();
  if (data) {
    for (const row of data) {
      if (row.to_id) map.set(row.to_id, (map.get(row.to_id) ?? 0) + Number(row.weight ?? 0));
    }
  }
  return map;
}

// ─── User profile for personalisation ────────────────────────

type UserProfile = {
  id:        string;
  interests: string[];
  city:      string | null;
  pulse_tier: string;
};

async function getUserProfile(clerkId: string): Promise<UserProfile | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, interests, location_city_name, pulse_tier")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!data) return null;
  const d = data as { id: string; interests: unknown; location_city_name: string | null; pulse_tier: string | null };
  return {
    id:         d.id,
    interests:  Array.isArray(d.interests) ? (d.interests as string[]) : [],
    city:       d.location_city_name,
    pulse_tier: d.pulse_tier ?? "Explorer",
  };
}

// ─── Social signals — friend activity on events ───────────────

type SocialSignalMap = Map<string, number>; // eventId → weighted friend score

async function getSocialSignals(userId: string, eventIds: string[]): Promise<SocialSignalMap> {
  if (eventIds.length === 0) return new Map();

  // Get friends/follows
  const { data: friendRows } = await supabaseAdmin
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const friendIds = (friendRows ?? []).map((f: { user_a_id: string; user_b_id: string }) =>
    f.user_a_id === userId ? f.user_b_id : f.user_a_id
  );

  if (friendIds.length === 0) return new Map();

  const WEIGHTS: Record<string, number> = {
    registered:  3.0,
    checked_in:  2.5,
    saved:       1.5,
    shared:      1.0,
    viewed:      0.3,
  };

  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, edge_type, from_id")
    .in("to_id", eventIds)
    .in("from_id", friendIds)
    .in("edge_type", Object.keys(WEIGHTS));

  const map = new Map<string, number>();
  for (const edge of edges ?? []) {
    const w = WEIGHTS[edge.edge_type as string] ?? 0;
    map.set(edge.to_id as string, (map.get(edge.to_id as string) ?? 0) + w);
  }
  return map;
}

// ─── Urgency score — events closer in time rank higher ────────

function computeUrgency(startDatetime: string): number {
  const secsUntil = (new Date(startDatetime).getTime() - Date.now()) / 1000;
  if (secsUntil <= 0) return 0;
  if (secsUntil < 86400)     return 1.0;   // < 1 day
  if (secsUntil < 3 * 86400) return 0.7;   // < 3 days
  if (secsUntil < 7 * 86400) return 0.4;   // < 7 days
  return 0.1;
}

// ─── Full scoring formula ─────────────────────────────────────

type DbEventItem = EventItem & { startDatetime?: string; avgRating?: number | null };

function scoreEvent(
  event:         DbEventItem,
  scarcity:      ScarcityRow | undefined,
  edgeWeight:    number,
  socialScore:   number,
  userInterests: string[],
  userCity:      string | null,
): number {
  // Interest match (weighted by position in user's interest list)
  const interestIdx = userInterests.indexOf(event.categorySlug);
  const interest =
    interestIdx === 0 ? 3.0 :
    interestIdx === 1 ? 2.2 :
    interestIdx >= 2  ? 1.5 : 0.3;

  // Location match
  const location = userCity && event.city?.toLowerCase().includes(userCity.toLowerCase()) ? 1.0 : 0.3;

  // Social signals from friends
  const social = Math.min(socialScore * 0.5, 5.0);

  // Trending velocity from global graph edges
  const velocity = Math.min(edgeWeight / 10, 3.0);

  // Quality
  const quality = typeof event.avgRating === "number" ? (event.avgRating / 5) * 1.2 : 0;

  // Urgency
  const urgency = event.startDatetime ? computeUrgency(event.startDatetime) * 1.0 : 0;

  // Price penalty — already handled by category filters but downrank very expensive events for general feed
  const pricePenalty = 0; // TODO: wire user.budget_ceiling when onboarding collects it

  // Featured / curated boost
  const featuredBonus = event.featured ? 2.5 : 0;
  const trendingBonus = event.trending ? 1.5 : 0;

  // Scarcity urgency boost
  const scarcityBonus = scarcity?.state === "critical" ? 1.0 : scarcity?.state === "low" ? 0.5 : 0;

  return (
    interest    * 3.0 +
    location    * 2.5 +
    social      * 2.5 +
    velocity    * 1.5 +
    quality     * 1.2 +
    urgency     * 1.0 +
    featuredBonus     +
    trendingBonus     +
    scarcityBonus     +
    pricePenalty
  );
}

// ─── Filter helpers ───────────────────────────────────────────

function applyFilters(source: EventItem[], { categories, query, when }: Filters) {
  return source.filter((e) => {
    if (categories.length > 0 && !categories.includes(e.categorySlug)) return false;
    if (query) {
      const haystack = `${e.title} ${e.venue} ${e.city} ${e.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (when) {
      const haystack = `${e.dateLabel} ${e.eyebrow}`.toLowerCase();
      if (!haystack.includes(when)) return false;
    }
    return true;
  });
}

// ─── Handler ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page         = parseInt(searchParams.get("page") ?? "0", 10);
  const categories   = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const query        = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const when         = searchParams.get("when")?.trim().toLowerCase() ?? "";
  const featuredOnly = searchParams.get("featured") === "true";
  const limit        = parseInt(searchParams.get("limit") ?? "-1", 10);

  try {
    // Auth — optional, scoring degrades gracefully when unauthenticated
    const clerk = await currentUser();
    const userProfile = clerk ? await getUserProfile(clerk.id) : null;

    // Parallel: events + scarcity + global edge weights
    const [allEvents, scarcityMap, edgeWeightsMap] = await Promise.all([
      featuredOnly ? getFeaturedEvents(limit > 0 ? limit : 8) : getPublishedEvents(),
      getScarcityMap(),
      getGlobalEdgeWeights(),
    ]);

    // Social signals — only fetch when user is authenticated (batch over all event IDs)
    const eventIds      = allEvents.map((e) => e.id);
    const socialSignals = userProfile
      ? await getSocialSignals(userProfile.id, eventIds)
      : new Map<string, number>();

    // Apply search/category filters
    const filtered = applyFilters(allEvents, { categories, query, when });
    const source   = filtered.length > 0
      ? filtered
      : categories.length > 0 || query || when ? [] : allEvents;

    // Rank by personalised score
    const interests = userProfile?.interests ?? [];
    const city      = userProfile?.city ?? null;

    const scored = [...source].sort((a, b) =>
      scoreEvent(b as DbEventItem, scarcityMap.get(b.id), edgeWeightsMap.get(b.id) ?? 0, socialSignals.get(b.id) ?? 0, interests, city) -
      scoreEvent(a as DbEventItem, scarcityMap.get(a.id), edgeWeightsMap.get(a.id) ?? 0, socialSignals.get(a.id) ?? 0, interests, city)
    );

    // Paginate
    const pageLimit = limit > 0 ? limit : (page === 0 ? INITIAL_COUNT : PAGE_SIZE);
    const startIdx  = limit > 0 ? 0 : (page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE);
    const hasMore   = !featuredOnly && limit < 0 && scored.length > startIdx + pageLimit;

    const items = scored.slice(startIdx, startIdx + pageLimit).map((event, i) => {
      const scarcity     = scarcityMap.get(event.id);
      const friendScore  = socialSignals.get(event.id) ?? 0;
      return {
        ...event,
        _feedIndex:  startIdx + i,
        _feedKey:    `${event.id}-${startIdx + i}`,
        scarcity: scarcity ? {
          state:            scarcity.state,
          label:            scarcity.scarcity_label,
          ticketsRemaining: scarcity.tickets_remaining,
        } : undefined,
        _socialScore: friendScore > 0 ? Math.round(friendScore * 10) / 10 : undefined,
      };
    });

    return NextResponse.json({ items, nextPage: page + 1, hasMore, total: scored.length });
  } catch (err) {
    console.error("[/api/events/feed]", err);
    return NextResponse.json(
      { items: [], nextPage: 1, hasMore: false, total: 0 },
      { status: 500 }
    );
  }
}
