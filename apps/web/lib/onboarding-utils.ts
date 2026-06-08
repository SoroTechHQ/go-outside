export const GHANA_CITIES = [
  "Accra",
  "Kumasi",
  "Tamale",
  "Cape Coast",
  "Takoradi",
  "Tema",
  "Ho",
  "Sunyani",
  "Koforidua",
  "Wa",
  "Bolgatanga",
] as const;

export type GhanaCity = (typeof GHANA_CITIES)[number];

export interface VibeData {
  frequency: string;
  crew:      string;
  time:      string[];
}

export function computeStartingScore(opts: {
  interests:  string[];
  pastEvents: string[];
  vibe:       VibeData | null;
}): number {
  let score = 0;
  score += opts.interests.length * 5;     // 5 pts per interest
  score += opts.pastEvents.length * 10;   // 10 pts per past event
  if (opts.vibe && Object.keys(opts.vibe).length > 0) score += 15; // 15 pts for vibe
  return Math.max(score, 10); // minimum 10
}

export type PulseTier = "newcomer" | "explorer" | "regular" | "scene_kid" | "city_native" | "legend";

export interface TierInfo {
  slug:       PulseTier;
  label:      string;
  bg:         string;
  color:      string;
  min:        number;
  max:        number;
}

export const TIER_MAP: TierInfo[] = [
  { slug: "legend",      label: "Legend",      bg: "rgba(218,165,32,0.15)",  color: "#DAA520", min: 2000, max: Infinity },
  { slug: "city_native", label: "City Native", bg: "rgba(200,124,42,0.15)",  color: "#c87c2a", min: 1000, max: 1999    },
  { slug: "scene_kid",   label: "Scene Kid",   bg: "rgba(74,159,99,0.12)",   color: "#4a9f63", min: 600,  max: 999     },
  { slug: "regular",     label: "Regular",     bg: "rgba(74,159,99,0.10)",   color: "#4a9f63", min: 300,  max: 599     },
  { slug: "explorer",    label: "Explorer",    bg: "rgba(74,159,99,0.08)",   color: "#4a9f63", min: 100,  max: 299     },
  { slug: "newcomer",    label: "Newcomer",    bg: "rgba(255,255,255,0.04)", color: "#9CA3AF", min: 0,    max: 99      },
];

export function getTierFromScore(score: number): TierInfo {
  for (const tier of TIER_MAP) {
    if (score >= tier.min) return tier;
  }
  return TIER_MAP[TIER_MAP.length - 1]!;
}

/** Slug used to store in DB (e.g. "scene_kid") */
export function getTierSlug(score: number): PulseTier {
  return getTierFromScore(score).slug;
}

export const ONBOARDING_STEPS: Record<string, number> = {
  "/onboarding/profile":   1,
  "/onboarding/vibe":      2,
  "/onboarding/history":   3,
  "/onboarding/interests": 4,
  "/onboarding/pulse":     5,
  "/onboarding/org-setup": 5, // organizer-only post-step; treated as step 5 (100% progress)
};

export const STEP_ROUTES: Record<number, string> = {
  1: "/onboarding/profile",
  2: "/onboarding/vibe",
  3: "/onboarding/history",
  4: "/onboarding/interests",
  5: "/onboarding/pulse",
};
