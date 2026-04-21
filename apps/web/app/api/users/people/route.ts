import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { jsonNoStore } from "../../../../lib/api-security";

// GET /api/users/people?q=search&limit=20&cursor=uuid
// Returns real users from the DB for people discovery + follow UI
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const cursor = searchParams.get("cursor");

  // Resolve current user's Supabase ID so we can exclude them + mark follow state
  let mySupabaseId: string | null = null;
  if (clerkId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .maybeSingle();
    mySupabaseId = data?.id ?? null;
  }

  let query = supabaseAdmin
    .from("users")
    .select("id, clerk_id, first_name, last_name, username, bio, avatar_url, pulse_score, pulse_tier, location_city_name, location_city, interests, created_at")
    .eq("is_active", true)
    .order("pulse_score", { ascending: false })
    .limit(limit);

  if (mySupabaseId) {
    query = query.neq("id", mySupabaseId);
  }

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,username.ilike.%${q}%`
    );
  }

  if (cursor) {
    query = query.lt("pulse_score", parseInt(cursor, 10));
  }

  const { data: users, error } = await query;

  if (error) {
    console.error("[GET /api/users/people]", error);
    return jsonNoStore({ users: [], nextCursor: null });
  }

  // Get follow statuses for current user in one batch query
  let followedIds = new Set<string>();
  if (mySupabaseId && users && users.length > 0) {
    const targetIds = users.map((u) => u.id);
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_id")
      .eq("follower_id", mySupabaseId)
      .in("following_id", targetIds);
    followedIds = new Set((follows ?? []).map((f) => f.following_id as string));
  }

  // Get follower counts in batch
  const userIds = (users ?? []).map((u) => u.id);
  let followerCounts: Record<string, number> = {};
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

  const result = (users ?? []).map((u) => ({
    id: u.id,
    clerkId: u.clerk_id as string,
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    handle: u.username ? `@${u.username}` : `@${(u.first_name ?? "").toLowerCase()}`,
    bio: u.bio ?? null,
    avatarUrl: u.avatar_url ?? null,
    pulseScore: u.pulse_score ?? 0,
    pulseTier: u.pulse_tier ?? "Explorer",
    city: (u.location_city_name ?? u.location_city) as string | null,
    interests: Array.isArray(u.interests) ? u.interests as string[] : [],
    followerCount: followerCounts[u.id] ?? 0,
    isFollowing: followedIds.has(u.id),
  }));

  const nextCursor = result.length === limit
    ? String(result[result.length - 1]?.pulseScore ?? 0)
    : null;

  return jsonNoStore({ users: result, nextCursor });
}
