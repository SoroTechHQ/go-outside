import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { resolveUserIdFromClerkId, getFollowStatus } from "../../../../lib/social/follows";
import { jsonNoStore } from "../../../../lib/api-security";
import type { SocialUser } from "../../../../lib/social/types";

// GET /api/social/people?q=&city=&interest=&cursor=&limit=
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const interest = searchParams.get("interest")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const cursor = searchParams.get("cursor") ?? null;

  let viewerId: string | null = null;
  let followedIds = new Set<string>();
  let followedByIds = new Set<string>();

  if (clerkId) {
    viewerId = await resolveUserIdFromClerkId(clerkId);
    if (viewerId) {
      const [{ data: myFollows }, { data: myFollowers }] = await Promise.all([
        supabaseAdmin.from("follows").select("following_id").eq("follower_id", viewerId).limit(500),
        supabaseAdmin.from("follows").select("follower_id").eq("following_id", viewerId).limit(500),
      ]);
      followedIds = new Set((myFollows ?? []).map((f) => f.following_id as string));
      followedByIds = new Set((myFollowers ?? []).map((f) => f.follower_id as string));
    }
  }

  let query = supabaseAdmin
    .from("users")
    .select("id, clerk_id, first_name, last_name, username, bio, avatar_url, pulse_score, pulse_tier, location_city_name, location_city, interests, created_at")
    .eq("is_active", true)
    .order("pulse_score", { ascending: false })
    .limit(limit);

  if (viewerId) query = query.neq("id", viewerId);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,username.ilike.%${q}%`);
  if (city) query = query.or(`location_city_name.ilike.%${city}%,location_city.ilike.%${city}%`);
  if (cursor) query = query.lt("pulse_score", parseInt(cursor, 10));

  const { data: users, error } = await query;

  if (error) {
    console.error("[GET /api/social/people]", error);
    return jsonNoStore({ users: [], nextCursor: null });
  }

  // Follower counts in one batch
  const userIds = (users ?? []).map((u) => u.id);
  const followerCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: counts } = await supabaseAdmin
      .from("follows")
      .select("following_id")
      .in("following_id", userIds);
    for (const row of counts ?? []) {
      const id = row.following_id as string;
      followerCounts[id] = (followerCounts[id] ?? 0) + 1;
    }
  }

  // Mutual follow count — users that both viewer and this person follow
  const mutualCounts: Record<string, number> = {};
  if (viewerId && followedIds.size > 0) {
    for (const u of users ?? []) {
      if (u.id === viewerId) continue;
      // Count how many of their followers are also followed by viewer
      const { data: theirFollows } = await supabaseAdmin
        .from("follows")
        .select("following_id")
        .eq("follower_id", u.id)
        .limit(200);
      const theirFollowedSet = new Set((theirFollows ?? []).map((f) => f.following_id as string));
      let count = 0;
      for (const id of followedIds) {
        if (theirFollowedSet.has(id)) count++;
      }
      mutualCounts[u.id] = count;
    }
  }

  type UserRow = { location_city_name?: unknown; location_city?: unknown; interests?: unknown };
  function buildReason(u: UserRow, isFollowing: boolean, isFollowedBy: boolean, mutualCount: number): string | null {
    if (isFollowedBy && !isFollowing) return "Follows you";
    if (mutualCount > 0) return `${mutualCount} mutual connection${mutualCount > 1 ? "s" : ""}`;
    const userCity = (u.location_city_name ?? u.location_city) as string | null;
    if (city && userCity) return `In ${userCity}`;
    if (interest && Array.isArray(u.interests) && (u.interests as string[]).includes(interest)) {
      return `Into ${interest}`;
    }
    return null;
  }

  const result: SocialUser[] = (users ?? [])
    .filter((u) => {
      if (!interest) return true;
      return Array.isArray(u.interests) && (u.interests as string[]).includes(interest);
    })
    .map((u) => {
      const isFollowing = followedIds.has(u.id);
      const isFollowedBy = followedByIds.has(u.id);
      const mutualCount = mutualCounts[u.id] ?? 0;

      return {
        id: u.id,
        clerkId: u.clerk_id as string,
        username: u.username as string | null,
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "GoOutside User",
        avatarUrl: u.avatar_url as string | null,
        bio: u.bio as string | null,
        city: (u.location_city_name ?? u.location_city) as string | null,
        pulseTier: (u.pulse_tier as string) ?? "Explorer",
        pulseScore: (u.pulse_score as number) ?? 0,
        followerCount: followerCounts[u.id] ?? 0,
        isFollowing,
        followedBy: isFollowedBy,
        mutual: isFollowing && isFollowedBy,
        mutualCount,
        sharedEventCount: 0,
        reason: buildReason(u, isFollowing, isFollowedBy, mutualCount),
      };
    });

  const lastItem = result[result.length - 1];
  const nextCursor = result.length === limit ? String(lastItem?.pulseScore ?? 0) : null;

  return jsonNoStore({ users: result, nextCursor });
}
