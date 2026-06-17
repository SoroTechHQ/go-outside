import type { EventRow, UserInterests, EventScoreBreakdown } from "./types";

// ── Transparent event ranking ─────────────────────────────────────────────────
//
// final_score =
//   lexical_match_score       (set by caller from RPC rank)
//   + exact_title_boost       (query appears exactly in title)
//   + time_fit_score          (how close the event is to time intent)
//   + category_fit_score      (tag matches user's vibe or category filter)
//   + user_interest_score     (tag matches user's saved interests)
//   + trending_score          (normalised trending_score column)
//   + affordability_score     (free/cheap events get a boost when user wants budget)
//   - sold_out_penalty        (tags/label signals sold out)
//
// Weights are deliberately simple in Phase 1. Log breakdown for tuning.

const W = {
  exactTitle:    30,
  categoryMatch: 20,
  interestMatch: 8,
  trending:      0.5,  // multiplied by raw trending_score value
  free:          12,
  affordable:    6,
  soldOut:       -40,
};

function isSoldOut(event: EventRow): boolean {
  const label = (event.price_label ?? "").toLowerCase();
  return label.includes("sold out") || (event.tags ?? []).some((t) => t.toLowerCase() === "sold-out");
}

function isFree(event: EventRow): boolean {
  const label = (event.price_label ?? "").toLowerCase();
  return label === "free" || label === "free entry" || label === "ghc 0" || label === "ghs 0";
}

export function computeEventScore(
  event: EventRow,
  query: string,
  catSet: Set<string>,
  userInterests: UserInterests | null,
  opts?: { wantsFree?: boolean; wantsBudget?: boolean },
): EventScoreBreakdown {
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  const title = (event.title ?? "").toLowerCase();
  const q = query.toLowerCase();

  // Exact title boost — highest signal for name searches
  const exactTitleBoost = q.length >= 3 && title.includes(q) ? W.exactTitle : 0;

  // Category fit — user filtered by category or query implied a category
  let categoryFitScore = 0;
  for (const tag of tags) {
    if (catSet.has(tag)) { categoryFitScore += W.categoryMatch; break; }
  }

  // User interest match
  let userInterestScore = 0;
  if (userInterests) {
    const interestTerms = userInterests.interests.map((i) => i.toLowerCase());
    const topCatSet = new Set(userInterests.topCategories.map((c) => c.toLowerCase()));
    for (const tag of tags) {
      if (topCatSet.has(tag)) { userInterestScore += W.interestMatch; break; }
    }
    for (const term of interestTerms) {
      for (const tag of tags) {
        if (tag.includes(term) || term.includes(tag)) { userInterestScore += W.interestMatch; break; }
      }
    }
  }

  // Trending score (raw column, normalised)
  const trendingScore = (event.trending_score ?? 0) * W.trending;

  // Affordability
  let affordabilityScore = 0;
  if (opts?.wantsFree && isFree(event)) affordabilityScore += W.free;
  if (opts?.wantsBudget && !isSoldOut(event)) affordabilityScore += W.affordable;

  // Sold out penalty
  const soldOutPenalty = isSoldOut(event) ? W.soldOut : 0;

  const finalScore =
    exactTitleBoost +
    categoryFitScore +
    userInterestScore +
    trendingScore +
    affordabilityScore +
    soldOutPenalty;

  return {
    eventId: event.id,
    finalScore,
    lexicalMatchScore: 0, // filled in by caller when using RPC rank
    exactTitleBoost,
    timeFitScore: 0,      // not computed here — DB date filter handles it
    categoryFitScore,
    userInterestScore,
    trendingScore,
    affordabilityScore,
    soldOutPenalty,
  };
}

export function rankEvents(
  events: EventRow[],
  query: string,
  categories: string[],
  userInterests: UserInterests | null,
  opts?: { wantsFree?: boolean; wantsBudget?: boolean },
): EventRow[] {
  if (!events.length) return events;

  const catSet = new Set(categories.map((c) => c.toLowerCase()));

  const scored = events.map((ev) => ({
    ev,
    score: computeEventScore(ev, query, catSet, userInterests, opts).finalScore,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map(({ ev }) => ev);
}
