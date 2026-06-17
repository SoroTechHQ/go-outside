import { describe, it, expect } from "vitest";
import { aiSearchHref } from "../ai-search-href";

describe("aiSearchHref", () => {
  it("produces /ai?prompt=...&autosend=1 by default", () => {
    const href = aiSearchHref("live music tonight");
    expect(href).toContain("/ai?");
    expect(href).toContain("autosend=1");
    // Use URLSearchParams to properly decode query-encoded spaces (+ → space)
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("prompt")).toBe("live music tonight");
  });

  it("omits autosend when autosend=false", () => {
    const href = aiSearchHref("rooftop drinks", false);
    expect(href).not.toContain("autosend");
    expect(href).toContain("prompt=");
  });

  it("URL-encodes special characters in prompt", () => {
    const href = aiSearchHref("events under GHS 100 & free");
    const url = new URL("https://example.com" + href);
    expect(url.searchParams.get("prompt")).toBe("events under GHS 100 & free");
  });

  it("Surprise Me route is correct format", () => {
    const href = aiSearchHref("Surprise me with something perfect for my vibe and Pulse Score tonight");
    expect(href.startsWith("/ai?")).toBe(true);
    expect(href).toContain("autosend=1");
  });

  it("AI quick prompts produce valid hrefs", () => {
    const prompts = [
      "Something free and chill tonight",
      "Live music in Osu this weekend",
      "Best networking event this week",
      "Date night with good drinks",
    ];
    for (const p of prompts) {
      const href = aiSearchHref(p);
      expect(href.startsWith("/ai?")).toBe(true);
      const url = new URL("https://example.com" + href);
      expect(url.searchParams.get("prompt")).toBe(p);
    }
  });
});
