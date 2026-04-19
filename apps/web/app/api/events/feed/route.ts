import { NextResponse } from "next/server";
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
    for (const row of data as ScarcityRow[]) {
      map.set(row.event_id, row);
    }
  }
  return map;
}

// ─── Graph Edge Weights ───────────────────────────────────────
async function getGlobalEdgeWeights(): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, weight")
    .eq("to_type", "event");

  const map = new Map<string, number>();
  if (data) {
    for (const row of data) {
      if (row.to_id) {
        map.set(row.to_id, (map.get(row.to_id) ?? 0) + Number(row.weight ?? 0));
      }
    }
  }
  return map;
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

// ─── Algorithm: score events for personalised ranking ─────────

function scoreEvent(
  event: EventItem,
  scarcity: ScarcityRow | undefined,
  _categories: string[],
  edgeWeight = 0,
): number {
  let score = 0;
  if (event.featured) score += 20;
  if (event.trending) score += 10;
  score += edgeWeight * 2.5; // Boost based on global graph edge signals
  // Boost events a user's interest categories match
  if (_categories.length > 0 && _categories.includes(event.categorySlug)) score += 15;
  // Boost scarce events (social proof)
  if (scarcity?.state === "critical") score += 8;
  if (scarcity?.state === "low") score += 4;
  return score;
}

// ─── Handler ──────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page        = parseInt(searchParams.get("page") ?? "0", 10);
  const categories  = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const query       = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const when        = searchParams.get("when")?.trim().toLowerCase() ?? "";
  const featuredOnly = searchParams.get("featured") === "true";
  const limit       = parseInt(searchParams.get("limit") ?? "-1", 10);

  try {
    // Parallel: fetch events + scarcity + graph edge signals
    const [allEvents, scarcityMap, edgeWeightsMap] = await Promise.all([
      featuredOnly ? getFeaturedEvents(limit > 0 ? limit : 8) : getPublishedEvents(),
      getScarcityMap(),
      getGlobalEdgeWeights(),
    ]);

    // Apply search/category filters
    const filtered = applyFilters(allEvents, { categories, query, when });
    const source = filtered.length > 0
      ? filtered
      : (categories.length > 0 || query || when ? [] : allEvents);

    // Sort by algorithm score (personalised ranking)
    const scored = [...source].sort(
      (a, b) => scoreEvent(b, scarcityMap.get(b.id), categories, edgeWeightsMap.get(b.id))
              - scoreEvent(a, scarcityMap.get(a.id), categories, edgeWeightsMap.get(a.id))
    );

    // Paginate
    const pageLimit = limit > 0 ? limit : (page === 0 ? INITIAL_COUNT : PAGE_SIZE);
    const startIdx  = limit > 0 ? 0 : (page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE);
    const hasMore   = !featuredOnly && limit < 0 && scored.length > startIdx + pageLimit;

    const items = scored.slice(startIdx, startIdx + pageLimit).map((event, i) => {
      const scarcity = scarcityMap.get(event.id);
      return {
        ...event,
        _feedIndex: startIdx + i,
        _feedKey: `${event.id}-${startIdx + i}`,
        // Attach real scarcity data from DB
        scarcity: scarcity
          ? {
              state: scarcity.state,
              label: scarcity.scarcity_label,
              ticketsRemaining: scarcity.tickets_remaining,
            }
          : undefined,
      };
    });

    return NextResponse.json({
      items,
      nextPage: page + 1,
      hasMore,
      total: scored.length,
    });
  } catch (err) {
    console.error("[/api/events/feed]", err);
    return NextResponse.json(
      { items: [], nextPage: 1, hasMore: false, total: 0 },
      { status: 500 }
    );
  }
}
