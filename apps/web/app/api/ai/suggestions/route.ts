import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// Returns 6 contextual AI starter suggestions based on live app data.
// Called on every fresh load of the AI empty state.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayLabel(): string {
  const d = new Date();
  const hour = d.getHours();
  if (hour >= 17) return "tonight";
  if (hour >= 12) return "this afternoon";
  return "today";
}

function weekendLabel(): string {
  const d = new Date();
  const day = d.getDay();
  if (day === 5 || day === 6 || day === 0) return "this weekend";
  return "this weekend";
}

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString();
  const today = todayLabel();

  // Fetch trending + upcoming events for context
  const [trendingRes, upcomingRes] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("title, categories(name), venues(city), ticket_types(price, is_active)")
      .eq("status", "published")
      .gte("start_datetime", now)
      .order("trending_score", { ascending: false, nullsFirst: false })
      .order("saves_count", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("events")
      .select("title, start_datetime, categories(name), venues(city), ticket_types(price, is_active)")
      .eq("status", "published")
      .gte("start_datetime", now)
      .lte("start_datetime", in7Days)
      .order("start_datetime", { ascending: true })
      .limit(4),
  ]);

  const trending = (trendingRes.data ?? []) as Array<{
    title: string;
    categories: { name: string } | Array<{ name: string }> | null;
    venues: { city: string } | Array<{ city: string }> | null;
    ticket_types: Array<{ price: number | null; is_active: boolean | null }> | null;
  }>;

  const upcoming = (upcomingRes.data ?? []) as Array<{
    title: string;
    start_datetime: string;
    categories: { name: string } | Array<{ name: string }> | null;
    venues: { city: string } | Array<{ city: string }> | null;
    ticket_types: Array<{ price: number | null; is_active: boolean | null }> | null;
  }>;

  function getCategoryName(cats: { name: string } | Array<{ name: string }> | null): string | null {
    if (!cats) return null;
    const c = Array.isArray(cats) ? cats[0] : cats;
    return c?.name ?? null;
  }

  function isEventFree(tickets: Array<{ price: number | null; is_active: boolean | null }> | null): boolean {
    if (!tickets?.length) return true;
    const active = tickets.filter(t => t.is_active !== false);
    if (!active.length) return true;
    return active.every(t => (t.price ?? 0) === 0);
  }

  const suggestions: string[] = [];

  // Slot 1: Trending event specific
  if (trending[0]) {
    suggestions.push(`Tell me about "${trending[0].title}"`);
  } else {
    suggestions.push(`What's trending in Accra ${today}?`);
  }

  // Slot 2: Free events if any exist, else budget
  const hasFreeEvents = upcoming.some(e => isEventFree(e.ticket_types));
  if (hasFreeEvents) {
    suggestions.push(`Free events in Accra ${weekendLabel()}`);
  } else {
    suggestions.push(`Events under GHS 100 ${weekendLabel()}`);
  }

  // Slot 3: Category based on what's happening
  const catCounts: Record<string, number> = {};
  for (const e of [...trending, ...upcoming]) {
    const cat = getCategoryName(e.categories);
    if (cat) catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  }
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topCat) {
    suggestions.push(`${topCat} events near me`);
  } else {
    suggestions.push("Live music near Osu this week");
  }

  // Slot 4: Time-specific
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    suggestions.push("What's happening tonight in Accra?");
  } else {
    const nextFriday = DAY_NAMES[5];
    suggestions.push(`What's on ${nextFriday} night?`);
  }

  // Slot 5: Social / friends
  suggestions.push("What are my friends going to?");

  // Slot 6: Second trending event or budget-based
  if (trending[1]) {
    const isFree = isEventFree(trending[1].ticket_types);
    if (isFree) {
      suggestions.push(`Is "${trending[1].title}" free?`);
    } else {
      suggestions.push(`How much is "${trending[1].title}"?`);
    }
  } else {
    suggestions.push("Suggest events for GHS 200 total budget");
  }

  return NextResponse.json({ suggestions }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
