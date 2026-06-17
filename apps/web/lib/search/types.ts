// ── Shared search types used by /api/search, AI tools, and UI ─────────────────

export type SearchType = "all" | "events" | "users" | "posts";

// Parsed intent extracted from a raw query string
export type ParsedSearchIntent = {
  rawQuery: string;
  cleanedQuery: string;
  entityIntent: "events" | "people" | "posts" | "organizers" | "mixed";
  timeIntent?: "today" | "tonight" | "tomorrow" | "weekend" | "next_week" | "month";
  budgetMaxGhs?: number;
  city?: string;
  neighborhood?: string;
  categories: string[];
  vibes: string[];
  isFreeOnly: boolean;
  isSocialIntent: boolean;
  shouldOfferAi: boolean;
};

// Raw DB row shapes

export type EventRow = {
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

export type UserRow = {
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  pulse_tier: string | null;
  pulse_score: number | null;
  bio: string | null;
  city: string | null;
  interests: string[] | null;
};

export type PostRow = {
  id: string;
  body: string;
  vibe_tags: string[];
  created_at: string;
};

// Scoring breakdown (for debug/logging — not exposed to normal users)
export type EventScoreBreakdown = {
  eventId: string;
  finalScore: number;
  lexicalMatchScore: number;
  exactTitleBoost: number;
  timeFitScore: number;
  categoryFitScore: number;
  userInterestScore: number;
  trendingScore: number;
  affordabilityScore: number;
  soldOutPenalty: number;
};

// User interest profile for personalized ranking
export type UserInterests = {
  topCategories: string[];
  interests: string[];
  pulseScore: number;
  city?: string;
};

// Cursor for stable pagination across pages
export type SearchCursor = {
  q: string;
  type: string;
  when: string;
  categories: string;
  offset: number;
};

// Date range resolved from a "when" chip value
export type DateRange = {
  from: string; // ISO datetime
  to: string;   // ISO datetime
};

// Discovery module returned for empty/broad searches
export type DiscoveryModule = {
  type: "trending" | "tonight" | "weekend" | "free" | "categories";
  title: string;
  items: EventRow[];
};

// Full search response
export type SearchApiResponse = {
  events: EventRow[];
  users: UserRow[];
  posts: PostRow[];
  discovery: DiscoveryModule[];
  nextCursor: string | null;
  intent: ParsedSearchIntent;
};
