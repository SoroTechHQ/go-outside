import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { demoData, type EventItem } from "@gooutside/demo-data";
import type { AppBootstrap, FeedEventItem, FeedFilters, FeedPage, PublicShellUser } from "../app-contracts";
import { DEFAULT_APP_BOOTSTRAP } from "../app-contracts";
import {
  adaptNotificationFeedItem,
  type DbNotificationFeedRow,
  type NotificationsPage,
} from "../notification-feed";
import { getFeaturedEvents, getPublishedEvents } from "../db/events";
import { supabaseAdmin } from "../supabase";

const INITIAL_COUNT = 6;
const PAGE_SIZE = 4;
const NOTIFICATION_PAGE_SIZE = 20;

type FeedQueryInput = {
  clerkId?: string | null;
  filters: FeedFilters;
  featuredOnly?: boolean;
  limit?: number;
  page?: number;
};

type BootstrapInput = {
  clerkId?: string | null;
  notificationCursor?: string | null;
  notificationLimit?: number;
};

type AppUserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: "attendee" | "organizer" | "admin" | null;
  interests: unknown;
  location_city_name: string | null;
  pulse_tier: string | null;
};

type ScarcityRow = {
  event_id: string;
  state: "normal" | "low" | "critical" | "sold_out";
  tickets_remaining: number | null;
  scarcity_label: string;
};

type FeedProfile = {
  id: string;
  interests: string[];
  city: string | null;
  pulseTier: string;
};

type RankedEvent = EventItem & {
  startDatetime?: string;
  avgRating?: number | null;
};

async function resolveClerkId(clerkId?: string | null) {
  if (clerkId !== undefined) {
    return clerkId;
  }

  const { userId } = await auth();
  return userId;
}

async function getAppUserRow(clerkId: string): Promise<AppUserRow | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, role, interests, location_city_name, pulse_tier")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  return (data as AppUserRow | null) ?? null;
}

function buildShellUserName(user: Pick<AppUserRow, "first_name" | "last_name"> | null) {
  const first = user?.first_name?.trim() ?? "";
  const last = user?.last_name?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
}

async function getShellUser(clerkId?: string | null, user?: AppUserRow | null): Promise<PublicShellUser> {
  if (!clerkId) {
    return DEFAULT_APP_BOOTSTRAP.shellUser;
  }

  const nameFromRow = buildShellUserName(user ?? null);
  if (nameFromRow) {
    return {
      role: user?.role === "organizer" || user?.role === "admin" ? user.role : "attendee",
      userName: nameFromRow,
    };
  }

  const clerk = await currentUser();
  const nameFromClerk = [clerk?.firstName?.trim(), clerk?.lastName?.trim()].filter(Boolean).join(" ").trim();

  return {
    role: user?.role === "organizer" || user?.role === "admin" ? user.role : "attendee",
    userName: nameFromClerk || demoData.attendee.name,
  };
}

async function getSavedEventIds(supabaseUserId: string) {
  const { data } = await supabaseAdmin
    .from("saved_events")
    .select("event_id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row) => row.event_id)
    .filter((value): value is string => typeof value === "string");
}

async function loadNotificationsPage(
  supabaseUserId: string,
  {
    cursor = null,
    limit = NOTIFICATION_PAGE_SIZE,
  }: {
    cursor?: string | null;
    limit?: number;
  } = {},
): Promise<NotificationsPage> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  let notificationsQuery = supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (cursor) {
    notificationsQuery = notificationsQuery.lt("created_at", cursor);
  }

  const [{ data }, { count: unreadCount }] = await Promise.all([
    notificationsQuery,
    supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", supabaseUserId)
      .eq("is_read", false),
  ]);

  const items = (data as DbNotificationFeedRow[] | null)?.map(adaptNotificationFeedItem) ?? [];
  const nextCursor = items.length === safeLimit ? items[items.length - 1]?.timestamp ?? null : null;

  return {
    items,
    nextCursor,
    unreadCount: unreadCount ?? 0,
  };
}

async function getScarcityMap() {
  const { data } = await supabaseAdmin
    .from("scarcity_state")
    .select("event_id, state, tickets_remaining, scarcity_label");

  const map = new Map<string, ScarcityRow>();
  for (const row of (data as ScarcityRow[] | null) ?? []) {
    map.set(row.event_id, row);
  }
  return map;
}

async function getGlobalEdgeWeights() {
  const { data } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, weight")
    .eq("to_type", "event");

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.to_id) {
      map.set(row.to_id, (map.get(row.to_id) ?? 0) + Number(row.weight ?? 0));
    }
  }
  return map;
}

function toFeedProfile(user: AppUserRow | null): FeedProfile | null {
  if (!user) return null;

  return {
    id: user.id,
    interests: Array.isArray(user.interests) ? (user.interests as string[]) : [],
    city: user.location_city_name,
    pulseTier: user.pulse_tier ?? "Explorer",
  };
}

async function getSocialSignals(userId: string, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();

  const { data: friendRows } = await supabaseAdmin
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const friendIds = (friendRows ?? []).map((row: { user_a_id: string; user_b_id: string }) =>
    row.user_a_id === userId ? row.user_b_id : row.user_a_id,
  );

  if (friendIds.length === 0) return new Map<string, number>();

  const weights: Record<string, number> = {
    registered: 3,
    checked_in: 2.5,
    saved: 1.5,
    shared: 1,
    viewed: 0.3,
  };

  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, edge_type")
    .in("to_id", eventIds)
    .in("from_id", friendIds)
    .in("edge_type", Object.keys(weights));

  const map = new Map<string, number>();
  for (const edge of edges ?? []) {
    const eventId = edge.to_id as string | null;
    if (!eventId) continue;
    map.set(eventId, (map.get(eventId) ?? 0) + (weights[edge.edge_type as string] ?? 0));
  }
  return map;
}

function computeUrgency(startDatetime: string) {
  const secondsUntil = (new Date(startDatetime).getTime() - Date.now()) / 1000;
  if (secondsUntil <= 0) return 0;
  if (secondsUntil < 86400) return 1;
  if (secondsUntil < 3 * 86400) return 0.7;
  if (secondsUntil < 7 * 86400) return 0.4;
  return 0.1;
}

function scoreEvent(
  event: RankedEvent,
  scarcity: ScarcityRow | undefined,
  edgeWeight: number,
  socialScore: number,
  userInterests: string[],
  userCity: string | null,
) {
  const interestIdx = userInterests.indexOf(event.categorySlug);
  const interest =
    interestIdx === 0 ? 3 :
    interestIdx === 1 ? 2.2 :
    interestIdx >= 2 ? 1.5 :
    0.3;

  const location = userCity && event.city?.toLowerCase().includes(userCity.toLowerCase()) ? 1 : 0.3;
  const social = Math.min(socialScore * 0.5, 5);
  const velocity = Math.min(edgeWeight / 10, 3);
  const quality = typeof event.avgRating === "number" ? (event.avgRating / 5) * 1.2 : 0;
  const urgency = event.startDatetime ? computeUrgency(event.startDatetime) : 0;
  const featuredBonus = event.featured ? 2.5 : 0;
  const trendingBonus = event.trending ? 1.5 : 0;
  const scarcityBonus = scarcity?.state === "critical" ? 1 : scarcity?.state === "low" ? 0.5 : 0;

  return (
    interest * 3 +
    location * 2.5 +
    social * 2.5 +
    velocity * 1.5 +
    quality * 1.2 +
    urgency +
    featuredBonus +
    trendingBonus +
    scarcityBonus
  );
}

function applyFilters(source: EventItem[], filters: FeedFilters) {
  return source.filter((event) => {
    if (filters.categories.length > 0 && !filters.categories.includes(event.categorySlug)) return false;

    if (filters.query) {
      const haystack = `${event.title} ${event.venue} ${event.city} ${event.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query)) return false;
    }

    if (filters.when) {
      const haystack = `${event.dateLabel} ${event.eyebrow}`.toLowerCase();
      if (!haystack.includes(filters.when)) return false;
    }

    return true;
  });
}

function toPublicFeedEvent(
  event: RankedEvent,
  scarcity: ScarcityRow | undefined,
  feedIndex: number,
): FeedEventItem {
  const {
    avgRating: _avgRating,
    startDatetime: _startDatetime,
    ...publicEvent
  } = event;

  return {
    ...publicEvent,
    _feedIndex: feedIndex,
    _feedKey: `${event.id}-${feedIndex}`,
    scarcity: scarcity
      ? {
          state: scarcity.state,
          label: scarcity.scarcity_label,
          ticketsRemaining: scarcity.tickets_remaining,
        }
      : undefined,
  };
}

export async function loadFeedPage({
  clerkId,
  filters,
  featuredOnly = false,
  limit = -1,
  page = 0,
}: FeedQueryInput): Promise<FeedPage> {
  const resolvedClerkId = await resolveClerkId(clerkId);
  const user = resolvedClerkId ? await getAppUserRow(resolvedClerkId) : null;
  const feedProfile = toFeedProfile(user);

  const [allEvents, scarcityMap, edgeWeightsMap] = await Promise.all([
    featuredOnly ? getFeaturedEvents(limit > 0 ? limit : 8) : getPublishedEvents(),
    getScarcityMap(),
    getGlobalEdgeWeights(),
  ]);

  const eventIds = allEvents.map((event) => event.id);
  const socialSignals = feedProfile ? await getSocialSignals(feedProfile.id, eventIds) : new Map<string, number>();

  const filtered = applyFilters(allEvents, filters);
  const source = filtered.length > 0 ? filtered : filters.categories.length > 0 || filters.query || filters.when ? [] : allEvents;

  const interests = feedProfile?.interests ?? [];
  const city = feedProfile?.city ?? null;

  const scored = [...source].sort(
    (left, right) =>
      scoreEvent(right as RankedEvent, scarcityMap.get(right.id), edgeWeightsMap.get(right.id) ?? 0, socialSignals.get(right.id) ?? 0, interests, city) -
      scoreEvent(left as RankedEvent, scarcityMap.get(left.id), edgeWeightsMap.get(left.id) ?? 0, socialSignals.get(left.id) ?? 0, interests, city),
  );

  const pageLimit = limit > 0 ? limit : page === 0 ? INITIAL_COUNT : PAGE_SIZE;
  const startIndex = limit > 0 ? 0 : page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE;
  const hasMore = !featuredOnly && limit < 0 && scored.length > startIndex + pageLimit;

  return {
    items: scored.slice(startIndex, startIndex + pageLimit).map((event, index) =>
      toPublicFeedEvent(event as RankedEvent, scarcityMap.get(event.id), startIndex + index),
    ),
    nextPage: page + 1,
    hasMore,
    total: scored.length,
  };
}

export async function loadAppBootstrap({
  clerkId,
  notificationCursor = null,
  notificationLimit = 8,
}: BootstrapInput = {}): Promise<AppBootstrap> {
  const resolvedClerkId = await resolveClerkId(clerkId);
  if (!resolvedClerkId) {
    return DEFAULT_APP_BOOTSTRAP;
  }

  const user = await getAppUserRow(resolvedClerkId);
  const shellUser = await getShellUser(resolvedClerkId, user);

  if (!user) {
    return {
      shellUser,
      savedEventIds: [],
      notifications: DEFAULT_APP_BOOTSTRAP.notifications,
    };
  }

  const [savedEventIds, notifications] = await Promise.all([
    getSavedEventIds(user.id),
    loadNotificationsPage(user.id, { cursor: notificationCursor, limit: notificationLimit }),
  ]);

  return {
    shellUser,
    savedEventIds,
    notifications,
  };
}
