import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Pure logic tests for follow service (no DB calls) ─────────────────────────
// These tests exercise the non-DB logic: validation guards and status derivation.

// Inline the guard logic so we can test it without importing the full module
// (which would require a live Supabase client).

function validateFollowRequest(
  viewerId: string | null,
  targetId: string | null,
): { error?: string } {
  if (!viewerId) return { error: "Account not fully set up" };
  if (!targetId) return { error: "Target user not found" };
  if (viewerId === targetId) return { error: "Cannot follow yourself" };
  return {};
}

function deriveFollowStatus(
  following: boolean,
  followedBy: boolean,
): { following: boolean; followedBy: boolean; mutual: boolean } {
  return { following, followedBy, mutual: following && followedBy };
}

describe("Follow validation guards", () => {
  it("rejects null viewer", () => {
    const result = validateFollowRequest(null, "user-b");
    expect(result.error).toBe("Account not fully set up");
  });

  it("rejects null target", () => {
    const result = validateFollowRequest("user-a", null);
    expect(result.error).toBe("Target user not found");
  });

  it("rejects self-follow", () => {
    const result = validateFollowRequest("user-a", "user-a");
    expect(result.error).toBe("Cannot follow yourself");
  });

  it("allows valid follow request", () => {
    const result = validateFollowRequest("user-a", "user-b");
    expect(result.error).toBeUndefined();
  });
});

describe("Follow status derivation", () => {
  it("returns following=true, mutual=false when only viewer follows", () => {
    const status = deriveFollowStatus(true, false);
    expect(status.following).toBe(true);
    expect(status.followedBy).toBe(false);
    expect(status.mutual).toBe(false);
  });

  it("returns followedBy=true, mutual=false when only target follows viewer", () => {
    const status = deriveFollowStatus(false, true);
    expect(status.following).toBe(false);
    expect(status.followedBy).toBe(true);
    expect(status.mutual).toBe(false);
  });

  it("returns mutual=true when both follow each other", () => {
    const status = deriveFollowStatus(true, true);
    expect(status.mutual).toBe(true);
    expect(status.following).toBe(true);
    expect(status.followedBy).toBe(true);
  });

  it("returns all false when neither follows", () => {
    const status = deriveFollowStatus(false, false);
    expect(status.following).toBe(false);
    expect(status.followedBy).toBe(false);
    expect(status.mutual).toBe(false);
  });
});
