import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  resolveWhen,
  parseQuery,
  searchEvents,
  searchUsers,
  searchPosts,
  fetchTrendingEvents,
  fetchThisWeekendEvents,
  fetchFreeEvents,
  loadUserInterests,
} from "../../../lib/search";
import type { SearchCursor, SearchApiResponse, DiscoveryModule } from "../../../lib/search";

export const dynamic = "force-dynamic";

const LIMIT_MAX = 20;

function decodeCursor(raw: string | null): SearchCursor | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as SearchCursor;
  } catch {
    return null;
  }
}

function encodeCursor(c: SearchCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q          = (searchParams.get("q") ?? "").trim();
  const type       = (searchParams.get("type") ?? "all") as "all" | "events" | "users" | "posts";
  const limit      = Math.min(Number(searchParams.get("limit") ?? LIMIT_MAX), LIMIT_MAX);
  const cursorRaw  = searchParams.get("cursor") ?? null;
  const when       = searchParams.get("when") ?? "";
  const categories = (searchParams.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Decode cursor — offset is the only thing we need from it
  const cursor = decodeCursor(cursorRaw);
  const offset = Math.max(0, cursor?.offset ?? 0);

  const dateRange = resolveWhen(when || null);
  const intent    = parseQuery(q);

  const hasQuery = q.length >= 1 || categories.length > 0 || !!when;

  // ── Empty search: return discovery modules ─────────────────────────────────
  if (!hasQuery) {
    const [trending, weekend, free] = await Promise.all([
      fetchTrendingEvents(6),
      fetchThisWeekendEvents(6),
      fetchFreeEvents(6),
    ]);

    const allModules: DiscoveryModule[] = [
      { type: "trending" as const, title: "Trending now", items: trending },
      { type: "weekend"  as const, title: "This weekend", items: weekend  },
      { type: "free"     as const, title: "Free events",  items: free     },
    ];
    const discovery: DiscoveryModule[] = allModules.filter((m) => m.items.length > 0);

    return NextResponse.json({
      events: [], users: [], posts: [],
      discovery,
      nextCursor: null,
      intent,
    } satisfies SearchApiResponse);
  }

  // ── Load user interests for personalised ranking (non-blocking) ────────────
  let userInterests = null;
  try {
    const clerk = await currentUser();
    if (clerk) userInterests = await loadUserInterests(clerk.id);
  } catch { /* non-fatal */ }

  const wantsFree = intent.isFreeOnly || intent.budgetMaxGhs === 0;

  // ── Parallel fetch all types based on the requested type filter ────────────
  const [events, users, posts] = await Promise.all([
    type === "all" || type === "events"
      ? searchEvents({ q: intent.cleanedQuery || q, categories, dateRange, limit, offset, userInterests, wantsFree })
      : Promise.resolve([]),
    type === "all" || type === "users"
      ? searchUsers({ q, limit, offset })
      : Promise.resolve([]),
    type === "all" || type === "posts"
      ? searchPosts({ q, limit, offset })
      : Promise.resolve([]),
  ]);

  // ── Build next cursor if any result set hit the limit ─────────────────────
  const hasMore = events.length === limit || users.length === limit || posts.length === limit;
  const nextCursor = hasMore
    ? encodeCursor({ q, type, when, categories: categories.join(","), offset: offset + limit })
    : null;

  return NextResponse.json({
    events,
    users,
    posts,
    discovery: [],
    nextCursor,
    intent,
  } satisfies SearchApiResponse);
}
