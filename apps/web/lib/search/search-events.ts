import { supabaseAdmin } from "../supabase";
import { rankEvents } from "./rank-events";
import type { EventRow, DateRange, UserInterests } from "./types";

const EVENT_SELECT =
  "id, title, slug, banner_url, start_datetime, price_label, trending_score, tags, description";

const NOW_ISO = () => new Date().toISOString();

// Escape characters that break PostgREST `.or()` string construction.
// We avoid raw `.or()` with user text entirely — prefer ilike with parameterised binding.
function safeLike(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

export async function searchEvents(opts: {
  q: string;
  categories: string[];
  dateRange: DateRange | null;
  limit: number;
  offset: number;
  userInterests: UserInterests | null;
  wantsFree?: boolean;
}): Promise<EventRow[]> {
  const { q, categories, dateRange, limit, offset, userInterests, wantsFree } = opts;
  const fromDate = dateRange?.from ?? NOW_ISO();
  const toDate = dateRange?.to ?? null;

  // ── No text query: trending / category browse ──────────────────────────────
  if (!q) {
    let query = supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .gte("start_datetime", fromDate)
      .order("trending_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (toDate) query = query.lte("start_datetime", toDate);
    if (categories.length > 0) query = query.overlaps("tags", categories);
    if (wantsFree) query = query.eq("price_label", "Free");

    const { data } = await query;
    return rankEvents(
      (data ?? []) as EventRow[],
      "",
      categories,
      userInterests,
      { wantsFree },
    );
  }

  // ── Short queries (1–2 chars): fast prefix ilike for typeahead ─────────────
  if (q.length <= 2) {
    let q1 = supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .ilike("title", `${safeLike(q)}%`)
      .gte("start_datetime", fromDate)
      .order("trending_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (toDate) q1 = q1.lte("start_datetime", toDate);
    if (categories.length > 0) q1 = q1.overlaps("tags", categories);

    const { data } = await q1;
    return rankEvents((data ?? []) as EventRow[], q, categories, userInterests);
  }

  // ── Full-text search via RPC ───────────────────────────────────────────────
  // The `search_events_prefix` RPC handles: websearch FTS + prefix :* + ilike,
  // all inside Postgres with date + category filters applied.
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "search_events_prefix",
    {
      q,
      p_categories: categories.length > 0 ? categories : [],
      p_from: fromDate,
      p_to: toDate,
      p_limit: limit,
      p_offset: offset,
    },
  );

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rankEvents(rpcData as EventRow[], q, categories, userInterests, { wantsFree });
  }

  // ── Hard fallback: separate ilike queries — no raw string composition ───────
  // We intentionally avoid building `.or("title.ilike.%${q}%,description.ilike.%${q}%")`
  // because special characters in q (commas, braces, etc.) break PostgREST parsing.
  // Instead we run two separate queries and merge, deduplicating by id.

  const safe = safeLike(q);

  const [titleRes, descRes] = await Promise.all([
    (() => {
      let t = supabaseAdmin
        .from("events")
        .select(EVENT_SELECT)
        .eq("status", "published")
        .ilike("title", `%${safe}%`)
        .gte("start_datetime", fromDate)
        .order("trending_score", { ascending: false })
        .limit(limit);

      if (toDate) t = t.lte("start_datetime", toDate);
      if (categories.length > 0) t = t.overlaps("tags", categories);
      return t;
    })(),
    (() => {
      let d = supabaseAdmin
        .from("events")
        .select(EVENT_SELECT)
        .eq("status", "published")
        .ilike("description", `%${safe}%`)
        .gte("start_datetime", fromDate)
        .order("trending_score", { ascending: false })
        .limit(limit);

      if (toDate) d = d.lte("start_datetime", toDate);
      if (categories.length > 0) d = d.overlaps("tags", categories);
      return d;
    })(),
  ]);

  const seen = new Set<string>();
  const merged: EventRow[] = [];
  for (const row of [...(titleRes.data ?? []), ...(descRes.data ?? [])]) {
    const r = row as EventRow;
    if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
  }

  // Apply offset to merged fallback results
  const paged = merged.slice(offset, offset + limit);
  return rankEvents(paged, q, categories, userInterests, { wantsFree });
}

// ── Discovery modules for empty / broad search ─────────────────────────────────

export async function fetchTrendingEvents(limit = 6): Promise<EventRow[]> {
  const { data } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("start_datetime", NOW_ISO())
    .order("trending_score", { ascending: false })
    .limit(limit);
  return (data ?? []) as EventRow[];
}

export async function fetchThisWeekendEvents(limit = 6): Promise<EventRow[]> {
  const now = new Date();
  // Friday of this week
  const daysToFri = (5 - now.getDay() + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFri);
  friday.setHours(0, 0, 0, 0);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  const { data } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("start_datetime", friday.toISOString())
    .lte("start_datetime", sunday.toISOString())
    .order("trending_score", { ascending: false })
    .limit(limit);
  return (data ?? []) as EventRow[];
}

export async function fetchFreeEvents(limit = 6): Promise<EventRow[]> {
  const { data } = await supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("start_datetime", NOW_ISO())
    .ilike("price_label", "free%")
    .order("trending_score", { ascending: false })
    .limit(limit);
  return (data ?? []) as EventRow[];
}
