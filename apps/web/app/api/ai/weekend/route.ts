import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "../../../../lib/supabase";
import type {
  AssistantEvent,
  AssistantPick,
  AssistantResponse,
} from "../../../../lib/ai-assistant";

const groqApiKey = process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY ?? "";
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const EVENT_LOOKAHEAD_DAYS = 45;
const EVENT_LIMIT = 80;
const MAX_PICKS = 4;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "best",
  "do",
  "event",
  "events",
  "for",
  "go",
  "i",
  "in",
  "me",
  "my",
  "of",
  "on",
  "show",
  "something",
  "that",
  "the",
  "this",
  "to",
  "want",
  "with",
]);

const CATEGORY_KEYWORDS: Array<{ slug: string; label: string; words: string[] }> = [
  { slug: "music", label: "music", words: ["music", "live music", "concert", "concerts", "afrobeats", "amapiano", "dj", "party", "club", "nightlife"] },
  { slug: "food-drink", label: "food and drinks", words: ["food", "drinks", "cocktails", "brunch", "dinner", "bar", "rooftop", "wine", "supper"] },
  { slug: "arts", label: "arts", words: ["art", "arts", "gallery", "exhibition", "creative", "paint", "film", "cinema", "poetry", "spoken word"] },
  { slug: "tech", label: "tech", words: ["tech", "startup", "founder", "builders", "developer", "product", "ai", "web3", "coding"] },
  { slug: "networking", label: "networking", words: ["networking", "network", "meetup", "community", "industry", "business", "professional"] },
  { slug: "sports", label: "sports", words: ["sports", "football", "fitness", "run", "running", "gym", "workout", "hike", "tennis"] },
  { slug: "community", label: "community", words: ["culture", "festival", "outdoor", "family", "community", "market", "fair", "wellness"] },
];

type UserProfile = {
  id: string;
  pulse_score: number;
  pulse_tier: string | null;
  interests: string[] | null;
  location_city_name: string | null;
};

type CategoryRow = {
  name: string;
  slug: string;
} | null;

type VenueRow = {
  name: string;
  city: string | null;
} | null;

type TicketTypeRow = {
  price: number | null;
  price_type: "free" | "paid" | null;
  is_active: boolean | null;
};

type RawEventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  banner_url: string | null;
  custom_location: string | null;
  is_online: boolean | null;
  tags: string[] | null;
  is_featured: boolean | null;
  saves_count: number | null;
  avg_rating: number | null;
  reviews_count: number | null;
  categories: CategoryRow | CategoryRow[] | null;
  venues: VenueRow | VenueRow[] | null;
  ticket_types: TicketTypeRow[] | null;
};

type EventCandidate = AssistantEvent & {
  end_datetime: string | null;
  tags: string[];
  searchable_text: string;
  title_text: string;
  day_key: string;
  start_ms: number;
  hour: number;
  is_featured: boolean;
  social_score: number;
};

type TimeWindow = {
  label: string;
  start: number;
  end: number;
  strict: boolean;
};

type TimePreference = {
  label: string;
  startHour: number;
  endHour: number;
};

type QueryAnalysis = {
  original: string;
  normalized: string;
  tokens: string[];
  categorySlugs: string[];
  categoryLabels: string[];
  priceMode: "free" | "budget" | "premium" | null;
  timeWindow: TimeWindow | null;
  timePreference: TimePreference | null;
  locationHints: string[];
  vibeHints: string[];
};

type ScoredCandidate = {
  event: EventCandidate;
  score: number;
  strictMatch: boolean;
  signals: string[];
  fallbackReason: string;
};

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function excerpt(text: string | null | undefined, maxLength = 144): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "Worth a look on GoOutside.";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatPrice(ticketTypes: TicketTypeRow[] | null | undefined): { label: string; value: number } {
  const active = (ticketTypes ?? []).filter((ticket) => ticket.is_active !== false);
  if (active.length === 0) {
    return { label: "Free", value: 0 };
  }

  const numericPrices = active
    .map((ticket) => Number(ticket.price ?? 0))
    .filter((price) => Number.isFinite(price));

  if (numericPrices.length === 0 || active.every((ticket) => ticket.price_type === "free" || Number(ticket.price ?? 0) === 0)) {
    return { label: "Free", value: 0 };
  }

  const minPrice = Math.min(...numericPrices);
  const maxPrice = Math.max(...numericPrices);

  return {
    label: minPrice === maxPrice
      ? `GHS ${minPrice.toLocaleString()}`
      : `GHS ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`,
    value: minPrice,
  };
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function nextWeekday(base: Date, targetDay: number): Date {
  const result = new Date(base);
  const currentDay = result.getDay();
  const diff = (targetDay - currentDay + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function nextWeekendWindow(base: Date): TimeWindow {
  const friday = nextWeekday(base, 5);
  const sunday = nextWeekday(friday, 0);
  return {
    label: "this weekend",
    start: startOfDay(friday).getTime(),
    end: endOfDay(sunday).getTime(),
    strict: true,
  };
}

function analyzeQuery(message: string): QueryAnalysis {
  const normalized = message.toLowerCase().trim();
  const tokens = Array.from(new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  ));

  const categoryMatches = CATEGORY_KEYWORDS.filter(({ words }) =>
    words.some((word) => normalized.includes(word))
  );

  const priceMode = normalized.includes("free")
    ? "free"
    : ["cheap", "budget", "affordable", "under", "low cost"].some((word) => normalized.includes(word))
      ? "budget"
      : ["premium", "vip", "luxury", "exclusive", "high-end"].some((word) => normalized.includes(word))
        ? "premium"
        : null;

  const now = new Date();
  let timeWindow: TimeWindow | null = null;

  if (normalized.includes("tonight") || normalized.includes("today")) {
    timeWindow = {
      label: normalized.includes("tonight") ? "tonight" : "today",
      start: startOfDay(now).getTime(),
      end: endOfDay(now).getTime(),
      strict: true,
    };
  } else if (normalized.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    timeWindow = {
      label: "tomorrow",
      start: startOfDay(tomorrow).getTime(),
      end: endOfDay(tomorrow).getTime(),
      strict: true,
    };
  } else if (normalized.includes("weekend")) {
    timeWindow = nextWeekendWindow(now);
  } else if (normalized.includes("this week")) {
    const sunday = nextWeekday(now, 0);
    timeWindow = {
      label: "this week",
      start: now.getTime(),
      end: endOfDay(sunday).getTime(),
      strict: false,
    };
  } else {
    const weekdayMap: Array<{ day: number; words: string[]; label: string }> = [
      { day: 1, words: ["monday"], label: "Monday" },
      { day: 2, words: ["tuesday"], label: "Tuesday" },
      { day: 3, words: ["wednesday"], label: "Wednesday" },
      { day: 4, words: ["thursday"], label: "Thursday" },
      { day: 5, words: ["friday"], label: "Friday" },
      { day: 6, words: ["saturday"], label: "Saturday" },
      { day: 0, words: ["sunday"], label: "Sunday" },
    ];

    const weekday = weekdayMap.find(({ words }) => words.some((word) => normalized.includes(word)));
    if (weekday) {
      const date = nextWeekday(now, weekday.day);
      timeWindow = {
        label: weekday.label,
        start: startOfDay(date).getTime(),
        end: endOfDay(date).getTime(),
        strict: true,
      };
    }
  }

  const timePreference = normalized.includes("morning") || normalized.includes("breakfast") || normalized.includes("brunch")
    ? { label: "morning", startHour: 6, endHour: 13 }
    : normalized.includes("afternoon") || normalized.includes("daytime")
      ? { label: "afternoon", startHour: 12, endHour: 17 }
      : normalized.includes("evening") || normalized.includes("after work")
        ? { label: "evening", startHour: 17, endHour: 22 }
        : normalized.includes("night") || normalized.includes("late")
          ? { label: "night", startHour: 20, endHour: 23 }
          : normalized.includes("tonight")
            ? { label: "night", startHour: 18, endHour: 23 }
            : null;

  const locationHints = tokens.filter((token) => (
    ["osu", "labone", "airport", "east", "legon", "cantonments", "spintex", "tema", "achimota", "accra", "ridge", "kokomlemle"].includes(token)
  ));

  const vibeHints = tokens.filter((token) => (
    ["chill", "fun", "date", "friends", "group", "romantic", "trending", "viral"].includes(token)
  ));

  return {
    original: message.trim(),
    normalized,
    tokens,
    categorySlugs: categoryMatches.map((match) => match.slug),
    categoryLabels: categoryMatches.map((match) => match.label),
    priceMode,
    timeWindow,
    timePreference,
    locationHints,
    vibeHints,
  };
}

function formatDateHint(startDatetime: string): string {
  return new Date(startDatetime).toLocaleDateString("en-GH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function normalizeEvent(row: RawEventRow): EventCandidate {
  const category = pickFirst(row.categories);
  const venue = pickFirst(row.venues);
  const price = formatPrice(row.ticket_types);
  const shortDescription = excerpt(row.short_description ?? row.description);
  const city = venue?.city ?? "Accra";
  const venueName = venue?.name ?? row.custom_location ?? (row.is_online ? "Online" : "Accra");
  const date = new Date(row.start_datetime);
  const tags = (row.tags ?? []).map((tag) => tag.toLowerCase());

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    href: `/events/${row.slug}`,
    banner_url: row.banner_url,
    start_datetime: row.start_datetime,
    end_datetime: row.end_datetime,
    venue_name: venueName,
    city,
    category_name: category?.name ?? null,
    category_slug: category?.slug ?? null,
    price_label: price.label,
    price_value: price.value,
    short_description: shortDescription,
    tags,
    searchable_text: [
      row.title,
      shortDescription,
      row.description ?? "",
      category?.name ?? "",
      category?.slug ?? "",
      venueName ?? "",
      city ?? "",
      tags.join(" "),
    ].join(" ").toLowerCase(),
    title_text: row.title.toLowerCase(),
    day_key: toDayKey(date),
    start_ms: date.getTime(),
    hour: date.getHours(),
    is_featured: row.is_featured === true,
    social_score: (row.saves_count ?? 0) + ((row.reviews_count ?? 0) * 2) + ((row.avg_rating ?? 0) * 3),
  };
}

function buildFallbackReason(event: EventCandidate, signals: string[]): string {
  const primarySignal = signals[0];
  if (primarySignal) return primarySignal;

  const venue = event.venue_name ?? event.city ?? "Accra";
  return `${event.title} is a strong live option on ${formatDateHint(event.start_datetime)} at ${venue}.`;
}

function scoreCandidate(event: EventCandidate, analysis: QueryAnalysis, interests: string[]): ScoredCandidate {
  let score = 0;
  let strictMatch = analysis.timeWindow?.strict !== true;
  const signals: string[] = [];

  if (analysis.timeWindow) {
    const withinWindow = event.start_ms >= analysis.timeWindow.start && event.start_ms <= analysis.timeWindow.end;
    if (withinWindow) {
      score += analysis.timeWindow.strict ? 34 : 20;
      strictMatch = true;
      signals.push(`It lands ${analysis.timeWindow.label} on ${formatDateHint(event.start_datetime)}.`);
    } else if (analysis.timeWindow.strict) {
      score -= 22;
      strictMatch = false;
    }
  }

  if (analysis.timePreference) {
    const withinHours = event.hour >= analysis.timePreference.startHour && event.hour <= analysis.timePreference.endHour;
    if (withinHours) {
      score += 12;
      signals.push(`The start time fits a ${analysis.timePreference.label} plan.`);
    } else {
      score -= 4;
    }
  }

  if (analysis.categorySlugs.length > 0) {
    if (event.category_slug && analysis.categorySlugs.includes(event.category_slug)) {
      score += 24;
      const categoryLabel = event.category_name?.toLowerCase() ?? event.category_slug.replaceAll("-", " ");
      signals.push(`It matches your ${categoryLabel} ask.`);
    } else {
      score -= 6;
    }
  }

  if (analysis.priceMode === "free") {
    if (event.price_value === 0) {
      score += 20;
      signals.push("It is free.");
    } else {
      score -= 18;
    }
  } else if (analysis.priceMode === "budget") {
    if (event.price_value === 0) {
      score += 16;
      signals.push("It keeps the spend low.");
    } else if (event.price_value <= 80) {
      score += 10;
      signals.push(`It stays budget-friendly at ${event.price_label}.`);
    } else {
      score -= 10;
    }
  } else if (analysis.priceMode === "premium") {
    if (event.price_value >= 150) {
      score += 14;
      signals.push(`It leans premium at ${event.price_label}.`);
    }
  }

  for (const interest of interests) {
    if (event.searchable_text.includes(interest)) {
      score += 8;
      signals.push(`It lines up with your ${interest} interests.`);
      break;
    }
  }

  for (const token of analysis.tokens) {
    if (event.title_text.includes(token)) {
      score += 8;
    } else if (event.searchable_text.includes(token)) {
      score += 4;
    }
  }

  for (const hint of analysis.locationHints) {
    if (event.searchable_text.includes(hint)) {
      score += 10;
      signals.push(`It is around ${hint[0]?.toUpperCase() ?? ""}${hint.slice(1)}.`);
      break;
    }
  }

  if (analysis.vibeHints.includes("friends") || analysis.vibeHints.includes("group") || analysis.normalized.includes("crew")) {
    if (["music", "food-drink", "community"].includes(event.category_slug ?? "")) {
      score += 8;
      signals.push("It works well for a group plan.");
    }
  }

  if (analysis.vibeHints.includes("date") || analysis.vibeHints.includes("romantic")) {
    if (["food-drink", "arts", "music"].includes(event.category_slug ?? "")) {
      score += 8;
      signals.push("It feels like a strong date-night option.");
    }
  }

  if (analysis.normalized.includes("trending") || analysis.normalized.includes("popular")) {
    score += Math.min(event.social_score / 8, 10);
    if (event.social_score > 20) {
      signals.push("It is getting strong traction on the platform.");
    }
  }

  if (event.is_featured) {
    score += 4;
  }

  score += Math.min(event.social_score / 15, 8);

  return {
    event,
    score,
    strictMatch,
    signals,
    fallbackReason: buildFallbackReason(event, signals),
  };
}

function buildSearchHref(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  return `/search?q=${encodeURIComponent(trimmed)}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildFollowUps(analysis: QueryAnalysis): string[] {
  const prompts = [
    analysis.priceMode === "free" ? "Show me paid options with stronger vibes" : "Show me free options only",
    analysis.timeWindow?.label === "this weekend" ? "Only show me Saturday events" : "What is best this weekend?",
    analysis.categoryLabels[0] ? `Find me more ${analysis.categoryLabels[0]} events` : "Show me live music options",
    analysis.locationHints[0] ? `What else is happening near ${analysis.locationHints[0]}?` : "What is happening in Osu tonight?",
  ];

  return uniqueStrings(prompts).slice(0, 3);
}

function buildFallbackResponse(
  message: string,
  analysis: QueryAnalysis,
  scored: ScoredCandidate[],
  totalMatches: number,
): AssistantResponse {
  const picks = scored.slice(0, MAX_PICKS).map<AssistantPick>((candidate) => ({
    event_id: candidate.event.id,
    title: candidate.event.title,
    reason: candidate.fallbackReason,
    event: candidate.event,
  }));

  const intro = picks.length > 0
    ? totalMatches > 0
      ? `I found ${totalMatches} live ${totalMatches === 1 ? "event" : "events"} on the site that best fit "${message.trim()}".`
      : "I could not find a perfect literal match, but these are the closest live events on the site right now."
    : "I could not find a live event match yet. Try a different vibe, day, area, or budget.";

  return {
    intro,
    summary: picks.length > 0
      ? "These cards are ranked by timing, vibe, price, location, and what is already live on GoOutside."
      : "Try asking for a specific day, neighborhood, vibe, or price range so I can narrow it down.",
    followUps: buildFollowUps(analysis),
    picks,
    totalMatches,
    searchHref: buildSearchHref(message),
  };
}

async function refineWithGroq(
  message: string,
  profile: UserProfile | null,
  analysis: QueryAnalysis,
  scored: ScoredCandidate[],
  fallback: AssistantResponse,
): Promise<AssistantResponse> {
  if (!groq || scored.length === 0) {
    return fallback;
  }

  const candidates = scored.slice(0, 8).map((candidate, index) => ({
    id: candidate.event.id,
    title: candidate.event.title,
    category: candidate.event.category_name ?? candidate.event.category_slug ?? "Event",
    date: formatDateHint(candidate.event.start_datetime),
    venue: candidate.event.venue_name ?? candidate.event.city ?? "Accra",
    city: candidate.event.city ?? "Accra",
    price: candidate.event.price_label,
    summary: candidate.event.short_description,
    ranking_reason: candidate.fallbackReason,
    rank: index + 1,
  }));

  const systemPrompt = `You are GoOutside's event-planning assistant for Ghana.
You will receive a user request and ranked candidate events already pulled from the site.
Return valid JSON only, with this exact shape:
{
  "intro": "1 short sentence",
  "summary": "1 short sentence",
  "followUps": ["prompt", "prompt", "prompt"],
  "picks": [
    { "event_id": "candidate id", "reason": "1 concise sentence grounded in the candidate data" }
  ]
}

Rules:
- Never invent event ids, titles, dates, venues, prices, or links.
- Only use candidate ids from the provided list.
- Return between 1 and 4 picks.
- Keep the copy practical and recommendation-focused.
- If the user's request is broad, prefer the strongest matches instead of apologizing.`;

  const userPrompt = JSON.stringify({
    user_request: message.trim(),
    user_profile: profile
      ? {
          pulse_tier: profile.pulse_tier,
          pulse_score: profile.pulse_score,
          interests: profile.interests ?? [],
          city: profile.location_city_name,
        }
      : null,
    interpreted_filters: {
      categories: analysis.categoryLabels,
      price_mode: analysis.priceMode,
      time_window: analysis.timeWindow?.label ?? null,
      time_preference: analysis.timePreference?.label ?? null,
      location_hints: analysis.locationHints,
    },
    candidates,
  });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      intro?: string;
      summary?: string;
      followUps?: string[];
      picks?: Array<{ event_id?: string; reason?: string }>;
    };

    const scoredMap = new Map(scored.map((candidate) => [candidate.event.id, candidate]));
    const pickedIds = new Set<string>();
    const refinedPicks: AssistantPick[] = [];

    for (const pick of parsed.picks ?? []) {
      if (!pick.event_id || pickedIds.has(pick.event_id)) continue;
      const candidate = scoredMap.get(pick.event_id);
      if (!candidate) continue;
      pickedIds.add(pick.event_id);
      refinedPicks.push({
        event_id: candidate.event.id,
        title: candidate.event.title,
        reason: (pick.reason ?? "").trim() || candidate.fallbackReason,
        event: candidate.event,
      });
      if (refinedPicks.length >= MAX_PICKS) break;
    }

    if (refinedPicks.length === 0) {
      return fallback;
    }

    for (const candidate of scored) {
      if (refinedPicks.length >= MAX_PICKS) break;
      if (pickedIds.has(candidate.event.id)) continue;
      refinedPicks.push({
        event_id: candidate.event.id,
        title: candidate.event.title,
        reason: candidate.fallbackReason,
        event: candidate.event,
      });
    }

    return {
      intro: parsed.intro?.trim() || fallback.intro,
      summary: parsed.summary?.trim() || fallback.summary,
      followUps: uniqueStrings(Array.isArray(parsed.followUps) ? parsed.followUps : fallback.followUps).slice(0, 3),
      picks: refinedPicks,
      totalMatches: fallback.totalMatches,
      searchHref: fallback.searchHref,
    };
  } catch (error) {
    console.error("[POST /api/ai/weekend] groq_refine_failed", error);
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = await request.json() as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const clerk = await currentUser();
  const userResult = clerk
    ? await supabaseAdmin
        .from("users")
        .select("id, pulse_score, pulse_tier, interests, location_city_name")
        .eq("clerk_id", clerk.id)
        .maybeSingle()
    : { data: null };

  const profile = (userResult.data ?? null) as UserProfile | null;

  const now = new Date();
  const upperBound = new Date(now);
  upperBound.setDate(upperBound.getDate() + EVENT_LOOKAHEAD_DAYS);

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, description, short_description,
      start_datetime, end_datetime, banner_url, custom_location, is_online,
      tags, is_featured, saves_count, avg_rating, reviews_count,
      categories (name, slug),
      venues (name, city),
      ticket_types (price, price_type, is_active)
    `)
    .eq("status", "published")
    .gte("start_datetime", now.toISOString())
    .lte("start_datetime", upperBound.toISOString())
    .order("start_datetime", { ascending: true })
    .limit(EVENT_LIMIT);

  if (error) {
    console.error("[POST /api/ai/weekend] event_query_failed", error);
    const emptyResponse: AssistantResponse = {
      intro: "I could not load live events right now.",
      summary: "Try again in a moment and I will pull matching events from the site.",
      followUps: ["Show me free events", "What is happening this weekend?", "Find me live music in Accra"],
      picks: [],
      totalMatches: 0,
      searchHref: buildSearchHref(message),
    };
    return NextResponse.json(emptyResponse, { status: 200 });
  }

  const events = ((data as RawEventRow[] | null) ?? []).map(normalizeEvent);
  const analysis = analyzeQuery(message);
  const interests = (profile?.interests ?? []).map((interest) => interest.toLowerCase());

  const scored = events
    .map((event) => scoreCandidate(event, analysis, interests))
    .sort((left, right) => right.score - left.score || left.event.start_ms - right.event.start_ms);

  const strictMatches = scored.filter((candidate) => candidate.strictMatch && candidate.score > 0);
  const positiveMatches = scored.filter((candidate) => candidate.score > 0);

  const ranked = strictMatches.length > 0
    ? strictMatches
    : positiveMatches.length > 0
      ? positiveMatches
      : scored.filter((candidate) => candidate.score > -25);

  const fallback = buildFallbackResponse(
    message,
    analysis,
    ranked,
    positiveMatches.length,
  );

  const response = await refineWithGroq(message, profile, analysis, ranked, fallback);
  return NextResponse.json(response);
}
