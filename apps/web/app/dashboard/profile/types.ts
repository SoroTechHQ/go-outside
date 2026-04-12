export type PulseTier =
  | "Newcomer"
  | "Explorer"
  | "Regular"
  | "Scene Kid"
  | "City Native"
  | "Legend";

export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  joinedAt: string;
  pulseScore: number;
  pulseTier: PulseTier;
  neighbourhoodRank: number;
  cityRankPercent: number;
  eventsAttended: number;
  friendCount: number;
  followingCount: number;
  snippetCount: number;
  topCategories: string[];
  importedTweetIds: string[];
  isOwnProfile: boolean;
};

export const PULSE_TIERS: {
  name: PulseTier;
  min: number;
  max: number;
  color: string;
  ringClass: string;
}[] = [
  { name: "Newcomer",    min: 0,    max: 99,         color: "#888888", ringClass: "" },
  { name: "Explorer",    min: 100,  max: 299,         color: "#4a9f63", ringClass: "ring-2 ring-[#4a9f63]" },
  { name: "Regular",     min: 300,  max: 599,         color: "#4a9f63", ringClass: "ring-2 ring-[#4a9f63]" },
  { name: "Scene Kid",   min: 600,  max: 999,         color: "#4a9f63", ringClass: "ring-2 ring-[#4a9f63] shadow-[0_0_12px_rgba(74,159,99,0.5)]" },
  { name: "City Native", min: 1000, max: 1999,        color: "#c87c2a", ringClass: "ring-2 ring-[#c87c2a]" },
  { name: "Legend",      min: 2000, max: Infinity,    color: "#DAA520", ringClass: "ring-4 ring-[#DAA520] shadow-[0_0_16px_rgba(218,165,32,0.55)]" },
];

export function getTierInfo(tier: PulseTier) {
  return PULSE_TIERS.find((t) => t.name === tier) ?? PULSE_TIERS[0];
}

export function getNextTier(tier: PulseTier) {
  const idx = PULSE_TIERS.findIndex((t) => t.name === tier);
  return idx < PULSE_TIERS.length - 1 ? PULSE_TIERS[idx + 1] : null;
}

export function getPulseProgress(score: number, tier: PulseTier): number {
  const current = PULSE_TIERS.find((t) => t.name === tier);
  const next = getNextTier(tier);
  if (!current || !next || next.min === Infinity) return 100;
  const range = next.min - current.min;
  const earned = score - current.min;
  return Math.min(100, Math.round((earned / range) * 100));
}
