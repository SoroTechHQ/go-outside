import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type SearchType = "all" | "events" | "users" | "snippets";

const LIMIT_MAX = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q      = (searchParams.get("q") ?? "").trim();
  const type   = (searchParams.get("type") ?? "all") as SearchType;
  const limit  = Math.min(Number(searchParams.get("limit") ?? LIMIT_MAX), LIMIT_MAX);
  const cursor = searchParams.get("cursor") ?? null;

  if (!q) return NextResponse.json({ events: [], users: [], snippets: [], nextCursor: null });

  // Postgres tsquery: wrap in prefix-match for type-ahead
  const tsQuery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  const [events, users, snippets] = await Promise.all([
    (type === "all" || type === "events") ? fetchEvents(tsQuery, limit, cursor) : Promise.resolve([]),
    (type === "all" || type === "users")  ? fetchUsers(tsQuery, limit, cursor)  : Promise.resolve([]),
    (type === "all" || type === "snippets") ? fetchSnippets(tsQuery, limit, cursor) : Promise.resolve([]),
  ]);

  const nextCursor = [events, users, snippets].some((r) => r.length === limit)
    ? btoa(JSON.stringify({ q, type, offset: (Number(cursor ? JSON.parse(atob(cursor)).offset : 0)) + limit }))
    : null;

  return NextResponse.json({ events, users, snippets, nextCursor });
}

async function fetchEvents(tsQuery: string, limit: number, _cursor: string | null) {
  const { data } = await supabaseAdmin
    .from("events")
    .select("id, title, slug, banner_url, start_datetime, price_label, trending_score")
    .eq("status", "published")
    .textSearch("search_vector", tsQuery, { type: "websearch", config: "english" })
    .order("trending_score", { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function fetchUsers(tsQuery: string, limit: number, _cursor: string | null) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("clerk_id, first_name, last_name, username, avatar_url, pulse_tier, pulse_score")
    .textSearch("search_vector", tsQuery, { type: "websearch", config: "english" })
    .limit(limit);
  return data ?? [];
}

async function fetchSnippets(tsQuery: string, limit: number, _cursor: string | null) {
  const { data, error } = await supabaseAdmin
    .from("snippets")
    .select("id, body, vibe_tags, created_at, user_id")
    .textSearch("search_vector", tsQuery, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error?.message?.includes("column") || error?.message?.includes("search_vector")) {
    return []; // snippets table may not have search_vector yet — migration pending
  }
  return data ?? [];
}
