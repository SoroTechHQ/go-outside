import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";

export type ActivityEventType =
  | "ticket_purchase"
  | "review_posted"
  | "event_saved"
  | "new_follower"
  | "friend_going"
  | "scarcity_alert"
  | "event_reminder"
  | "notification";

export interface ActivityEvent {
  id:          string;
  type:        ActivityEventType;
  title:       string;
  subtitle:    string;
  timestamp:   string;
  isRead:      boolean;
  iconKey:     string;
  accentTone:  "brand" | "gold" | "red" | "blue" | "purple";
  actionHref?: string;
}

export interface ActivityPage {
  items:        ActivityEvent[];
  nextCursor:   string | null;
  unreadCount:  number;
}

const PAGE_SIZE = 20;

const ICON_MAP: Record<string, string> = {
  ticket_purchase: "ticket",
  review_posted:   "sparkle",
  event_saved:     "bookmark",
  new_follower:    "user",
  friend_going:    "users",
  scarcity_alert:  "warning-circle",
  event_reminder:  "bell",
  notification:    "bell",
  // DB notification types → icons
  review_reply:    "megaphone",
  event_cancelled: "warning-circle",
  event_update:    "megaphone",
};

const ACCENT_MAP: Record<string, ActivityEvent["accentTone"]> = {
  ticket_purchase: "gold",
  review_posted:   "purple",
  event_saved:     "brand",
  new_follower:    "blue",
  friend_going:    "brand",
  scarcity_alert:  "red",
  event_reminder:  "brand",
  review_reply:    "purple",
  event_cancelled: "red",
  event_update:    "blue",
  notification:    "brand",
};

export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve Supabase user via clerk_id
  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) {
    return NextResponse.json<ActivityPage>({ items: [], nextCursor: null, unreadCount: 0 });
  }

  const userId = sbUser.id;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit  = Math.min(Number(searchParams.get("limit") ?? PAGE_SIZE), 50);

  const items: ActivityEvent[] = [];

  // ── 1. Notifications ──────────────────────────────────────────────────────
  let notifQ = supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit * 3); // fetch extra to allow merging

  if (cursor) {
    notifQ = notifQ.lt("created_at", cursor);
  }

  const { data: notifs } = await notifQ;
  for (const n of notifs ?? []) {
    const t = n.type as string;
    items.push({
      id:         `notif-${n.id}`,
      type:       (t as ActivityEventType) ?? "notification",
      title:      n.title,
      subtitle:   n.body,
      timestamp:  n.created_at,
      isRead:     n.is_read,
      iconKey:    ICON_MAP[t] ?? ICON_MAP.notification,
      accentTone: ACCENT_MAP[t] ?? "brand",
    });
  }

  // ── 2. Recent ticket purchases ────────────────────────────────────────────
  let ticketQ = supabaseAdmin
    .from("tickets")
    .select(`
      id, created_at, status, purchase_price,
      events (title, slug),
      ticket_types (name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    ticketQ = ticketQ.lt("created_at", cursor);
  }

  const { data: tickets } = await ticketQ;
  for (const t of tickets ?? []) {
    const ev = (t as unknown as { events: { title: string; slug: string } }).events;
    const tt = (t as unknown as { ticket_types: { name: string } }).ticket_types;
    items.push({
      id:         `ticket-${t.id}`,
      type:       "ticket_purchase",
      title:      `You're going to ${ev?.title ?? "an event"}`,
      subtitle:   `${tt?.name ?? "Ticket"} · Ref ${t.id.slice(0, 8).toUpperCase()}`,
      timestamp:  t.created_at,
      isRead:     true,
      iconKey:    ICON_MAP.ticket_purchase,
      accentTone: ACCENT_MAP.ticket_purchase,
      actionHref: `/dashboard/wallets/${t.id}`,
    });
  }

  // ── 3. New followers ──────────────────────────────────────────────────────
  let followQ = supabaseAdmin
    .from("follows")
    .select(`
      id, created_at,
      users!follows_follower_id_fkey (first_name, last_name)
    `)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    followQ = followQ.lt("created_at", cursor);
  }

  const { data: follows } = await followQ;
  for (const f of follows ?? []) {
    const follower = (f as unknown as { users: { first_name: string; last_name: string } | null }).users;
    const name = follower ? `${follower.first_name} ${follower.last_name}` : "Someone";
    items.push({
      id:         `follow-${f.id}`,
      type:       "new_follower",
      title:      `${name} started following you`,
      subtitle:   "New follower",
      timestamp:  f.created_at,
      isRead:     true,
      iconKey:    ICON_MAP.new_follower,
      accentTone: ACCENT_MAP.new_follower,
    });
  }

  // ── 4. Reviews posted by this user ────────────────────────────────────────
  let reviewQ = supabaseAdmin
    .from("reviews")
    .select(`
      id, rating, created_at,
      events (title, slug)
    `)
    .eq("user_id", userId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    reviewQ = reviewQ.lt("created_at", cursor);
  }

  const { data: reviews } = await reviewQ;
  for (const r of reviews ?? []) {
    const ev = (r as unknown as { events: { title: string; slug: string } }).events;
    items.push({
      id:         `review-${r.id}`,
      type:       "review_posted",
      title:      `You reviewed ${ev?.title ?? "an event"}`,
      subtitle:   `${r.rating} / 5 stars`,
      timestamp:  r.created_at,
      isRead:     true,
      iconKey:    ICON_MAP.review_posted,
      accentTone: ACCENT_MAP.review_posted,
      actionHref: ev?.slug ? `/events/${ev.slug}` : undefined,
    });
  }

  // ── 5. Events saved ───────────────────────────────────────────────────────
  let savedQ = supabaseAdmin
    .from("saved_events")
    .select(`
      id, created_at,
      events (title, slug)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    savedQ = savedQ.lt("created_at", cursor);
  }

  const { data: saved } = await savedQ;
  for (const s of saved ?? []) {
    const ev = (s as unknown as { events: { title: string; slug: string } }).events;
    items.push({
      id:         `save-${s.id}`,
      type:       "event_saved",
      title:      `You saved ${ev?.title ?? "an event"}`,
      subtitle:   "Saved to your list",
      timestamp:  s.created_at,
      isRead:     true,
      iconKey:    ICON_MAP.event_saved,
      accentTone: ACCENT_MAP.event_saved,
      actionHref: ev?.slug ? `/events/${ev.slug}` : undefined,
    });
  }

  // ── Sort, dedupe, paginate ────────────────────────────────────────────────
  const deduped = Array.from(new Map(items.map((i) => [i.id, i])).values());
  deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const page       = deduped.slice(0, limit);
  const nextCursor = page.length === limit ? page[page.length - 1].timestamp : null;

  // Unread count: check notifications table directly (efficient)
  const { count: unreadCount } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return NextResponse.json<ActivityPage>({
    items:       page,
    nextCursor,
    unreadCount: unreadCount ?? 0,
  });
}
