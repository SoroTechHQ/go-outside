import { describe, it, expect } from "vitest";
import type { SocialUser } from "../types";

// ── Pure logic tests for people discovery ────────────────────────────────────

function buildReason(
  opts: { isFollowedBy: boolean; isFollowing: boolean; mutualCount: number; city?: string; interest?: string; userCity?: string; userInterests?: string[] }
): string | null {
  if (opts.isFollowedBy && !opts.isFollowing) return "Follows you";
  if (opts.mutualCount > 0) return `${opts.mutualCount} mutual connection${opts.mutualCount > 1 ? "s" : ""}`;
  if (opts.city && opts.userCity) return `In ${opts.userCity}`;
  if (opts.interest && opts.userInterests?.includes(opts.interest)) return `Into ${opts.interest}`;
  return null;
}

function sortByRelevance(users: SocialUser[]): SocialUser[] {
  return [...users].sort((a, b) => {
    if (a.followedBy && !b.followedBy) return -1;
    if (!a.followedBy && b.followedBy) return 1;
    if (a.mutualCount !== b.mutualCount) return b.mutualCount - a.mutualCount;
    return b.pulseScore - a.pulseScore;
  });
}

describe("People discovery reason building", () => {
  it('returns "Follows you" when target follows viewer but viewer doesn\'t follow back', () => {
    const reason = buildReason({ isFollowedBy: true, isFollowing: false, mutualCount: 0 });
    expect(reason).toBe("Follows you");
  });

  it("returns mutual count when mutuals exist", () => {
    const reason = buildReason({ isFollowedBy: false, isFollowing: false, mutualCount: 3 });
    expect(reason).toBe("3 mutual connections");
  });

  it("returns singular 'connection' for 1 mutual", () => {
    const reason = buildReason({ isFollowedBy: false, isFollowing: false, mutualCount: 1 });
    expect(reason).toBe("1 mutual connection");
  });

  it("returns city reason when city filter active", () => {
    const reason = buildReason({
      isFollowedBy: false,
      isFollowing: false,
      mutualCount: 0,
      city: "Accra",
      userCity: "Accra",
    });
    expect(reason).toBe("In Accra");
  });

  it("returns interest reason when interest filter active", () => {
    const reason = buildReason({
      isFollowedBy: false,
      isFollowing: false,
      mutualCount: 0,
      interest: "music",
      userInterests: ["music", "food"],
    });
    expect(reason).toBe("Into music");
  });

  it("returns null when no matching signals", () => {
    const reason = buildReason({ isFollowedBy: false, isFollowing: false, mutualCount: 0 });
    expect(reason).toBeNull();
  });
});

describe("People discovery sorting", () => {
  function makeUser(overrides: Partial<SocialUser> = {}): SocialUser {
    return {
      id: "u1",
      clerkId: "clerk_u1",
      username: "user1",
      name: "User One",
      avatarUrl: null,
      bio: null,
      city: "Accra",
      pulseTier: "Explorer",
      pulseScore: 100,
      followerCount: 10,
      isFollowing: false,
      followedBy: false,
      mutual: false,
      mutualCount: 0,
      sharedEventCount: 0,
      reason: null,
      ...overrides,
    };
  }

  it("places users who follow you first", () => {
    const regular = makeUser({ id: "u1", followedBy: false });
    const follower = makeUser({ id: "u2", followedBy: true });
    const sorted = sortByRelevance([regular, follower]);
    expect(sorted[0]?.id).toBe("u2");
  });

  it("sorts by mutual count within same followedBy tier", () => {
    const few = makeUser({ id: "u1", followedBy: false, mutualCount: 1 });
    const many = makeUser({ id: "u2", followedBy: false, mutualCount: 5 });
    const sorted = sortByRelevance([few, many]);
    expect(sorted[0]?.id).toBe("u2");
  });

  it("falls back to pulse score when all other signals equal", () => {
    const low = makeUser({ id: "u1", followedBy: false, mutualCount: 0, pulseScore: 50 });
    const high = makeUser({ id: "u2", followedBy: false, mutualCount: 0, pulseScore: 200 });
    const sorted = sortByRelevance([low, high]);
    expect(sorted[0]?.id).toBe("u2");
  });
});
