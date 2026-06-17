import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveWhen } from "../resolve-when";

// Fix "now" to a known Wednesday so weekend/weekday logic is deterministic
// 2026-06-17 is a Wednesday
const FIXED_NOW = new Date("2026-06-17T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveWhen", () => {
  it("returns null for empty string", () => {
    expect(resolveWhen("")).toBeNull();
    expect(resolveWhen(null)).toBeNull();
    expect(resolveWhen(undefined)).toBeNull();
  });

  it("today: covers midnight to 23:59 of the same day", () => {
    const r = resolveWhen("today");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-06-17");
    expect(r!.to).toContain("2026-06-17");
    expect(r!.from.includes("T00:00:00")).toBe(true);
    expect(r!.to.includes("T23:59:59")).toBe(true);
  });

  it("tonight: starts at 17:00 the same day", () => {
    const r = resolveWhen("tonight");
    expect(r).not.toBeNull();
    // from should be 17:00 local
    const from = new Date(r!.from);
    expect(from.getHours()).toBe(17);
    expect(from.getMinutes()).toBe(0);
    // to is end of same day
    expect(r!.to).toContain("2026-06-17");
  });

  it("tomorrow: covers the next calendar day", () => {
    const r = resolveWhen("tomorrow");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-06-18");
    expect(r!.to).toContain("2026-06-18");
  });

  it("weekend: Friday through Sunday (from a Wednesday)", () => {
    // Wed 17 June → Friday = 19 June, Sunday = 21 June
    const r = resolveWhen("weekend");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-06-19");
    expect(r!.to).toContain("2026-06-21");
  });

  it("next-week: Monday through Sunday of next week", () => {
    // Wed 17 June → next Mon = 22 June, Sun = 28 June
    const r = resolveWhen("next-week");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-06-22");
    expect(r!.to).toContain("2026-06-28");
  });

  it("month: from today to end of current month", () => {
    const r = resolveWhen("month");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-06-17");
    // June has 30 days
    expect(r!.to).toContain("2026-06-30");
  });

  it("YYYY-MM-DD: single date", () => {
    const r = resolveWhen("2026-07-04");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-07-04");
    expect(r!.to).toContain("2026-07-04");
  });

  it("YYYY-MM-DD:YYYY-MM-DD: explicit range", () => {
    const r = resolveWhen("2026-12-25:2026-12-31");
    expect(r).not.toBeNull();
    expect(r!.from).toContain("2026-12-25");
    expect(r!.to).toContain("2026-12-31");
  });

  it("from < to in all valid chip values", () => {
    const chips = ["today", "tonight", "tomorrow", "weekend", "next-week", "month"];
    for (const chip of chips) {
      const r = resolveWhen(chip);
      expect(r, `chip="${chip}" should return a range`).not.toBeNull();
      expect(new Date(r!.from).getTime()).toBeLessThanOrEqual(new Date(r!.to).getTime());
    }
  });
});
