import { NextRequest, NextResponse } from "next/server";
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
  // Try ISO date string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
    const d = new Date(when);
    return { from: startOfDay(d), to: endOfDay(d) };
  }
  return null;
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

  const [events, users, snippets] = await Promise.all([
    type === "all" || type === "events"
      ? fetchEvents(q, categories, dateRange, limit, cursor)
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

async function fetchEvents(
  q: string,
  categories: string[],
  dateRange: { from: string; to: string } | null,
  limit: number,
  _cursor: string | null,
) {
  // Build base query
  let query = supabaseAdmin
    .from("events")
    .select("id, title, slug, banner_url, start_datetime, price_label, trending_score, tags, description")
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .limit(limit);

  if (dateRange) {
    query = query
      .gte("start_datetime", dateRange.from)
      .lte("start_datetime", dateRange.to);
  } else {
    // Only show future events by default
    query = query.gte("start_datetime", new Date().toISOString());
  }

  // Apply text search
  if (q) {
    // Try full-text first; fall back to ilike if search_vector is missing
    const { data: ftsData, error: ftsError } = await (query as typeof query)
      .textSearch("search_vector", buildTsQuery(q), { type: "plain", config: "english" });

    if (!ftsError && ftsData && ftsData.length > 0) {
      return applyTagFilter(ftsData, categories);
    }

    // Fallback: case-insensitive ilike search across title, tags
    const terms = q.split(/\s+/).filter(Boolean);
    let ilikeQuery = supabaseAdmin
      .from("events")
      .select("id, title, slug, banner_url, start_datetime, price_label, trending_score, tags, description")
      .eq("status", "published")
      .order("trending_score", { ascending: false })
      .limit(limit);

    if (dateRange) {
      ilikeQuery = ilikeQuery
        .gte("start_datetime", dateRange.from)
        .lte("start_datetime", dateRange.to);
    } else {
      ilikeQuery = ilikeQuery.gte("start_datetime", new Date().toISOString());
    }

    // Use OR filter for each term against title
    for (const term of terms.slice(0, 3)) {
      ilikeQuery = ilikeQuery.ilike("title", `%${term}%`);
    }

    const { data: ilikeData } = await ilikeQuery;

    // If ilike on title returned results, use them
    if (ilikeData && ilikeData.length > 0) {
      return applyTagFilter(ilikeData, categories);
    }

    // Last resort: description search
    const descTerms = terms.slice(0, 2).join(" ");
    const { data: descData } = await supabaseAdmin
      .from("events")
      .select("id, title, slug, banner_url, start_datetime, price_label, trending_score, tags, description")
      .eq("status", "published")
      .gte("start_datetime", dateRange?.from ?? new Date().toISOString())
      .ilike("description", `%${descTerms}%`)
      .order("trending_score", { ascending: false })
      .limit(limit);

    return applyTagFilter(descData ?? [], categories);
  }

  // No text query — filter by date or category only
  if (categories.length > 0) {
    query = query.overlaps("tags", categories);
  }

  const { data } = await query;
  return data ?? [];
}

function buildTsQuery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");
}

function applyTagFilter<T extends { tags: string[] | null }>(
  data: T[],
  categories: string[],
): T[] {
  if (categories.length === 0) return data;
  return data.filter(
    (e) => !e.tags || e.tags.length === 0 || e.tags.some((t) => categories.includes(t)),
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────

async function fetchUsers(q: string, limit: number, _cursor: string | null) {
  if (!q) return [];

  // Try full-text search
  const { data: ftsData, error: ftsError } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score")
    .textSearch("search_vector", buildTsQuery(q), { type: "plain", config: "english" })
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
    .textSearch("search_vector", buildTsQuery(q), { type: "plain", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error?.message?.includes("search_vector") || error?.message?.includes("column")) {
    // Fallback: ilike on body
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
