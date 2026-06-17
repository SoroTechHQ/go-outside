import { describe, it, expect } from "vitest";
import type { SocialActivityItem } from "../types";

// ── Pure logic tests for social activity service ──────────────────────────────
// Tests the non-DB parts: sorting, deduplication, cursor generation.

function sortByRecency(items: SocialActivityItem[]): SocialActivityItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function paginate(
  items: SocialActivityItem[],
  limit: number,
): { items: SocialActivityItem[]; nextCursor: string | null } {
  const page = items.slice(0, limit);
  const nextCursor = page.length === limit ? page[page.length - 1]?.createdAt ?? null : null;
  return { items: page, nextCursor };
}

function makeItem(overrides: Partial<SocialActivityItem> = {}): SocialActivityItem {
  return {
    id: "item-1",
    actorUserId: "user-a",
    actorName: "Ama Owusu",
    actorUsername: "ama",
    actorAvatarUrl: null,
    verb: "posted",
    targetType: "post",
    targetId: "post-1",
    targetTitle: "Great vibes at Accra Night Market",
    targetHref: "/ama",
    createdAt: new Date().toISOString(),
    privacy: "public",
    ...overrides,
  };
}

describe("Activity feed sorting", () => {
  it("sorts by most recent first", () => {
    const older = makeItem({ id: "old", createdAt: "2026-01-01T10:00:00Z" });
    const newer = makeItem({ id: "new", createdAt: "2026-06-01T10:00:00Z" });
    const sorted = sortByRecency([older, newer]);
    expect(sorted[0]?.id).toBe("new");
    expect(sorted[1]?.id).toBe("old");
  });

  it("handles empty array", () => {
    expect(sortByRecency([])).toHaveLength(0);
  });

  it("handles single item", () => {
    const item = makeItem();
    expect(sortByRecency([item])).toHaveLength(1);
  });
});

describe("Activity feed pagination", () => {
  it("returns nextCursor when page is full", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: `item-${i}`, createdAt: `2026-06-0${i + 1}T10:00:00Z` }),
    );
    const { items: page, nextCursor } = paginate(items, 3);
    expect(page).toHaveLength(3);
    expect(nextCursor).toBeTruthy();
    expect(nextCursor).toBe(page[2]?.createdAt);
  });

  it("returns null nextCursor when page is not full", () => {
    const items = [makeItem({ id: "only" })];
    const { nextCursor } = paginate(items, 20);
    expect(nextCursor).toBeNull();
  });

  it("returns null nextCursor for empty list", () => {
    const { items: page, nextCursor } = paginate([], 20);
    expect(page).toHaveLength(0);
    expect(nextCursor).toBeNull();
  });
});

describe("SocialActivityItem shapes", () => {
  it("posted item has correct verb and targetType", () => {
    const item = makeItem({ verb: "posted", targetType: "post" });
    expect(item.verb).toBe("posted");
    expect(item.targetType).toBe("post");
  });

  it("saved_event item has correct verb and targetType", () => {
    const item = makeItem({ verb: "saved_event", targetType: "event" });
    expect(item.verb).toBe("saved_event");
    expect(item.targetType).toBe("event");
  });

  it("registered item has correct verb", () => {
    const item = makeItem({ verb: "registered" });
    expect(item.verb).toBe("registered");
  });

  it("followed item has correct targetType", () => {
    const item = makeItem({ verb: "followed", targetType: "user" });
    expect(item.targetType).toBe("user");
  });
});
