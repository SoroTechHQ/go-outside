import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type SearchType = "all" | "events" | "users" | "snippets";

const LIMIT_MAX = 20;

// Resolve "when" chip / raw value to a UTC date range
function resolveWhen(when: string): { from: string; to: string } | null {
  if (!when) return null;
  const now = new Date();

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
  const addDays = (d: Date, n: number) => {
    const r = new Date(d); r.setDate(r.getDate() + n); return r;
  };
  const nextWeekday = (base: Date, target: number) => {
    const r = new Date(base);
    const diff = (target - r.getDay() + 7) % 7;
    r.setDate(r.getDate() + diff);
    return r;
  };

  if (when === "weekend") {
    const friday = nextWeekday(now, 5);
    const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2);
    return { from: startOfDay(friday), to: endOfDay(sunday) };
  }
  if (when === "next-week") {
    const monday = nextWeekday(addDays(now, 1), 1);
    const sunday = addDays(monday, 6);
    return { from: startOfDay(monday), to: endOfDay(sunday) };
  }
  if (when === "month") {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: startOfDay(now), to: endOfDay(end) };
  }
  // "YYYY-MM-DD:YYYY-MM-DD" range from calendar
  if (/^\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/.test(when)) {
    const [fromDate, toDate] = when.split(":") as [string, string];
    return { from: startOfDay(new Date(fromDate)), to: endOfDay(new Date(toDate)) };
  }
  // ISO date string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
    const d = new Date(when);
    return { from: startOfDay(d), to: endOfDay(d) };
  }
  return null;
}

// User interest profile for personalized ranking
type UserInterests = {
  topCategories: string[];
  interests: string[];
  pulseScore: number;
};

async function loadUserInterests(clerkId: string): Promise<UserInterests | null> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("vibe, interests, pulse_score")
      .eq("clerk_id", clerkId)
      .single();

    if (!data) return null;

    const vibe = (data.vibe as { categories?: string[] } | null) ?? {};
    const topCategories = (vibe.categories ?? []).slice(0, 5);
    const interests = ((data.interests as string[] | null) ?? []).slice(0, 10);
    const pulseScore = (data.pulse_score as number | null) ?? 0;

    return { topCategories, interests, pulseScore };
  } catch {
    return null;
  }
}

// Rank events by user interest match
function rankByInterests(events: EventRow[], userInterests: UserInterests | null): EventRow[] {
  if (!userInterests || (userInterests.topCategories.length === 0 && userInterests.interests.length === 0)) {
    return events;
  }

  const catSet = new Set(userInterests.topCategories.map((c) => c.toLowerCase()));
  const interestTerms = userInterests.interests.map((i) => i.toLowerCase());

  return [...events].sort((a, b) => {
    return computePersonalScore(b, catSet, interestTerms) - computePersonalScore(a, catSet, interestTerms);
  });
}

function computePersonalScore(
  event: EventRow,
  catSet: Set<string>,
  interestTerms: string[],
): number {
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  let score = (event.trending_score ?? 0) * 0.5;

  for (const tag of tags) {
    if (catSet.has(tag)) score += 20;
  }

  for (const term of interestTerms) {
    for (const tag of tags) {
      if (tag.includes(term) || term.includes(tag)) { score += 8; break; }
    }
  }

  return score;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q          = (searchParams.get("q") ?? "").trim();
  const type       = (searchParams.get("type") ?? "all") as SearchType;
  const limit      = Math.min(Number(searchParams.get("limit") ?? LIMIT_MAX), LIMIT_MAX);
  const cursor     = searchParams.get("cursor") ?? null;
  const when       = searchParams.get("when") ?? "";
  const categories = (searchParams.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dateRange = resolveWhen(when);

  if (!q && categories.length === 0 && !dateRange) {
    return NextResponse.json({ events: [], users: [], snippets: [], nextCursor: null });
  }

  // Load user interests for personalized ranking (non-blocking)
  let userInterests: UserInterests | null = null;
  try {
    const clerk = await currentUser();
    if (clerk) {
      userInterests = await loadUserInterests(clerk.id);
    }
  } catch {
    // Non-fatal — proceed without personalization
  }

  const [events, users, snippets] = await Promise.all([
    type === "all" || type === "events"
      ? fetchEvents(q, categories, dateRange, limit, cursor, userInterests)
      : Promise.resolve([]),
    type === "all" || type === "users"
      ? fetchUsers(q, limit, cursor)
      : Promise.resolve([]),
    type === "all" || type === "snippets"
      ? fetchSnippets(q, limit, cursor)
      : Promise.resolve([]),
  ]);

  const nextCursor = [events, users, snippets].some((r) => r.length === limit)
    ? btoa(
        JSON.stringify({
          q,
          type,
          offset: (cursor ? (JSON.parse(atob(cursor)) as { offset: number }).offset : 0) + limit,
        }),
      )
    : null;

  return NextResponse.json({ events, users, snippets, nextCursor });
}

// ── Events ────────────────────────────────────────────────────────────────────

type EventRow = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
  start_datetime: string | null;
  price_label: string | null;
  trending_score: number | null;
  tags: string[] | null;
  description: string | null;
};

const EVENT_SELECT = "id, title, slug, banner_url, start_datetime, price_label, trending_score, tags, description";
const NOW_ISO = () => new Date().toISOString();

async function fetchEvents(
  q: string,
  categories: string[],
  dateRange: { from: string; to: string } | null,
  limit: number,
  _cursor: string | null,
  userInterests: UserInterests | null,
): Promise<EventRow[]> {
  const fromDate = dateRange?.from ?? NOW_ISO();
  const toDate   = dateRange?.to ?? null;

  // No text query — return trending/upcoming filtered by date or category
  if (!q) {
    let query = supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .gte("start_datetime", fromDate)
      .order("trending_score", { ascending: false })
      .limit(limit);

    if (toDate) query = query.lte("start_datetime", toDate);
    if (categories.length > 0) query = query.overlaps("tags", categories);

    const { data } = await query;
    return rankByInterests((data ?? []) as EventRow[], userInterests);
  }

  // Short queries (1–2 chars): fast prefix ilike for typeahead
  if (q.length <= 2) {
    let q1 = supabaseAdmin
      .from("events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .ilike("title", `${q}%`)
      .gte("start_datetime", fromDate)
      .order("trending_score", { ascending: false })
      .limit(limit);
    if (toDate) q1 = q1.lte("start_datetime", toDate);
    if (categories.length > 0) q1 = q1.overlaps("tags", categories);
    const { data } = await q1;
    return rankByInterests((data ?? []) as EventRow[], userInterests);
  }

  // Use the RPC: websearch FTS + prefix :* + ilike — all in one DB round-trip
  // with date + category filters applied inside Postgres (see docs/012_search_fix.sql)
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "search_events_prefix",
    {
      q,
      p_categories: categories.length > 0 ? categories : [],
      p_from: fromDate,
      p_to: toDate,
      p_limit: limit,
    },
  );

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rankByInterests(rpcData as EventRow[], userInterests);
  }

  // Hard fallback: title ilike without date filter (maximises recall for typeahead)
  let fallback = supabaseAdmin
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .ilike("title", `%${q}%`)
    .order("trending_score", { ascending: false })
    .limit(limit);
  if (categories.length > 0) fallback = fallback.overlaps("tags", categories);

  const { data: fallbackData } = await fallback;
  return rankByInterests((fallbackData ?? []) as EventRow[], userInterests);
}

// websearch_to_tsquery wrapper — used by fetchUsers and fetchSnippets
function buildWebsearchQuery(q: string): string {
  return q.trim();
}

// ── Users ─────────────────────────────────────────────────────────────────────

async function fetchUsers(q: string, limit: number, _cursor: string | null) {
  if (!q) return [];

  // Short query: prefix match on username
  if (q.length <= 2) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score")
      .or(`username.ilike.${q}%,first_name.ilike.${q}%`)
      .limit(limit);
    return data ?? [];
  }

  // Try full-text search
  const { data: ftsData, error: ftsError } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score")
    .textSearch("search_vector", buildWebsearchQuery(q), { type: "websearch", config: "english" })
    .limit(limit);

  if (!ftsError && ftsData && ftsData.length > 0) return ftsData;

  // Fallback: ilike on username, first_name, last_name
  const { data } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score")
    .or(
      `username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
    )
    .limit(limit);

  return data ?? [];
}

// ── Snippets ──────────────────────────────────────────────────────────────────

async function fetchSnippets(q: string, limit: number, _cursor: string | null) {
  if (!q) return [];

  const { data, error } = await supabaseAdmin
    .from("snippets")
    .select("id, body, vibe_tags, created_at, user_id")
    .textSearch("search_vector", buildWebsearchQuery(q), { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error?.message?.includes("search_vector") || error?.message?.includes("column")) {
    const { data: fallback } = await supabaseAdmin
      .from("snippets")
      .select("id, body, vibe_tags, created_at, user_id")
      .ilike("body", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(limit);
    return fallback ?? [];
  }

  return data ?? [];
}
