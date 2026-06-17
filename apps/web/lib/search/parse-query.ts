import type { ParsedSearchIntent } from "./types";

// ── Ghana-specific synonym and vibe mappings ──────────────────────────────────

const TIME_PATTERNS: Array<{ pattern: RegExp; intent: ParsedSearchIntent["timeIntent"] }> = [
  { pattern: /\btonight\b/i,                          intent: "tonight"  },
  { pattern: /\bthis evening\b/i,                     intent: "tonight"  },
  { pattern: /\bthis night\b/i,                       intent: "tonight"  },
  { pattern: /\btoday\b/i,                            intent: "today"    },
  { pattern: /\btomorrow\b/i,                         intent: "tomorrow" },
  { pattern: /\bthis weekend\b|\bweekend\b/i,         intent: "weekend"  },
  { pattern: /\bthis week\b|\bnext week\b/i,          intent: "next_week"},
  { pattern: /\bthis month\b/i,                       intent: "month"    },
];

const BUDGET_PATTERNS: RegExp[] = [
  /under\s+(?:ghs?\s*)?(\d+)/i,
  /below\s+(?:ghs?\s*)?(\d+)/i,
  /less than\s+(?:ghs?\s*)?(\d+)/i,
  /(?:ghs?\s*)(\d+)\s+(?:or less|max|maximum)/i,
  /cheap|affordable|budget/i,
];

// Maps local Ghana slang/vibe words → category slugs or search tags
const VIBE_MAP: Record<string, string[]> = {
  detty:      ["nightlife", "party"],
  linkup:     ["networking", "social"],
  chill:      ["wellness", "arts"],
  rooftop:    ["nightlife", "food-drink"],
  drinks:     ["food-drink", "nightlife"],
  "paint and sip": ["arts", "food-drink"],
  "date night": ["food-drink", "arts"],
  "free":     [],
  networking: ["networking"],
  "live music": ["music"],
  afro:       ["music"],
  afrobeats:  ["music"],
  jazz:       ["music"],
  sports:     ["sports"],
  tech:       ["tech"],
  startup:    ["tech", "networking"],
  art:        ["arts"],
  food:       ["food-drink"],
  comedy:     ["arts"],
  fitness:    ["wellness"],
  yoga:       ["wellness"],
  carnival:   ["music", "nightlife"],
};

const CITY_PATTERNS: Array<{ pattern: RegExp; city: string }> = [
  { pattern: /\baccra\b/i,     city: "Accra"    },
  { pattern: /\bkumasi\b/i,    city: "Kumasi"   },
  { pattern: /\btakoradi\b/i,  city: "Takoradi" },
  { pattern: /\btemale\b/i,    city: "Tamale"   },
  { pattern: /\bcape coast\b/i,city: "Cape Coast"},
];

const NEIGHBORHOOD_PATTERNS: Array<{ pattern: RegExp; neighborhood: string }> = [
  { pattern: /\bosu\b/i,         neighborhood: "Osu"         },
  { pattern: /\blabone\b/i,      neighborhood: "Labone"      },
  { pattern: /\bcantonments\b/i, neighborhood: "Cantonments" },
  { pattern: /\bairport\b/i,     neighborhood: "Airport"     },
  { pattern: /\beast legon\b/i,  neighborhood: "East Legon"  },
  { pattern: /\bspintex\b/i,     neighborhood: "Spintex"     },
  { pattern: /\bdodzo\b/i,       neighborhood: "Dodzo"       },
  { pattern: /\badenta\b/i,      neighborhood: "Adenta"      },
  { pattern: /\btema\b/i,        neighborhood: "Tema"        },
];

const PEOPLE_SIGNALS = /\b(people|person|user|friend|who|follow)\b/i;
const ORGANIZER_SIGNALS = /\b(by |from |organizer|host|organized by)\b/i;
const POST_SIGNALS = /\b(post|snippet|wrote|tweet|said)\b/i;
const SOCIAL_SIGNALS = /\b(friend|people i follow|my network|going|attending)\b/i;

// Complex query patterns that benefit most from AI
const AI_OFFER_PATTERNS = [
  /plan my/i,
  /what should i/i,
  /recommend/i,
  /suggest/i,
  /help me find/i,
  /where are my friends/i,
  /budget.*event/i,
  /event.*budget/i,
  /vibe/i,
  /surprise me/i,
  /\band\b.*\band\b/i,   // multiple constraints e.g. "music and drinks and cheap"
];

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseQuery(raw: string): ParsedSearchIntent {
  const q = raw.trim();
  const lower = q.toLowerCase();

  // Time intent
  let timeIntent: ParsedSearchIntent["timeIntent"] | undefined;
  for (const { pattern, intent } of TIME_PATTERNS) {
    if (pattern.test(lower)) { timeIntent = intent; break; }
  }

  // Budget
  let budgetMaxGhs: number | undefined;
  const isFreeOnly = /\bfree\b/i.test(lower);
  for (const pat of BUDGET_PATTERNS) {
    const m = lower.match(pat);
    if (m?.[1]) { budgetMaxGhs = parseInt(m[1], 10); break; }
    if (m && /cheap|affordable|budget/i.test(m[0])) { budgetMaxGhs = 100; break; }
  }
  if (isFreeOnly) budgetMaxGhs = 0;

  // City and neighborhood
  let city: string | undefined;
  let neighborhood: string | undefined;
  for (const { pattern, city: c } of CITY_PATTERNS) {
    if (pattern.test(lower)) { city = c; break; }
  }
  for (const { pattern, neighborhood: n } of NEIGHBORHOOD_PATTERNS) {
    if (pattern.test(lower)) { neighborhood = n; break; }
  }

  // Categories from vibe map
  const detectedVibes: string[] = [];
  const detectedCategories = new Set<string>();
  for (const [vibe, cats] of Object.entries(VIBE_MAP)) {
    if (lower.includes(vibe)) {
      detectedVibes.push(vibe);
      cats.forEach((c) => detectedCategories.add(c));
    }
  }

  // Entity intent
  let entityIntent: ParsedSearchIntent["entityIntent"] = "events";
  if (ORGANIZER_SIGNALS.test(lower)) {
    entityIntent = "organizers";
  } else if (POST_SIGNALS.test(lower)) {
    entityIntent = "posts";
  } else if (PEOPLE_SIGNALS.test(lower)) {
    entityIntent = "people";
  }

  const isSocialIntent = SOCIAL_SIGNALS.test(lower);

  // AI offer: complex, multi-constraint, or planning queries
  // Offer AI when the query is vague, multi-constraint, or planning-oriented.
  // Single vibe + time intent (e.g. "chill tonight") already warrants AI.
  const shouldOfferAi =
    AI_OFFER_PATTERNS.some((p) => p.test(lower)) ||
    (detectedVibes.length >= 1 && timeIntent !== undefined) ||
    (budgetMaxGhs !== undefined && timeIntent !== undefined) ||
    isSocialIntent;

  // Cleaned query strips known time/location phrases that the API handles via filters
  // so FTS focuses on what/who, not when/where
  const cleanedQuery = q
    .replace(/\b(tonight|today|tomorrow|this weekend|this week|next week|this month|this evening)\b/gi, "")
    .replace(/\b(in accra|in kumasi|in takoradi|near osu|near labone|near cantonments|near airport|near east legon|near spintex|near tema)\b/gi, "")
    .replace(/\b(under|below|less than)\s+(?:ghs?\s*)?\d+\b/gi, "")
    .replace(/\bfree\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    rawQuery: q,
    cleanedQuery,
    entityIntent,
    timeIntent,
    budgetMaxGhs,
    city,
    neighborhood,
    categories: [...detectedCategories],
    vibes: detectedVibes,
    isFreeOnly,
    isSocialIntent,
    shouldOfferAi,
  };
}
