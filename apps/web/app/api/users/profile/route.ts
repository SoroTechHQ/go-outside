import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { jsonNoStore, jsonError } from "../../../../lib/api-security";

// GET /api/users/profile?clerkId=<clerkId>
// Returns a real user's full profile + follower/following counts + follow status
export async function GET(req: NextRequest) {
  const { userId: myClerkId } = await auth();
  const targetClerkId = req.nextUrl.searchParams.get("clerkId");
  if (!targetClerkId) return jsonError(400, "clerkId required");

  // Resolve my supabase ID
  let mySupabaseId: string | null = null;
  if (myClerkId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", myClerkId)
      .maybeSingle();
    mySupabaseId = data?.id ?? null;
  }

  // Fetch the target user
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, clerk_id, first_name, last_name, username, bio, avatar_url, pulse_score, pulse_tier, location_city_name, location_city, interests, created_at, is_verified_organizer, account_type")
    .eq("clerk_id", targetClerkId)
    .maybeSingle();

  if (error || !user) return jsonError(404, "User not found");

  // Batch: follower count, following count, follow status, ticket count
  const [followerResult, followingResult, followStatusResult, ticketResult] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id),
    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", user.id),
    mySupabaseId && mySupabaseId !== user.id
      ? supabaseAdmin
          .from("follows")
          .select("id")
          .eq("follower_id", mySupabaseId)
          .eq("following_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  return jsonNoStore({
    id: user.id,
    clerkId: user.clerk_id,
    name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
    handle: user.username ? `@${user.username}` : `@${(user.first_name ?? "").toLowerCase()}`,
    bio: user.bio ?? null,
    avatarUrl: user.avatar_url ?? null,
    pulseScore: user.pulse_score ?? 0,
    pulseTier: user.pulse_tier ?? "Explorer",
    city: (user.location_city_name ?? user.location_city) as string | null,
    interests: Array.isArray(user.interests) ? user.interests as string[] : [],
    isVerifiedOrganizer: user.is_verified_organizer ?? false,
    accountType: user.account_type ?? "user",
    joinedAt: user.created_at as string,
    followerCount: followerResult.count ?? 0,
    followingCount: followingResult.count ?? 0,
    ticketsCount: ticketResult.count ?? 0,
    isFollowing: !!(followStatusResult as { data: unknown }).data,
    isOwnProfile: myClerkId === targetClerkId,
  });
}
