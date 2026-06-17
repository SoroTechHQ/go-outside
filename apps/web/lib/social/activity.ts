// Social activity service — normalized activity feed from multiple sources.
// Powers: activity page, home social feed, event sidepane social proof.

import { supabaseAdmin } from "../supabase";
import type { SocialActivityItem } from "./types";

type ActivityMode = "following" | "plans" | "profile";

type DBUser = { id: string; clerk_id?: string; first_name: string | null; last_name: string | null; username: string | null; avatar_url: string | null };
type DBEvent = { id: string; title: string; slug: string; banner_url: string | null };

function asUser(val: unknown): DBUser | null {
  if (!val || typeof val !== "object") return null;
  const u = val as Record<string, unknown>;
  if (typeof u["id"] !== "string") return null;
  return u as unknown as DBUser;
}

function asEvent(val: unknown): DBEvent | null {
  if (!val || typeof val !== "object") return null;
  const e = val as Record<string, unknown>;
  if (typeof e["id"] !== "string") return null;
  return e as unknown as DBEvent;
}

export async function getSocialActivity(opts: {
  viewerId: string;
  mode: ActivityMode;
  cursor?: string;
  limit?: number;
}): Promise<{ items: SocialActivityItem[]; nextCursor: string | null }> {
  const { viewerId, mode, cursor, limit = 20 } = opts;

  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .limit(500);

  const followedIds = (follows ?? []).map((f) => f.following_id as string);

  if (followedIds.length === 0 && mode !== "profile") {
    return { items: [], nextCursor: null };
  }

  const targetIds = mode === "profile" ? [viewerId] : followedIds;
  const items: SocialActivityItem[] = [];

  if (mode === "following" || mode === "profile") {
    // Posts from followed users
    let postsQuery = supabaseAdmin
      .from("posts")
      .select(`
        id, body, created_at, event_id,
        users!posts_user_id_fkey(id, clerk_id, first_name, last_name, username, avatar_url),
        events!posts_event_id_fkey(id, title, slug, banner_url)
      `)
      .in("user_id", targetIds)
      .eq("is_deleted", false)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) postsQuery = postsQuery.lt("created_at", cursor);

    const { data: posts } = await postsQuery;

    for (const p of posts ?? []) {
      const user = asUser(p.users);
      const event = asEvent(p.events);
      if (!user) continue;

      items.push({
        id: `post_${p.id}`,
        actorUserId: user.id,
        actorName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Someone",
        actorUsername: user.username,
        actorAvatarUrl: user.avatar_url,
        verb: "posted",
        targetType: "post",
        targetId: p.id as string,
        targetTitle: (p.body as string).slice(0, 80),
        targetHref: user.username ? `/${user.username}` : `/dashboard/user/${user.id}`,
        eventId: event?.id,
        eventSlug: event?.slug,
        eventImageUrl: event?.banner_url,
        createdAt: p.created_at as string,
        privacy: "public",
      });
    }

    // Follow activity — who followed whom recently
    let followsQuery = supabaseAdmin
      .from("follows")
      .select(`
        follower_id, following_id, created_at,
        follower:follower_id(id, first_name, last_name, username, avatar_url),
        following:following_id(id, first_name, last_name, username, avatar_url)
      `)
      .in("follower_id", targetIds)
      .order("created_at", { ascending: false })
      .limit(Math.floor(limit / 2));

    if (cursor) followsQuery = followsQuery.lt("created_at", cursor);

    const { data: recentFollows } = await followsQuery;

    for (const f of recentFollows ?? []) {
      const actor = asUser(f.follower);
      const target = asUser(f.following);
      if (!actor || !target) continue;

      const targetName = `${target.first_name ?? ""} ${target.last_name ?? ""}`.trim() || "someone";

      items.push({
        id: `follow_${f.follower_id}_${f.following_id}`,
        actorUserId: actor.id,
        actorName: `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || "Someone",
        actorUsername: actor.username,
        actorAvatarUrl: actor.avatar_url,
        verb: "followed",
        targetType: "user",
        targetId: target.id,
        targetTitle: targetName,
        targetHref: target.username ? `/${target.username}` : `/dashboard/user/${target.id}`,
        createdAt: f.created_at as string,
        privacy: "public",
      });
    }
  }

  if (mode === "plans" || mode === "following") {
    // Events that followed users saved (uses proper saved_events table)
    const { data: savedRows } = await supabaseAdmin
      .from("saved_events")
      .select(`
        id, user_id, event_id, created_at,
        users!saved_events_user_id_fkey(id, first_name, last_name, username, avatar_url),
        events!saved_events_event_id_fkey(id, title, slug, banner_url)
      `)
      .in("user_id", followedIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    for (const row of savedRows ?? []) {
      const actor = asUser(row.users);
      const event = asEvent(row.events);
      if (!actor || !event) continue;

      items.push({
        id: `saved_${row.id}`,
        actorUserId: actor.id,
        actorName: `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || "Someone",
        actorUsername: actor.username,
        actorAvatarUrl: actor.avatar_url,
        verb: "saved_event",
        targetType: "event",
        targetId: event.id,
        targetTitle: event.title,
        targetHref: `/events/${event.slug}`,
        eventId: event.id,
        eventSlug: event.slug,
        eventImageUrl: event.banner_url,
        createdAt: row.created_at as string,
        privacy: "followers",
      });
    }

    // Tickets (registrations) from followed users
    const { data: tickets } = await supabaseAdmin
      .from("tickets")
      .select(`
        id, user_id, event_id, created_at,
        users!tickets_user_id_fkey(id, first_name, last_name, username, avatar_url),
        events!tickets_event_id_fkey(id, title, slug, banner_url)
      `)
      .in("user_id", followedIds)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(limit);

    for (const t of tickets ?? []) {
      const actor = asUser(t.users);
      const event = asEvent(t.events);
      if (!actor || !event) continue;

      items.push({
        id: `ticket_${t.id}`,
        actorUserId: actor.id,
        actorName: `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || "Someone",
        actorUsername: actor.username,
        actorAvatarUrl: actor.avatar_url,
        verb: "registered",
        targetType: "event",
        targetId: event.id,
        targetTitle: event.title,
        targetHref: `/events/${event.slug}`,
        eventId: event.id,
        eventSlug: event.slug,
        eventImageUrl: event.banner_url,
        createdAt: t.created_at as string,
        privacy: "followers",
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const page = items.slice(0, limit);
  const nextCursor = page.length === limit ? page[page.length - 1]?.createdAt ?? null : null;

  return { items: page, nextCursor };
}

// Returns social proof for a specific event page
export async function getEventSocialProof(opts: {
  eventId: string;
  viewerId?: string;
  limit?: number;
}): Promise<{
  goingCount: number;
  savedCount: number;
  friendsGoing: { id: string; name: string; avatarUrl: string | null }[];
}> {
  const { eventId, viewerId, limit = 8 } = opts;

  const [{ count: goingCount }, { count: savedCount }] = await Promise.all([
    supabaseAdmin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed"),
    supabaseAdmin
      .from("graph_edges")
      .select("from_id", { count: "exact", head: true })
      .eq("to_id", eventId)
      .eq("edge_type", "saved"),
  ]);

  let friendsGoing: { id: string; name: string; avatarUrl: string | null }[] = [];

  if (viewerId) {
    const { data: myFollows } = await supabaseAdmin
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .limit(500);

    const followedIds = (myFollows ?? []).map((f) => f.following_id as string);

    if (followedIds.length > 0) {
      const { data: friendTickets } = await supabaseAdmin
        .from("tickets")
        .select("users!tickets_user_id_fkey(id, first_name, last_name, avatar_url)")
        .eq("event_id", eventId)
        .eq("status", "confirmed")
        .in("user_id", followedIds)
        .limit(limit);

      friendsGoing = (friendTickets ?? [])
        .map((t) => {
          const u = asUser(t.users);
          if (!u) return null;
          return {
            id: u.id,
            name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Friend",
            avatarUrl: u.avatar_url,
          };
        })
        .filter(Boolean) as typeof friendsGoing;
    }
  }

  return {
    goingCount: goingCount ?? 0,
    savedCount: savedCount ?? 0,
    friendsGoing,
  };
}
