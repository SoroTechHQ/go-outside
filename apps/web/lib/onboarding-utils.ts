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

export type PulseTier = "newcomer" | "explorer" | "regular" | "city-native" | "legend";

export interface TierInfo {
  label:      string;
  bg:         string;
  color:      string;
  min:        number;
}

export const TIER_MAP: TierInfo[] = [
  { label: "Legend",      bg: "rgba(255,215,0,0.15)",   color: "#FFD700", min: 500 },
  { label: "City Native", bg: "rgba(95,191,42,0.15)",   color: "#5FBF2A", min: 300 },
  { label: "Regular",     bg: "rgba(95,191,42,0.10)",   color: "#5FBF2A", min: 150 },
  { label: "Explorer",    bg: "rgba(74,122,232,0.12)",  color: "#4A7AE8", min: 60  },
  { label: "Newcomer",    bg: "rgba(255,255,255,0.04)", color: "#6B8C6B", min: 0   },
];

export function getTierFromScore(score: number): TierInfo {
  return TIER_MAP.find((t) => score >= t.min) ?? TIER_MAP[TIER_MAP.length - 1];
}

/** Slug used to store in DB */
export function getTierSlug(score: number): string {
  return getTierFromScore(score).label.toLowerCase().replace(" ", "-");
}

export const ONBOARDING_STEPS: Record<string, number> = {
  "/onboarding/profile":   1,
  "/onboarding/vibe":      2,
  "/onboarding/history":   3,
  "/onboarding/interests": 4,
  "/onboarding/pulse":     5,
};

export const STEP_ROUTES: Record<number, string> = {
  1: "/onboarding/profile",
  2: "/onboarding/vibe",
  3: "/onboarding/history",
  4: "/onboarding/interests",
  5: "/onboarding/pulse",
};
