// Canonical follow service — all follow/unfollow logic goes through here.
// Both /api/follow and /api/users/[id]/follow delegate to this module.

import { supabaseAdmin } from "../supabase";
import { insertNotification } from "../db/insert-notification";
import { sendFollowEmail } from "../email";
import type { FollowStatus } from "./types";

export async function resolveUserIdFromClerkId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getFollowStatus(
  viewerId: string,
  targetId: string,
): Promise<FollowStatus> {
  const [{ data: fwd }, { data: rev }] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", targetId)
      .maybeSingle(),
    supabaseAdmin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", targetId)
      .eq("following_id", viewerId)
      .maybeSingle(),
  ]);

  const following = !!fwd;
  const followedBy = !!rev;
  return { following, followedBy, mutual: following && followedBy };
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<{ error?: string }> {
  if (followerId === followingId) return { error: "Cannot follow yourself" };

  // Insert into follows (idempotent via upsert)
  const { error: followErr } = await supabaseAdmin
    .from("follows")
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: "follower_id,following_id" });

  if (followErr) return { error: followErr.message };

  // Write behavioral signal (fire-and-forget, ignore duplicate)
  void supabaseAdmin
    .from("graph_edges")
    .insert({
      from_id: followerId,
      from_type: "user",
      to_id: followingId,
      to_type: "user",
      edge_type: "follows",
      weight: 1.0,
      is_active: true,
    })
    .then(({ error }) => {
      if (error && error.code !== "23505") console.error("[graph_edges follow]", error);
    });

  // Notification — one per follow, idempotent via dedup on type+actor
  const { data: actor } = await supabaseAdmin
    .from("users")
    .select("first_name, last_name, username, avatar_url")
    .eq("id", followerId)
    .maybeSingle();

  const actorName = actor
    ? `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || "Someone"
    : "Someone";

  insertNotification({
    userId: followingId,
    type: "new_follower",
    title: `${actorName} started following you`,
    body: actor?.username ? `@${actor.username}` : "Check out their profile",
    data: {
      actor_id: followerId,
      actor_name: actorName,
      actor_avatar_url: actor?.avatar_url ?? null,
    },
    actionHref: actor?.username ? `/${actor.username}` : `/dashboard/user/${followerId}`,
  });

  // Fire-and-forget follow email — only if the followed user has email notifications enabled
  void (async () => {
    const { data: followed } = await supabaseAdmin
      .from("users")
      .select("email, notification_prefs")
      .eq("id", followingId)
      .maybeSingle();

    const prefs = (followed?.notification_prefs ?? {}) as Record<string, unknown>;
    if (followed?.email && prefs.email !== false) {
      await sendFollowEmail({
        to: followed.email as string,
        followerName: actorName,
        followerUsername: actor?.username ?? null,
        followerAvatarUrl: actor?.avatar_url ?? null,
      });
    }
  })();

  return {};
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<{ error?: string }> {
  const [{ error }] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId),
    supabaseAdmin
      .from("graph_edges")
      .delete()
      .eq("from_id", followerId)
      .eq("to_id", followingId)
      .eq("edge_type", "follows"),
  ]);

  if (error) return { error: error.message };
  return {};
}

type FollowUser = {
  id: string;
  clerk_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  pulse_tier: string | null;
};

export async function listFollowers(
  targetId: string,
  limit = 50,
  offset = 0,
): Promise<FollowUser[]> {
  const { data } = await supabaseAdmin
    .from("follows")
    .select("follower:follower_id(id, clerk_id, username, first_name, last_name, avatar_url, pulse_tier)")
    .eq("following_id", targetId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return ((data ?? []).map((r) => r.follower).filter(Boolean)) as unknown as FollowUser[];
}

export async function listFollowing(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<FollowUser[]> {
  const { data } = await supabaseAdmin
    .from("follows")
    .select("following:following_id(id, clerk_id, username, first_name, last_name, avatar_url, pulse_tier)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return ((data ?? []).map((r) => r.following).filter(Boolean)) as unknown as FollowUser[];
}
