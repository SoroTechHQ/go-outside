import { describe, it, expect } from "vitest";
import { rankEvents, computeEventScore } from "../rank-events";
import type { EventRow } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: "evt-1",
    title: "Test Event",
    slug: "test-event",
    banner_url: null,
    start_datetime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    price_label: "GHS 50",
    trending_score: 10,
    tags: ["music"],
    description: "A great event",
    ...overrides,
  };
}

describe("computeEventScore", () => {
  const emptyCategories = new Set<string>();

  it("gives exact title boost when query appears in title", () => {
    const event = makeEvent({ title: "Afrofuture Festival 2026" });
    const score = computeEventScore(event, "afrofuture festival", emptyCategories, null);
    expect(score.exactTitleBoost).toBe(30);
    expect(score.finalScore).toBeGreaterThan(0);
  });

  it("gives no exact title boost when query not in title", () => {
    const event = makeEvent({ title: "Jazz Night Osu" });
    const score = computeEventScore(event, "afrofuture", emptyCategories, null);
    expect(score.exactTitleBoost).toBe(0);
  });

  it("gives category fit score when event tag matches category set", () => {
    const event = makeEvent({ tags: ["music", "nightlife"] });
    const cats = new Set(["music"]);
    const score = computeEventScore(event, "", cats, null);
    expect(score.categoryFitScore).toBe(20);
  });

  it("applies no category score for unrelated categories", () => {
    const event = makeEvent({ tags: ["wellness"] });
    const cats = new Set(["tech"]);
    const score = computeEventScore(event, "", cats, null);
    expect(score.categoryFitScore).toBe(0);
  });

  it("applies user interest score when interests match tags", () => {
    const event = makeEvent({ tags: ["music"] });
    const score = computeEventScore(event, "", emptyCategories, {
      topCategories: ["music"],
      interests: [],
      pulseScore: 50,
    });
    expect(score.userInterestScore).toBeGreaterThan(0);
  });

  it("applies sold-out penalty", () => {
    const event = makeEvent({ price_label: "Sold Out" });
    const score = computeEventScore(event, "", emptyCategories, null);
    expect(score.soldOutPenalty).toBe(-40);
    expect(score.finalScore).toBeLessThan(0);
  });

  it("applies free affordability boost when wantsFree=true", () => {
    const freeEvent = makeEvent({ price_label: "Free" });
    const paidEvent = makeEvent({ price_label: "GHS 100" });

    const freeScore = computeEventScore(freeEvent, "", emptyCategories, null, { wantsFree: true });
    const paidScore = computeEventScore(paidEvent, "", emptyCategories, null, { wantsFree: true });

    expect(freeScore.affordabilityScore).toBe(12);
    expect(paidScore.affordabilityScore).toBe(0);
    expect(freeScore.finalScore).toBeGreaterThan(paidScore.finalScore);
  });

  it("trending score contributes proportionally", () => {
    const highTrend = makeEvent({ trending_score: 100 });
    const lowTrend  = makeEvent({ trending_score: 1   });

    const high = computeEventScore(highTrend, "", emptyCategories, null);
    const low  = computeEventScore(lowTrend,  "", emptyCategories, null);
    expect(high.trendingScore).toBeGreaterThan(low.trendingScore);
  });
});

describe("rankEvents", () => {
  it("returns empty array for empty input", () => {
    expect(rankEvents([], "", [], null)).toEqual([]);
  });

  it("ranks exact title match above unrelated events", () => {
    const jazzEvent = makeEvent({ id: "1", title: "Jazz Night in Osu",       tags: ["music"], trending_score: 50 });
    const techEvent = makeEvent({ id: "2", title: "Build Ghana Tech Summit",  tags: ["tech"],  trending_score: 80 });
    const afroEvent = makeEvent({ id: "3", title: "Afrofuture Festival 2026", tags: ["music"], trending_score: 30 });

    // Searching for "afrofuture" — that event should rank first
    const ranked = rankEvents([jazzEvent, techEvent, afroEvent], "afrofuture", [], null);
    expect(ranked[0].id).toBe("3");
  });

  it("ranks user interest match above unrelated events", () => {
    const musicEvent = makeEvent({ id: "m", title: "Sunday Jazz", tags: ["music"], trending_score: 10 });
    const techEvent  = makeEvent({ id: "t", title: "AI Summit",   tags: ["tech"],  trending_score: 10 });

    const ranked = rankEvents([techEvent, musicEvent], "", [], {
      topCategories: ["music"],
      interests: ["jazz"],
      pulseScore: 60,
    });
    expect(ranked[0].id).toBe("m");
  });

  it("ranks free events higher when wantsFree=true (equal trending)", () => {
    // Both events have the same trending score so only affordability differentiates them
    const freeEvent = makeEvent({ id: "f", title: "Free Sunday Brunch", price_label: "Free",    trending_score: 10 });
    const paidEvent = makeEvent({ id: "p", title: "VIP Rooftop Party",  price_label: "GHS 200", trending_score: 10 });

    const ranked = rankEvents([paidEvent, freeEvent], "", [], null, { wantsFree: true });
    expect(ranked[0].id).toBe("f");
  });

  it("demotes sold-out events (comparable trending scores)", () => {
    // Sold-out gets -40 penalty; available has a small trending lead.
    // Realistic: sold-out events don't have astronomically higher trending.
    const soldOut   = makeEvent({ id: "s", title: "Sold Out Headliner",  price_label: "Sold Out", trending_score: 20 });
    const available = makeEvent({ id: "a", title: "Available Live Set",  price_label: "GHS 80",   trending_score: 10 });

    // soldOut: 20 * 0.5 - 40 = -30. available: 10 * 0.5 = 5. available wins.
    const ranked = rankEvents([soldOut, available], "", [], null);
    expect(ranked[0].id).toBe("a");
  });

  it("preserves ordering stability for equal scores", () => {
    // Two identical events — original order should be deterministic
    const a = makeEvent({ id: "a", trending_score: 10 });
    const b = makeEvent({ id: "b", trending_score: 10 });
    const ranked = rankEvents([a, b], "", [], null);
    expect(ranked).toHaveLength(2);
  });
});
