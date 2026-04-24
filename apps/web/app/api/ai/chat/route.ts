import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  buildUserGraphContext,
  buildPersonalizedSystemPrompt,
  formatEventsForPrompt,
} from "../../../../lib/user-graph-context";
import type { AssistantPick, AssistantEvent } from "../../../../lib/ai-assistant";

const groqApiKey = process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY ?? "";
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  message: string;
  picks: AssistantPick[];
  followUps: string[];
};

const EVENT_LOOKAHEAD_DAYS = 45;
const EVENT_LIMIT = 60;
const STOP_WORDS = new Set([
  "a","an","and","at","be","bored","can","do","find","for","give","go","i","im","in","is","it",
  "me","my","of","on","please","show","so","something","tell","the","this","to","want","what","with",
]);

const CATEGORY_KEYWORDS: Array<{ slug: string; words: string[] }> = [
  { slug: "music",      words: ["music","concert","afrobeats","amapiano","dj","party","club","nightlife","live"] },
  { slug: "food-drink", words: ["food","drinks","cocktails","brunch","dinner","bar","rooftop","wine","eat","restaurant"] },
  { slug: "arts",       words: ["art","gallery","exhibition","creative","film","cinema","poetry","spoken","theater"] },
  { slug: "tech",       words: ["tech","startup","founder","developer","product","ai","web3","coding","hackathon"] },
  { slug: "networking", words: ["networking","meetup","community","industry","business","professional","connect"] },
  { slug: "sports",     words: ["sports","football","fitness","run","running","gym","workout","hike","tennis","swim"] },
  { slug: "community",  words: ["culture","festival","outdoor","family","community","market","fair","wellness","yoga"] },
];

function analyzeMessage(message: string) {
  const norm = message.toLowerCase().trim();
  const tokens = Array.from(
    new Set(
      norm.split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t)),
    ),
  );
  const categories = CATEGORY_KEYWORDS.filter(({ words }) =>
    words.some((w) => norm.includes(w)),
  ).map((c) => c.slug);

  const isFree =
    norm.includes("free") ||
    ["cheap", "budget", "affordable"].some((w) => norm.includes(w));

  const now = new Date();
  let timeStart: Date | null = null;
  let timeEnd: Date | null = null;

  if (norm.includes("tonight") || norm.includes("today")) {
    timeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    timeEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (norm.includes("tomorrow")) {
    const t = new Date(now); t.setDate(t.getDate() + 1);
    timeStart = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0);
    timeEnd   = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59);
  } else if (norm.includes("weekend")) {
    const friday = new Date(now);
    friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
    const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2);
    timeStart = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 0, 0, 0);
    timeEnd   = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);
  }

  const locationHints = tokens.filter((t) =>
    ["osu","labone","legon","cantonments","spintex","tema","achimota","accra","kumasi","takoradi","ridge"].includes(t),
  );

  return { tokens, categories, isFree, timeStart, timeEnd, locationHints };
}

type RawEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  start_datetime: string;
  banner_url: string | null;
  saves_count: number | null;
  avg_rating: number | null;
  is_featured: boolean | null;
  price_label: string | null;
  tags: string[] | null;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  venues: { name: string; city: string | null } | { name: string; city: string | null }[] | null;
  ticket_types: { price: number | null; price_type: string | null; is_active: boolean | null }[] | null;
};

function pickFirst<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function excerpt(text: string | null | undefined, max = 120): string {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function getMinPrice(ticketTypes: RawEvent["ticket_types"]): { label: string; value: number } {
  const active = (ticketTypes ?? []).filter((t) => t.is_active !== false);
  if (!active.length) return { label: "Free", value: 0 };
  const prices = active.map((t) => Number(t.price ?? 0)).filter(Number.isFinite);
  if (!prices.length || active.every((t) => !t.price || t.price_type === "free")) return { label: "Free", value: 0 };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { label: min === max ? `GHS ${min}` : `GHS ${min}–${max}`, value: min };
}

export async function POST(req: NextRequest) {
  let body: { message?: string; history?: ChatMessage[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-10) : [];

  // Load user context (non-blocking if not authed)
  const clerk = await currentUser();
  const ctx = clerk ? await buildUserGraphContext(clerk.id) : null;

  // Fetch event candidates
  const now = new Date();
  const upperBound = new Date(now);
  upperBound.setDate(upperBound.getDate() + EVENT_LOOKAHEAD_DAYS);

  const analysis = analyzeMessage(message);

  let eventsQuery = supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, description, short_description, start_datetime, banner_url,
      saves_count, avg_rating, is_featured, price_label, tags,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active)
    `)
    .eq("status", "published")
    .gte("start_datetime", now.toISOString())
    .lte("start_datetime", upperBound.toISOString())
    .order("start_datetime", { ascending: true })
    .limit(EVENT_LIMIT);

  if (analysis.timeStart && analysis.timeEnd) {
    eventsQuery = eventsQuery
      .gte("start_datetime", analysis.timeStart.toISOString())
      .lte("start_datetime", analysis.timeEnd.toISOString());
  }

  const { data: rawEvents } = await eventsQuery;
  const events = (rawEvents as RawEvent[] | null) ?? [];

  // Score and rank
  const savedSet = new Set(ctx?.recentlySavedEventIds ?? []);
  const friendsSet = new Set(ctx?.friendsGoingEventIds ?? []);
  const userInterests = (ctx?.interests ?? []).map((i) => i.toLowerCase());
  const userTopCats = (ctx?.topCategories ?? []).map((c) => c.slug);

  const scored = events
    .map((raw) => {
      const cat = pickFirst(raw.categories);
      const venue = pickFirst(raw.venues);
      const price = getMinPrice(raw.ticket_types);
      const tags = (raw.tags ?? []).map((t) => t.toLowerCase());
      const searchText = [raw.title, raw.description, cat?.name, venue?.name, venue?.city, tags.join(" ")]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (analysis.categories.length > 0 && cat && analysis.categories.includes(cat.slug)) score += 24;
      if (analysis.isFree && price.value === 0) score += 20;
      if (analysis.isFree && price.value > 0) score -= 15;
      for (const token of analysis.tokens) {
        if (raw.title.toLowerCase().includes(token)) score += 8;
        else if (searchText.includes(token)) score += 4;
      }
      for (const hint of analysis.locationHints) {
        if (searchText.includes(hint)) score += 10;
      }
      for (const interest of userInterests) {
        if (searchText.includes(interest)) { score += 6; break; }
      }
      for (const cat_slug of userTopCats) {
        if (cat?.slug === cat_slug) { score += 8; break; }
      }
      if (raw.is_featured) score += 4;
      score += Math.min((raw.saves_count ?? 0) / 10, 6);
      if (savedSet.has(raw.id)) score += 5;

      return {
        raw,
        score,
        cat,
        venue,
        price,
        isFriendsGoing: friendsSet.has(raw.id),
        isSaved: savedSet.has(raw.id),
        shortDesc: excerpt(raw.short_description ?? raw.description),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const eventSummaries = scored.map((s) => ({
    id: s.raw.id,
    title: s.raw.title,
    start_datetime: s.raw.start_datetime,
    price_label: s.price.label,
    venue_name: s.venue?.name ?? null,
    city: s.venue?.city ?? "Accra",
    category_name: s.cat?.name ?? null,
    short_description: s.shortDesc,
    friendsGoing: s.isFriendsGoing,
    userSaved: s.isSaved,
  }));

  const eventsContext = formatEventsForPrompt(eventSummaries);
  const systemPrompt = `${buildPersonalizedSystemPrompt(ctx)}\n\nEVENT CANDIDATES:\n${eventsContext}`;

  // Build Groq messages
  const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Fallback response
  const fallbackPicks = scored.slice(0, 3).map<AssistantPick>((s) => ({
    event_id: s.raw.id,
    title: s.raw.title,
    reason: `${s.raw.title} fits your current search.`,
    event: {
      id: s.raw.id,
      title: s.raw.title,
      slug: s.raw.slug,
      href: `/events/${s.raw.slug}`,
      banner_url: s.raw.banner_url,
      start_datetime: s.raw.start_datetime,
      venue_name: s.venue?.name ?? null,
      city: s.venue?.city ?? "Accra",
      category_name: s.cat?.name ?? null,
      category_slug: s.cat?.slug ?? null,
      price_label: s.price.label,
      price_value: s.price.value,
      short_description: s.shortDesc,
    },
  }));

  const fallback: ChatResponse = {
    message:
      scored.length > 0
        ? `I found ${scored.length} events that might interest you. Here are the top picks.`
        : "I couldn't find matching events right now. Try adjusting the vibe, day, or area.",
    picks: fallbackPicks,
    followUps: ["Show me free options", "What's happening this weekend?", "Find me live music in Accra"],
  };

  if (!groq) return NextResponse.json(fallback);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: groqMessages,
      temperature: 0.55,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      message?: string;
      picks?: Array<{ event_id?: string; reason?: string }>;
      followUps?: string[];
    };

    const scoredMap = new Map(scored.map((s) => [s.raw.id, s]));
    const refinedPicks: AssistantPick[] = [];
    const seen = new Set<string>();

    for (const pick of parsed.picks ?? []) {
      if (!pick.event_id || seen.has(pick.event_id)) continue;
      const s = scoredMap.get(pick.event_id);
      if (!s) continue;
      seen.add(pick.event_id);
      const ev: AssistantEvent = {
        id: s.raw.id,
        title: s.raw.title,
        slug: s.raw.slug,
        href: `/events/${s.raw.slug}`,
        banner_url: s.raw.banner_url,
        start_datetime: s.raw.start_datetime,
        venue_name: s.venue?.name ?? null,
        city: s.venue?.city ?? "Accra",
        category_name: s.cat?.name ?? null,
        category_slug: s.cat?.slug ?? null,
        price_label: s.price.label,
        price_value: s.price.value,
        short_description: s.shortDesc,
      };
      refinedPicks.push({
        event_id: s.raw.id,
        title: s.raw.title,
        reason: (pick.reason ?? "").trim() || `${s.raw.title} matches your vibe.`,
        event: ev,
      });
      if (refinedPicks.length >= 4) break;
    }

    const finalPicks = refinedPicks.length > 0 ? refinedPicks : fallbackPicks;
    const followUps =
      Array.isArray(parsed.followUps) && parsed.followUps.length > 0
        ? parsed.followUps.slice(0, 3)
        : fallback.followUps;

    const response: ChatResponse = {
      message: parsed.message?.trim() || fallback.message,
      picks: finalPicks,
      followUps,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/ai/chat] groq_failed", err);
    return NextResponse.json(fallback);
  }
}
