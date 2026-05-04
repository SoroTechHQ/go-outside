import { supabaseAdmin } from "../supabase";
import type {
  TrendReason,
  TrendingEvent,
  TrendingEventDetail,
  TrendingOrganizer,
  TrendingOrganizerDetail,
  TrendingSnippet,
  TrendingTopic,
  TrendingTopicDetail,
} from "./types";

const WINDOW_HOURS = 48;
const SNIPPET_WINDOW_HOURS = 168;
const BODY_HASHTAG_REGEX = /#([a-z0-9][a-z0-9_-]{1,31})/gi;
const TOPIC_BLOCKLIST = new Set([
  "accra",
  "ghana",
  "gooutside",
  "event",
  "events",
  "weekend",
  "weekends",
  "tonight",
  "today",
  "tomorrow",
  "people",
  "person",
  "crowd",
  "crowds",
  "vibes",
  "vibe",
  "scene",
  "good",
  "great",
  "nice",
  "fun",
  "moment",
  "moments",
  "thing",
  "things",
]);

const EDGE_WEIGHTS: Record<string, number> = {
  card_view: 0.5,
  viewed: 0.5,
  card_click: 1.2,
  peek_open: 1.1,
  card_long_dwell: 1.4,
  share: 4.5,
  shared: 4.5,
  save: 4,
  saved: 4,
  ticket_intent: 7,
  registered: 8,
  checkin: 9,
  organizer_follows: 4,
  follows: 2.5,
  snippet_post: 5,
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  price_label: string | null;
  views_count: number | null;
  saves_count: number | null;
  tickets_sold: number | null;
  reviews_count: number | null;
  avg_rating: number | null;
  tags: string[] | null;
  organizer_id: string;
};

type UserRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type OrganizerProfileRow = {
  user_id: string;
  organization_name: string;
  logo_url: string | null;
  total_events: number | null;
  status: string | null;
  users: UserRow | UserRow[] | null;
};

type SnippetRow = {
  id: string;
  body: string | null;
  rating: number | null;
  vibe_tags: string[] | null;
  created_at: string;
  photo_url: string | null;
  media_urls: string[] | null;
  user_id: string;
  event_id: string;
};

type EdgeRow = {
  to_id: string;
  edge_type: string;
  created_at: string;
  weight: number | null;
};

type EventContext = {
  events: TrendingEvent[];
  eventMap: Map<string, TrendingEvent>;
  rawEventMap: Map<string, EventRow>;
  snippetCounts: Map<string, number>;
  snippetEventIdsByTag: Map<string, Set<string>>;
  topicUsageByEventId: Map<string, Set<string>>;
  organizerUserIds: Set<string>;
};

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function getDecayFactor(createdAt: string) {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours <= 6) return 1.6;
  if (ageHours <= 24) return 1.15;
  if (ageHours <= 48) return 0.8;
  if (ageHours <= 72) return 0.55;
  return 0.35;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function isAllowedTopicTag(tag: string) {
  const normalized = normalizeTag(tag);
  if (!normalized) return false;
  if (normalized.length < 3 || normalized.length > 32) return false;
  if (TOPIC_BLOCKLIST.has(normalized)) return false;
  if (/^\d+$/.test(normalized)) return false;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount > 4) return false;
  return true;
}

function extractBodyHashtags(body: string | null) {
  if (!body) return [];

  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = BODY_HASHTAG_REGEX.exec(body)) !== null) {
    tags.push(normalizeTag(match[1] ?? ""));
  }

  BODY_HASHTAG_REGEX.lastIndex = 0;
  return unique(tags.filter(isAllowedTopicTag));
}

function displayName(user: UserRow | null | undefined) {
  const first = user?.first_name?.trim() ?? "";
  const last = user?.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || user?.username || "Organizer";
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildEventReasons(input: {
  interactions: number;
  snippets: number;
  views: number;
  saves: number;
  tickets: number;
  reviews: number;
  rating: number;
}) {
  const reasons: TrendReason[] = [];

  if (input.interactions > 0) reasons.push({ label: "Momentum", value: `${Math.round(input.interactions)} recent actions` });
  if (input.snippets > 0) reasons.push({ label: "Talked about", value: `${input.snippets} snippet${input.snippets === 1 ? "" : "s"}` });
  if (input.saves > 0) reasons.push({ label: "Saved", value: `${input.saves.toLocaleString()} saves` });
  if (input.tickets > 0) reasons.push({ label: "Tickets", value: `${input.tickets.toLocaleString()} sold` });
  if (input.views > 0) reasons.push({ label: "Views", value: `${input.views.toLocaleString()} views` });
  if (input.reviews > 0 && input.rating > 0) reasons.push({ label: "Rating", value: `${input.rating.toFixed(1)}★ from ${input.reviews}` });

  return reasons.slice(0, 4);
}

function buildOrganizerReasons(input: {
  followers: number;
  eventCount: number;
  snippets: number;
  velocity: number;
}) {
  const reasons: TrendReason[] = [];

  if (input.velocity > 0) reasons.push({ label: "Momentum", value: `${Math.round(input.velocity)} recent follow + event actions` });
  if (input.followers > 0) reasons.push({ label: "Followers", value: `${input.followers.toLocaleString()} following` });
  if (input.eventCount > 0) reasons.push({ label: "Live events", value: `${input.eventCount} published` });
  if (input.snippets > 0) reasons.push({ label: "Community buzz", value: `${input.snippets} snippets on their events` });

  return reasons.slice(0, 4);
}

function buildTopicReasons(input: {
  snippets: number;
  events: number;
  score: number;
}) {
  const reasons: TrendReason[] = [];

  if (input.snippets > 0) reasons.push({ label: "Snippet volume", value: `${input.snippets} people mentioned it` });
  if (input.events > 0) reasons.push({ label: "Event coverage", value: `${input.events} related event${input.events === 1 ? "" : "s"}` });
  reasons.push({ label: "Heat", value: `${Math.round(input.score)} trend score` });

  return reasons;
}

async function getEventRows(): Promise<EventRow[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, banner_url, start_datetime, end_datetime, price_label,
      views_count, saves_count, tickets_sold, reviews_count, avg_rating, tags, organizer_id
    `)
    .eq("status", "published")
    .gte("end_datetime", hoursAgo(24))
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("[trending] events query failed", error.message);
    return [];
  }

  return (data ?? []).filter((row) => !row.end_datetime || row.end_datetime >= hoursAgo(24)) as EventRow[];
}

async function getRecentEventEdges(): Promise<EdgeRow[]> {
  const { data, error } = await supabaseAdmin
    .from("graph_edges")
    .select("to_id, edge_type, created_at, weight")
    .eq("to_type", "event")
    .gte("created_at", hoursAgo(WINDOW_HOURS));

  if (error) {
    console.error("[trending] event edges query failed", error.message);
    return [];
  }

  return (data ?? []) as EdgeRow[];
}

async function getRecentSnippets(): Promise<SnippetRow[]> {
  const { data, error } = await supabaseAdmin
    .from("snippets")
    .select("id, body, rating, vibe_tags, created_at, photo_url, media_urls, user_id, event_id")
    .eq("is_public", true)
    .gte("created_at", hoursAgo(SNIPPET_WINDOW_HOURS))
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[trending] snippets query failed", error.message);
    return [];
  }

  return (data ?? []) as SnippetRow[];
}

async function hydrateSnippets(rows: SnippetRow[]): Promise<TrendingSnippet[]> {
  if (!rows.length) return [];

  const userIds = unique(rows.map((row) => row.user_id));
  const eventIds = unique(rows.map((row) => row.event_id));

  const [{ data: users }, { data: events }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, username, first_name, last_name, avatar_url")
      .in("id", userIds),
    supabaseAdmin
      .from("events")
      .select("id, slug, title")
      .in("id", eventIds),
  ]);

  const userMap = new Map<string, UserRow>((users ?? []).map((user) => [user.id, user as UserRow]));
  const eventMap = new Map<string, { id: string; slug: string; title: string }>(
    (events ?? []).map((event) => [event.id, event as { id: string; slug: string; title: string }]),
  );

  return rows.map((row) => {
    const user = userMap.get(row.user_id);
    const event = eventMap.get(row.event_id);

    return {
      id: row.id,
      body: row.body,
      rating: Number(row.rating ?? 0),
      created_at: row.created_at,
      vibe_tags: unique(
        [
          ...(row.vibe_tags ?? []).map(normalizeTag),
          ...extractBodyHashtags(row.body),
        ].filter(isAllowedTopicTag),
      ),
      photo_url: row.photo_url,
      media_urls: row.media_urls ?? [],
      user: user
        ? {
            id: user.id,
            username: user.username,
            name: displayName(user),
            avatar_url: user.avatar_url,
          }
        : null,
      event: event
        ? {
            id: event.id,
            slug: event.slug,
            title: event.title,
          }
        : null,
    };
  });
}

async function buildEventContext(limit?: number, persistScores = false): Promise<EventContext> {
  const [eventRows, edges, snippets] = await Promise.all([
    getEventRows(),
    getRecentEventEdges(),
    getRecentSnippets(),
  ]);

  const organizerIds = unique(eventRows.map((event) => event.organizer_id));
  const usersRes = organizerIds.length
    ? await supabaseAdmin
        .from("users")
        .select("id, username, first_name, last_name")
        .in("id", organizerIds)
    : { data: [] as UserRow[] };

  const userRows = (usersRes.data ?? []) as UserRow[];
  const userMap = new Map<string, UserRow>(userRows.map((user) => [user.id, user]));
  const rawEventMap = new Map<string, EventRow>(eventRows.map((event) => [event.id, event]));
  const interactionScores = new Map<string, number>();
  const snippetCounts = new Map<string, number>();
  const snippetEventIdsByTag = new Map<string, Set<string>>();
  const topicUsageByEventId = new Map<string, Set<string>>();

  for (const edge of edges) {
    const current = interactionScores.get(edge.to_id) ?? 0;
    const weight = Number(edge.weight ?? EDGE_WEIGHTS[edge.edge_type] ?? 1);
    interactionScores.set(edge.to_id, current + weight * getDecayFactor(edge.created_at));
  }

  for (const snippet of snippets) {
    if (!rawEventMap.has(snippet.event_id)) continue;

    snippetCounts.set(snippet.event_id, (snippetCounts.get(snippet.event_id) ?? 0) + 1);

    const normalizedTags = unique(
      [
        ...(snippet.vibe_tags ?? []).map(normalizeTag),
        ...extractBodyHashtags(snippet.body),
      ].filter(isAllowedTopicTag),
    );
    topicUsageByEventId.set(snippet.event_id, new Set([...(topicUsageByEventId.get(snippet.event_id) ?? new Set<string>()), ...normalizedTags]));

    for (const tag of normalizedTags) {
      const existing = snippetEventIdsByTag.get(tag) ?? new Set<string>();
      existing.add(snippet.event_id);
      snippetEventIdsByTag.set(tag, existing);
    }
  }

  const nowMs = Date.now();
  const events: TrendingEvent[] = eventRows
    .map((event) => {
      const interactions = interactionScores.get(event.id) ?? 0;
      const snippetsForEvent = snippetCounts.get(event.id) ?? 0;
      const views = Number(event.views_count ?? 0);
      const saves = Number(event.saves_count ?? 0);
      const tickets = Number(event.tickets_sold ?? 0);
      const reviews = Number(event.reviews_count ?? 0);
      const rating = Number(event.avg_rating ?? 0);
      const startMs = event.start_datetime ? new Date(event.start_datetime).getTime() : null;
      const daysUntil = startMs != null ? (startMs - nowMs) / 86_400_000 : null;

      let score = interactions;
      score += snippetsForEvent * 4.5;
      score += saves * 1.25;
      score += views * 0.04;
      score += tickets * 0.07;
      score += reviews * 2.25;
      score += rating * 1.5;

      if (daysUntil != null) {
        if (daysUntil >= 0 && daysUntil <= 3) score += 7;
        else if (daysUntil <= 7) score += 4.5;
        else if (daysUntil <= 14) score += 2;
      }

      const organizerUser = userMap.get(event.organizer_id);

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        banner_url: event.banner_url,
        start_datetime: event.start_datetime,
        price_label: event.price_label,
        trending_score: Number(score.toFixed(1)),
        views_count: views,
        saves_count: saves,
        tickets_sold: tickets,
        snippet_count: snippetsForEvent,
        organizer: organizerUser
          ? {
              id: organizerUser.id,
              username: organizerUser.username,
              name: displayName(organizerUser),
            }
          : null,
        reasons: buildEventReasons({
          interactions,
          snippets: snippetsForEvent,
          views,
          saves,
          tickets,
          reviews,
          rating,
        }),
      };
    })
    .sort((a, b) => b.trending_score - a.trending_score);

  const slicedEvents = typeof limit === "number" ? events.slice(0, limit) : events;

  if (persistScores && slicedEvents.length) {
    const upsertRows = slicedEvents.map((event) => ({
      id: event.id,
      trending_score: Math.round(event.trending_score),
      trending_updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin.from("events").upsert(upsertRows, { onConflict: "id" });
    if (error) console.error("[trending] score upsert failed", error.message);
  }

  return {
    events: slicedEvents,
    eventMap: new Map(events.map((event) => [event.id, event])),
    rawEventMap,
    snippetCounts,
    snippetEventIdsByTag,
    topicUsageByEventId,
    organizerUserIds: new Set(organizerIds),
  };
}

export async function getTrendingEvents(limit = 20, persistScores = false) {
  const { events } = await buildEventContext(limit, persistScores);
  return events;
}

export async function getTrendingOrganizers(limit = 20): Promise<TrendingOrganizer[]> {
  const eventContext = await buildEventContext();
  const organizerIds = Array.from(eventContext.organizerUserIds);

  if (!organizerIds.length) return [];

  const [profilesRes, followRes, userEdgeRes] = await Promise.all([
    supabaseAdmin
      .from("organizer_profiles")
      .select(`
        user_id, organization_name, logo_url, total_events, status,
        users!organizer_profiles_user_id_fkey (id, username, first_name, last_name, avatar_url)
      `)
      .in("user_id", organizerIds),
    supabaseAdmin.from("follows").select("following_id").in("following_id", organizerIds),
    supabaseAdmin
      .from("graph_edges")
      .select("to_id, edge_type, created_at, weight")
      .eq("to_type", "user")
      .in("to_id", organizerIds)
      .in("edge_type", ["follows", "organizer_follows"])
      .gte("created_at", hoursAgo(WINDOW_HOURS)),
  ]);

  const profiles = (profilesRes.data ?? []) as OrganizerProfileRow[];
  const followRows = (followRes.data ?? []) as Array<{ following_id: string }>;
  const followCounts = new Map<string, number>();
  const momentum = new Map<string, number>();
  const snippetCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();
  const eventScoreTotals = new Map<string, number>();

  for (const row of followRows) {
    followCounts.set(row.following_id, (followCounts.get(row.following_id) ?? 0) + 1);
  }

  for (const edge of (userEdgeRes.data ?? []) as EdgeRow[]) {
    const value = Number(edge.weight ?? EDGE_WEIGHTS[edge.edge_type] ?? 1) * getDecayFactor(edge.created_at);
    momentum.set(edge.to_id, (momentum.get(edge.to_id) ?? 0) + value);
  }

  for (const event of eventContext.events) {
    const organizerId = eventContext.rawEventMap.get(event.id)?.organizer_id;
    if (!organizerId) continue;
    eventCounts.set(organizerId, (eventCounts.get(organizerId) ?? 0) + 1);
    snippetCounts.set(organizerId, (snippetCounts.get(organizerId) ?? 0) + event.snippet_count);
    eventScoreTotals.set(organizerId, (eventScoreTotals.get(organizerId) ?? 0) + event.trending_score);
  }

  return profiles
    .map((profile) => {
      const joinedUser = Array.isArray(profile.users) ? profile.users[0] ?? null : profile.users;
      const followers = followCounts.get(profile.user_id) ?? 0;
      const snippetCount = snippetCounts.get(profile.user_id) ?? 0;
      const liveEvents = eventCounts.get(profile.user_id) ?? Number(profile.total_events ?? 0);
      const velocity = momentum.get(profile.user_id) ?? 0;
      const score =
        velocity +
        (eventScoreTotals.get(profile.user_id) ?? 0) * 0.28 +
        followers * 0.08 +
        snippetCount * 2.4 +
        liveEvents * 0.75;

      return {
        id: profile.user_id,
        username: joinedUser?.username ?? null,
        name: profile.organization_name || displayName(joinedUser),
        logo_url: profile.logo_url ?? joinedUser?.avatar_url ?? null,
        follower_count: followers,
        event_count: liveEvents,
        snippet_count: snippetCount,
        trending_score: Number(score.toFixed(1)),
        reasons: buildOrganizerReasons({
          followers,
          eventCount: liveEvents,
          snippets: snippetCount,
          velocity,
        }),
      };
    })
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit);
}

export async function getTrendingTopics(limit = 20): Promise<TrendingTopic[]> {
  const eventContext = await buildEventContext();
  const tagScores = new Map<string, number>();
  const tagSnippetCounts = new Map<string, number>();
  const tagEventIds = new Map<string, Set<string>>();
  const eventsById = new Map(eventContext.events.map((event) => [event.id, event]));

  for (const event of eventContext.events) {
    const raw = eventContext.rawEventMap.get(event.id);
    const tags = (raw?.tags ?? []).map(normalizeTag).filter(isAllowedTopicTag);
    for (const tag of tags) {
      tagScores.set(tag, (tagScores.get(tag) ?? 0) + Math.max(1, event.trending_score * 0.22));
      const ids = tagEventIds.get(tag) ?? new Set<string>();
      ids.add(event.id);
      tagEventIds.set(tag, ids);
    }
  }

  for (const [tag, eventIds] of eventContext.snippetEventIdsByTag.entries()) {
    const currentEventIds = tagEventIds.get(tag) ?? new Set<string>();
    for (const eventId of eventIds) currentEventIds.add(eventId);
    tagEventIds.set(tag, currentEventIds);
  }

  for (const [eventId, tags] of eventContext.topicUsageByEventId.entries()) {
    const event = eventsById.get(eventId);
    if (!event) continue;
    for (const tag of tags) {
      tagSnippetCounts.set(tag, (tagSnippetCounts.get(tag) ?? 0) + 1);
      tagScores.set(tag, (tagScores.get(tag) ?? 0) + 4 + event.trending_score * 0.18);
    }
  }

  return Array.from(tagScores.entries())
    .map(([tag, score]) => {
      const eventIds = tagEventIds.get(tag) ?? new Set<string>();
      const leadEvent = [...eventIds]
        .map((id) => eventsById.get(id))
        .filter((event): event is TrendingEvent => Boolean(event))
        .sort((a, b) => b.trending_score - a.trending_score)[0];

      const count = tagSnippetCounts.get(tag) ?? 0;
      return {
        tag,
        count,
        event_count: eventIds.size,
        trending_score: Number(score.toFixed(1)),
        lead_event_slug: leadEvent?.slug ?? null,
        reasons: buildTopicReasons({
          snippets: count,
          events: eventIds.size,
          score,
        }),
      };
    })
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit);
}

export async function getTrendingEventDetail(slug: string): Promise<TrendingEventDetail | null> {
  const [events, snippets] = await Promise.all([
    getTrendingEvents(120),
    getRecentSnippets(),
  ]);

  const event = events.find((entry) => entry.slug === slug);
  if (!event) return null;

  const eventSnippets = snippets.filter((snippet) => snippet.event_id === event.id).slice(0, 12);
  const hydratedSnippets = await hydrateSnippets(eventSnippets);
  const related_topics = unique(
    eventSnippets.flatMap((snippet) => [
      ...(snippet.vibe_tags ?? []).map(normalizeTag),
      ...extractBodyHashtags(snippet.body),
    ]).filter(isAllowedTopicTag),
  ).slice(0, 8);

  return {
    event,
    related_topics,
    snippets: hydratedSnippets,
  };
}

export async function getTrendingOrganizerDetail(identifier: string): Promise<TrendingOrganizerDetail | null> {
  const [organizers, allEvents, snippets] = await Promise.all([
    getTrendingOrganizers(80),
    getTrendingEvents(120),
    getRecentSnippets(),
  ]);

  const organizer = organizers.find((entry) => entry.username === identifier || entry.id === identifier);
  if (!organizer) return null;

  const top_events = allEvents
    .filter((event) => event.organizer?.id === organizer.id)
    .slice(0, 8);

  const eventIds = new Set(top_events.map((event) => event.id));
  const organizerSnippets = snippets.filter((snippet) => eventIds.has(snippet.event_id)).slice(0, 16);

  return {
    organizer,
    top_events,
    snippets: await hydrateSnippets(organizerSnippets),
  };
}

export async function getTrendingTopicDetail(tag: string): Promise<TrendingTopicDetail | null> {
  const normalizedTag = normalizeTag(decodeURIComponent(tag));
  const [topics, eventContext, snippets, organizers] = await Promise.all([
    getTrendingTopics(120),
    buildEventContext(),
    getRecentSnippets(),
    getTrendingOrganizers(80),
  ]);

  const topic = topics.find((entry) => normalizeTag(entry.tag) === normalizedTag);
  if (!topic) return null;

  const matchingEvents = eventContext.events.filter((event) => {
    const raw = eventContext.rawEventMap.get(event.id);
    const tags = (raw?.tags ?? []).map(normalizeTag);
    const snippetTags = Array.from(eventContext.topicUsageByEventId.get(event.id) ?? []);
    return tags.includes(normalizedTag) || snippetTags.includes(normalizedTag);
  });

  const matchedSnippets = snippets
    .filter((snippet) => {
      const tags = unique(
        [
          ...(snippet.vibe_tags ?? []).map(normalizeTag),
          ...extractBodyHashtags(snippet.body),
        ].filter(isAllowedTopicTag),
      );
      return tags.includes(normalizedTag);
    })
    .slice(0, 24);

  const hydratedSnippets = await hydrateSnippets(matchedSnippets);
  const relatedEventIds = new Set(hydratedSnippets.map((snippet) => snippet.event?.id).filter(Boolean) as string[]);
  const extraEvents = eventContext.events.filter((event) => relatedEventIds.has(event.id));
  const eventMap = new Map<string, TrendingEvent>();
  for (const event of matchingEvents) eventMap.set(event.id, event);
  for (const event of extraEvents) eventMap.set(event.id, event);

  const organizerIds = unique(
    Array.from(eventMap.values())
      .map((event) => event.organizer?.id ?? null)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    topic,
    events: Array.from(eventMap.values()).sort((a, b) => b.trending_score - a.trending_score).slice(0, 10),
    snippets: hydratedSnippets,
    related_organizers: organizers.filter((organizer) => organizerIds.includes(organizer.id)).slice(0, 6),
  };
}
