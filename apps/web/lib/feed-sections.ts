export type SectionConfig = {
  id: string;
  eyebrow: string;
  title: string;
  subtext?: string;
  weight: number;
  condition?: {
    hours?: [number, number]; // [startHour, endHour] inclusive; wraps midnight if start > end
    days?: number[];           // 0=Sun … 6=Sat
    requiresFriends?: boolean;
  };
  friendTemplate?: boolean; // title / eyebrow contain {friend} placeholder
};

export const FEED_SECTION_POOL: SectionConfig[] = [
  // ── Generic algo picks ──────────────────────────────────────────
  {
    id: "just-for-you",
    eyebrow: "Just for you ✦",
    title: "We picked these for you",
    weight: 10,
  },
  {
    id: "algorithm-loves-you",
    eyebrow: "The algorithm",
    title: "We think you'll love these:",
    weight: 9,
  },
  {
    id: "dont-sleep",
    eyebrow: "Top picks",
    title: "Don't sleep on these",
    weight: 8,
  },
  {
    id: "vibe-match",
    eyebrow: "Vibe match ✦",
    title: "Your energy, but make it an event",
    weight: 7,
  },
  {
    id: "no-plans",
    eyebrow: "No excuses",
    title: "You literally have no plans this weekend",
    weight: 6,
  },
  {
    id: "main-character",
    eyebrow: "Main character",
    title: "Events for people who don't waste weekends",
    weight: 7,
  },
  {
    id: "only-in-accra",
    eyebrow: "Only in Accra",
    title: "These don't happen everywhere",
    weight: 8,
  },
  {
    id: "trending-hard",
    eyebrow: "On everyone's radar",
    title: "Accra is talking about these",
    weight: 8,
  },
  {
    id: "hidden-gem",
    eyebrow: "Hidden gems",
    title: "Underrated. Not for long.",
    weight: 7,
  },
  {
    id: "fomo-incoming",
    eyebrow: "FOMO incoming",
    title: "Don't say we didn't warn you",
    weight: 9,
  },
  {
    id: "go-outside",
    eyebrow: "Touch grass",
    title: "Real life hits different",
    weight: 5,
  },
  {
    id: "curated",
    eyebrow: "Curated for you ✦",
    title: "Because your taste is actually good",
    weight: 8,
  },
  {
    id: "big-week",
    eyebrow: "Big week ahead",
    title: "Load up your calendar",
    weight: 7,
  },

  // ── Time-of-day ─────────────────────────────────────────────────
  {
    id: "morning-plans",
    eyebrow: "Good morning",
    title: "Make today count",
    weight: 8,
    condition: { hours: [6, 11] },
  },
  {
    id: "afternoon-energy",
    eyebrow: "Afternoon pick-me-up",
    title: "Something worth leaving the house for",
    weight: 9,
    condition: { hours: [12, 16] },
  },
  {
    id: "tonight",
    eyebrow: "Tonight",
    title: "What's the move tonight?",
    weight: 11,
    condition: { hours: [17, 21] },
  },
  {
    id: "late-night",
    eyebrow: "Night owl picks",
    title: "Still up? Here's what's on",
    weight: 9,
    condition: { hours: [22, 4] },
  },

  // ── Day-of-week ─────────────────────────────────────────────────
  {
    id: "monday-motivation",
    eyebrow: "Start the week right",
    title: "Already thinking about the weekend?",
    weight: 8,
    condition: { days: [1] },
  },
  {
    id: "midweek-treat",
    eyebrow: "Midweek treat",
    title: "Beat the midweek slump",
    weight: 9,
    condition: { days: [2, 3] },
  },
  {
    id: "almost-weekend",
    eyebrow: "Weekend incoming",
    title: "Your weekend, booked solid",
    weight: 10,
    condition: { days: [4] },
  },
  {
    id: "friday-night",
    eyebrow: "Friday night sorted",
    title: "Because it's Friday night:",
    weight: 14,
    condition: { days: [5] },
  },
  {
    id: "saturday-plans",
    eyebrow: "Saturday plans",
    title: "Saturday night, what are you doing at home?",
    subtext: "See these picked out for you",
    weight: 14,
    condition: { days: [6] },
  },
  {
    id: "sunday-wind-down",
    eyebrow: "Sunday energy",
    title: "End the weekend right",
    weight: 10,
    condition: { days: [0] },
  },
  {
    id: "friday-evening",
    eyebrow: "Friday night ✦",
    title: "The weekend starts now",
    weight: 13,
    condition: { days: [5], hours: [16, 23] },
  },
  {
    id: "saturday-daytime",
    eyebrow: "Saturday vibes",
    title: "You've got the whole day",
    weight: 11,
    condition: { days: [6], hours: [9, 16] },
  },

  // ── Friend-aware ────────────────────────────────────────────────
  {
    id: "because-friend-going",
    eyebrow: "Your crew",
    title: "Because {friend} is going",
    weight: 16,
    condition: { requiresFriends: true },
    friendTemplate: true,
  },
  {
    id: "friend-saved",
    eyebrow: "Friend pick",
    title: "{friend} thinks you'd love this",
    weight: 13,
    condition: { requiresFriends: true },
    friendTemplate: true,
  },
  {
    id: "squad-check",
    eyebrow: "The squad",
    title: "Your people are already in",
    weight: 12,
    condition: { requiresFriends: true },
  },
  {
    id: "friends-and-you",
    eyebrow: "Friendtivity ✦",
    title: "{friend} saved this — might be worth it",
    weight: 11,
    condition: { requiresFriends: true },
    friendTemplate: true,
  },
  {
    id: "crew-approved",
    eyebrow: "Crew approved",
    title: "Everyone you know is going to this",
    weight: 12,
    condition: { requiresFriends: true },
  },
];

// ── Deterministic weighted pick ────────────────────────────────────

function seededRandom(seed: number): number {
  // Simple mulberry32 step
  let s = seed + 0x6d2b79f5;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
}

export function pickSectionHeader(
  sectionIdx: number,
  sessionSeed: number,
  friendNames: string[],
  hour: number,
  dayOfWeek: number,
): SectionConfig & { resolvedTitle: string; resolvedEyebrow: string } {
  const hasFriends = friendNames.length > 0;

  const eligible = FEED_SECTION_POOL.filter((s) => {
    const c = s.condition;
    if (!c) return true;
    if (c.requiresFriends && !hasFriends) return false;
    if (c.days && !c.days.includes(dayOfWeek)) return false;
    if (c.hours) {
      const [from, to] = c.hours;
      if (from <= to) {
        if (hour < from || hour > to) return false;
      } else {
        // wraps midnight (e.g. 22–4)
        if (hour < from && hour > to) return false;
      }
    }
    return true;
  });

  const pool = eligible.length > 0 ? eligible : FEED_SECTION_POOL.filter((s) => !s.condition);
  const totalWeight = pool.reduce((sum, s) => sum + s.weight, 0);

  const seed = seededRandom(sessionSeed * 31337 + sectionIdx * 7919);
  let target = Math.floor(seed * totalWeight);

  let picked = pool[pool.length - 1]!;
  for (const s of pool) {
    target -= s.weight;
    if (target < 0) { picked = s; break; }
  }

  const friend = friendNames[0] ?? "your friend";
  const resolvedTitle = picked.friendTemplate
    ? picked.title.replace("{friend}", friend)
    : picked.title;
  const resolvedEyebrow = picked.eyebrow.replace("{friend}", friend);

  return { ...picked, resolvedTitle, resolvedEyebrow };
}
