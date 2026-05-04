import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { jsonError, jsonNoStore } from "../../../../lib/api-security";

export type ContactRelationship = "mutual" | "following" | "follower" | "none";

export type ChatContact = {
  id: string;            // Clerk ID — used as Stream user ID
  username: string | null;
  name: string;
  image: string | null;
  relationship: ContactRelationship;
};

export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!me) return jsonError(404, "User not found");

  if (q) {
    // Search all users by username or display name, excluding self
    const { data: raw } = await supabaseAdmin
      .from("users")
      .select("id, clerk_id, username, first_name, last_name, avatar_url")
      .neq("clerk_id", clerk.id)
      .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(20);

    if (!raw || raw.length === 0) return jsonNoStore({ contacts: [] as ChatContact[] });

    const resultIds = raw.map((u) => u.id);

    const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
      supabaseAdmin.from("follows").select("following_id").eq("follower_id", me.id).in("following_id", resultIds),
      supabaseAdmin.from("follows").select("follower_id").eq("following_id", me.id).in("follower_id", resultIds),
    ]);

    const followingSet = new Set(followingRows?.map((r) => r.following_id) ?? []);
    const followerSet = new Set(followerRows?.map((r) => r.follower_id) ?? []);

    const contacts: ChatContact[] = raw.map((u) => ({
      id: u.clerk_id,
      username: u.username ?? null,
      name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "Unknown",
      image: u.avatar_url ?? null,
      relationship:
        followingSet.has(u.id) && followerSet.has(u.id)
          ? "mutual"
          : followingSet.has(u.id)
            ? "following"
            : followerSet.has(u.id)
              ? "follower"
              : "none",
    }));

    return jsonNoStore({ contacts });
  }

  // Default: social graph — people you follow or who follow you
  const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
    supabaseAdmin.from("follows").select("following_id").eq("follower_id", me.id).limit(100),
    supabaseAdmin.from("follows").select("follower_id").eq("following_id", me.id).limit(100),
  ]);

  const followingIds = followingRows?.map((r) => r.following_id) ?? [];
  const followerIds = followerRows?.map((r) => r.follower_id) ?? [];
  const allIds = [...new Set([...followingIds, ...followerIds])];

  if (allIds.length === 0) return jsonNoStore({ contacts: [] as ChatContact[] });

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, clerk_id, username, first_name, last_name, avatar_url")
    .in("id", allIds);

  const followingSet = new Set(followingIds);
  const followerSet = new Set(followerIds);

  const contacts: ChatContact[] = (users ?? []).map((u) => ({
    id: u.clerk_id,
    username: u.username ?? null,
    name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "Unknown",
    image: u.avatar_url ?? null,
    relationship:
      followingSet.has(u.id) && followerSet.has(u.id)
        ? "mutual"
        : followingSet.has(u.id)
          ? "following"
          : "follower",
  }));

  // Mutuals first, then following, then followers — alphabetical within each group
  contacts.sort((a, b) => {
    const order = { mutual: 0, following: 1, follower: 2, none: 3 };
    const diff = order[a.relationship] - order[b.relationship];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  return jsonNoStore({ contacts });
}
