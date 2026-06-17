import { describe, it, expect } from "vitest";
import { parseQuery } from "../parse-query";

// ── Real-life Ghana event search scenarios from the product strategy doc ──────

describe("parseQuery — Ghana event discovery scenarios", () => {
  // Scenario 1: "I am bored tonight"
  describe("Scenario 1: tonight intent", () => {
    it("detects tonight from 'something fun tonight'", () => {
      const r = parseQuery("something fun tonight");
      expect(r.timeIntent).toBe("tonight");
      expect(r.entityIntent).toBe("events");
    });

    it("detects tonight from 'bored tonight'", () => {
      const r = parseQuery("bored tonight");
      expect(r.timeIntent).toBe("tonight");
    });

    it("shouldOfferAi when query is vague + has time intent", () => {
      const r = parseQuery("something chill tonight");
      expect(r.shouldOfferAi).toBe(true);
    });

    it("cleaned query strips 'tonight' so FTS focuses on nouns", () => {
      const r = parseQuery("live music tonight");
      expect(r.cleanedQuery).not.toContain("tonight");
    });
  });

  // Scenario 2: "Events under 100 cedis this weekend"
  describe("Scenario 2: budget + date", () => {
    it("extracts budget from 'events under 100 cedis this weekend'", () => {
      const r = parseQuery("events under 100 cedis this weekend");
      expect(r.budgetMaxGhs).toBe(100);
      expect(r.timeIntent).toBe("weekend");
    });

    it("extracts budget from 'under GHS 50'", () => {
      const r = parseQuery("jazz events under GHS 50");
      expect(r.budgetMaxGhs).toBe(50);
    });

    it("marks free events correctly", () => {
      const r = parseQuery("free events in Accra tonight");
      expect(r.isFreeOnly).toBe(true);
      expect(r.budgetMaxGhs).toBe(0);
    });

    it("shouldOfferAi for budget + time combination", () => {
      const r = parseQuery("events under 200 cedis this weekend");
      expect(r.shouldOfferAi).toBe(true);
    });
  });

  // Scenario 3: Social intent — friends going
  describe("Scenario 3: social intent", () => {
    it("detects social intent from 'where are my friends going this weekend'", () => {
      const r = parseQuery("where are my friends going this weekend");
      expect(r.isSocialIntent).toBe(true);
      expect(r.shouldOfferAi).toBe(true);
      expect(r.timeIntent).toBe("weekend");
    });

    it("detects people entity from 'who is going to'", () => {
      const r = parseQuery("who is going to the jazz festival");
      expect(r.isSocialIntent).toBe(true);
    });
  });

  // Scenario 4: Vibe-based — "date night with drinks"
  describe("Scenario 4: vibe mapping", () => {
    it("maps 'date night' to food-drink and arts categories", () => {
      const r = parseQuery("date night with drinks");
      expect(r.vibes).toContain("date night");
      expect(r.categories).toContain("food-drink");
    });

    it("maps 'rooftop drinks' to nightlife and food-drink", () => {
      const r = parseQuery("rooftop drinks on Friday");
      expect(r.vibes).toContain("rooftop");
      expect(r.vibes).toContain("drinks");
      expect(r.categories).toContain("nightlife");
      expect(r.categories).toContain("food-drink");
    });

    it("maps 'detty December' to nightlife", () => {
      const r = parseQuery("detty December events");
      expect(r.vibes).toContain("detty");
      expect(r.categories).toContain("nightlife");
    });

    it("shouldOfferAi for multi-vibe queries", () => {
      const r = parseQuery("rooftop chill drinks tonight");
      expect(r.shouldOfferAi).toBe(true);
    });
  });

  // Scenario 5: Partial event name / typo tolerance
  describe("Scenario 5: event name search", () => {
    it("preserves raw query for FTS even with partial names", () => {
      const r = parseQuery("afro future");
      expect(r.rawQuery).toBe("afro future");
      expect(r.entityIntent).toBe("events");
    });

    it("does not incorrectly mark as social intent", () => {
      const r = parseQuery("Afrofuture 2025 Accra");
      expect(r.isSocialIntent).toBe(false);
    });
  });

  // Scenario 6: Organizer search
  describe("Scenario 6: organizer intent", () => {
    it("detects organizer intent from 'events by Palm Moments'", () => {
      const r = parseQuery("events by Palm Moments");
      expect(r.entityIntent).toBe("organizers");
    });

    it("detects organizer intent from 'organized by'", () => {
      const r = parseQuery("organized by Kotoka Events");
      expect(r.entityIntent).toBe("organizers");
    });
  });

  // City and neighborhood extraction
  describe("Location parsing", () => {
    it("extracts Accra city", () => {
      const r = parseQuery("live music in Accra this weekend");
      expect(r.city).toBe("Accra");
    });

    it("extracts Kumasi city", () => {
      const r = parseQuery("events in Kumasi tonight");
      expect(r.city).toBe("Kumasi");
    });

    it("extracts Osu neighborhood", () => {
      const r = parseQuery("rooftop bar near Osu");
      expect(r.neighborhood).toBe("Osu");
    });

    it("extracts East Legon neighborhood", () => {
      const r = parseQuery("free concerts near East Legon");
      expect(r.neighborhood).toBe("East Legon");
    });

    it("strips city from cleanedQuery so FTS does not over-match on location", () => {
      const r = parseQuery("jazz events in Accra tonight");
      expect(r.cleanedQuery.toLowerCase()).not.toContain("accra");
      expect(r.cleanedQuery.toLowerCase()).not.toContain("tonight");
    });
  });

  // AI offer detection
  describe("AI offer detection", () => {
    it("shouldOfferAi for planning queries", () => {
      expect(parseQuery("plan my weekend").shouldOfferAi).toBe(true);
      expect(parseQuery("what should I do tonight").shouldOfferAi).toBe(true);
      expect(parseQuery("recommend something free").shouldOfferAi).toBe(true);
    });

    it("should NOT offer AI for simple keyword searches", () => {
      expect(parseQuery("jazz festival").shouldOfferAi).toBe(false);
      expect(parseQuery("music events").shouldOfferAi).toBe(false);
    });
  });

  // Edge cases
  describe("Edge cases", () => {
    it("handles empty query", () => {
      const r = parseQuery("");
      expect(r.rawQuery).toBe("");
      expect(r.cleanedQuery).toBe("");
      expect(r.entityIntent).toBe("events");
    });

    it("handles query with only time intent", () => {
      const r = parseQuery("tonight");
      expect(r.timeIntent).toBe("tonight");
      expect(r.cleanedQuery).toBe("");
    });

    it("does not mutate input string", () => {
      const original = "live music in Osu this weekend";
      const r = parseQuery(original);
      expect(r.rawQuery).toBe(original);
    });
  });
});
