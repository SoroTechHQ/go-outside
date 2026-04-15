import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';

import { AppServices } from '../domain.js';
import { AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { getInteractions, getSuppressions } from './interactions.js';

type FeedLayout = 'horizontal_scroll' | 'editorial_grid' | 'full_width';

type EventCard = {
  id:               string;
  slug:             string;
  title:            string;
  shortDescription: string | null;
  categoryId:       string;
  venueId:          string | null;
  startDatetime:    string;
  priceLabel:       string;
  bannerUrl:        string | null;
  tags:             string[];
  isFeatured:       boolean;
  avgRating:        number | null;
  scarcity?:        { state: string; label: string; ticketsRemaining: number | null };
};

type FeedSection = {
  id:         string;
  label:      string;
  subtitle?:  string;
  events:     EventCard[];
  layout:     FeedLayout;
  cached_at:  string;
};

type FeedResponse = {
  sections:      FeedSection[];
  session_id:    string;
  refresh_after: number;
  user_pulse?:   number;
};

// Time-based section rules (mirrors time_based_feed_rules table)
const TIME_RULES = [
  { id: 'morning',   label: 'Good morning',               categorySlugs: ['education', 'community', 'sports'],    startHour: 6,  endHour: 11, priority: 1 },
  { id: 'afternoon', label: 'This afternoon in Accra',    categorySlugs: ['networking', 'tech', 'education'],     startHour: 11, endHour: 17, priority: 1 },
  { id: 'evening',   label: 'This evening',               categorySlugs: ['food-drink', 'arts'],                  startHour: 16, endHour: 20, priority: 2 },
  { id: 'tonight',   label: 'Tonight in Accra',           categorySlugs: ['music', 'arts', 'food-drink'],         startHour: 19, endHour: 23, priority: 3 },
  { id: 'weekend',   label: 'This Weekend',               categorySlugs: ['music', 'food-drink', 'sports'],       startHour: 0,  endHour: 23, priority: 2 },
];

function getPriceLabel(minPrice: number | null): string {
  if (minPrice === null) return 'Free';
  if (minPrice === 0) return 'Free';
  return `GHS ${minPrice}`;
}

function scoreEvent(
  event: ReturnType<MemoryStore['listEvents']>['data'][0],
  userId: string | null,
  userInterests: string[],
  userCity: string,
  interactions: ReturnType<typeof getInteractions>
): number {
  let score = 0;

  // Category match — simple presence check (replaces full vector in demo)
  const categorySlug = event.categoryId; // In real DB joined with categories
  const interestIndex = userInterests.indexOf(categorySlug);
  if (interestIndex === 0) score += 3.0;
  else if (interestIndex === 1) score += 2.0;
  else if (interestIndex >= 2) score += 1.0;

  // Location match
  const city = userCity.toLowerCase();
  if (event.customLocation?.toLowerCase().includes(city)) score += 2.5;
  else score += 0.5;

  // Velocity — saves and ticket_intents in last 48h
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const velocity = interactions.filter(
    (i) =>
      i.toId === event.id &&
      ['save', 'ticket_intent'].includes(i.edgeType) &&
      new Date(i.createdAt).getTime() > cutoff
  ).length;
  score += velocity * 1.5;

  // Quality
  score += (event.avgRating ?? 0) * 1.2;

  // Urgency (sooner events rank higher — max boost 1.0 for events within 7 days)
  const secsUntil = (new Date(event.startDatetime).getTime() - Date.now()) / 1000;
  score += Math.max(0, 1.0 - secsUntil / (7 * 86400));

  // Featured bonus
  if (event.isFeatured) score += 1.5;

  return score;
}

function toEventCard(
  event: ReturnType<MemoryStore['listEvents']>['data'][0],
  store: MemoryStore
): EventCard {
  // Get cheapest ticket type
  const ticketTypes = [...store.ticketTypes.values()].filter(
    (tt) => tt.eventId === event.id && tt.isActive
  );
  const minPrice = ticketTypes.length > 0
    ? Math.min(...ticketTypes.map((tt) => tt.price))
    : null;

  return {
    id:               event.id,
    slug:             event.slug,
    title:            event.title,
    shortDescription: event.shortDescription ?? null,
    categoryId:       event.categoryId,
    venueId:          event.venueId ?? null,
    startDatetime:    event.startDatetime,
    priceLabel:       getPriceLabel(minPrice),
    bannerUrl:        event.bannerUrl ?? null,
    tags:             event.tags,
    isFeatured:       event.isFeatured,
    avgRating:        event.avgRating ?? null,
  };
}

export function createFeedRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  // GET /feed — main feed endpoint
  router.get('/', (c) => {
    const userId = c.req.query('user_id') ?? null;
    const userCity = c.req.query('city') ?? 'Accra';
    const userInterestsRaw = c.req.query('interests') ?? '';
    const userInterests = userInterestsRaw ? userInterestsRaw.split(',') : ['music', 'food-drink', 'tech'];
    const section = c.req.query('section');
    const cursor = c.req.query('cursor');

    const interactions = getInteractions();
    const suppressedIds = userId ? (getSuppressions().get(userId) ?? new Set<string>()) : new Set<string>();

    const now = services.now();
    const allEvents = store.listEvents({ requesterId: null, page: 1, limit: 200 }).data
      .filter((e) => e.status === 'published' && new Date(e.startDatetime) > now)
      .filter((e) => !suppressedIds.has(e.id));

    // Score and rank events
    const scored = allEvents.map((e) => ({
      event: e,
      score: scoreEvent(e, userId, userInterests, userCity, interactions),
    })).sort((a, b) => b.score - a.score);

    const topEvents = scored.map((s) => toEventCard(s.event, store));

    // Handle cursor-based pagination for infinite scroll
    if (section === 'infinite') {
      const cursorIdx = cursor ? topEvents.findIndex((e) => e.id === cursor) + 1 : 0;
      const page = topEvents.slice(cursorIdx, cursorIdx + 12);
      const nextCursor = page.length === 12 ? page[page.length - 1]!.id : null;

      return c.json({
        events:      page,
        next_cursor: nextCursor,
        total:       topEvents.length,
      });
    }

    // Current hour for time-based sections
    const currentHour = now.getHours();

    // Build named sections
    const sections: FeedSection[] = [];
    const nowTs = now.toISOString();

    // 1. For You
    const forYouEvents = topEvents.slice(0, 8);
    sections.push({
      id:        'for_you',
      label:     'For You',
      events:    forYouEvents,
      layout:    'editorial_grid',
      cached_at: nowTs,
    });

    // 2. Time-aware section
    const activeRule = TIME_RULES.filter((r) => {
      if (r.endHour < r.startHour) {
        return currentHour >= r.startHour || currentHour < r.endHour;
      }
      return currentHour >= r.startHour && currentHour < r.endHour;
    }).sort((a, b) => b.priority - a.priority)[0];

    if (activeRule) {
      const timeEvents = topEvents
        .filter((e) => activeRule.categorySlugs.some((slug) => e.tags.includes(slug)))
        .slice(0, 6);
      if (timeEvents.length >= 2) {
        sections.push({
          id:        activeRule.id,
          label:     activeRule.label,
          events:    timeEvents,
          layout:    'editorial_grid',
          cached_at: nowTs,
        });
      }
    }

    // 3. This Weekend
    const weekendEnd = new Date(now);
    weekendEnd.setDate(weekendEnd.getDate() + (7 - weekendEnd.getDay()));
    const weekendEvents = topEvents
      .filter((e) => new Date(e.startDatetime) < weekendEnd)
      .slice(0, 8);
    sections.push({
      id:        'this_weekend',
      label:     'This Weekend',
      events:    weekendEvents,
      layout:    'horizontal_scroll',
      cached_at: nowTs,
    });

    // 4. Trending (by saves velocity)
    const trendingEvents = [...allEvents]
      .map((e) => ({
        event: e,
        saves: interactions.filter(
          (i) => i.toId === e.id && i.edgeType === 'save'
        ).length,
      }))
      .sort((a, b) => b.saves - a.saves)
      .slice(0, 6)
      .map((s) => toEventCard(s.event, store));

    sections.push({
      id:        'trending',
      label:     'Trending',
      events:    trendingEvents,
      layout:    'horizontal_scroll',
      cached_at: nowTs,
    });

    // 5. Free events
    const freeEvents = topEvents.filter((e) => e.priceLabel === 'Free').slice(0, 6);
    if (freeEvents.length >= 2) {
      sections.push({
        id:       'free_events',
        label:    'Free This Week',
        subtitle: 'No ticket needed',
        events:   freeEvents,
        layout:   'horizontal_scroll',
        cached_at: nowTs,
      });
    }

    const response: FeedResponse = {
      sections,
      session_id:    randomUUID(),
      refresh_after: 5 * 60, // 5 minutes
      user_pulse:    undefined,
    };

    return c.json(response);
  });

  // GET /feed/now — time-aware sections only
  router.get('/now', (c) => {
    const now = services.now();
    const currentHour = now.getHours();

    const activeRules = TIME_RULES.filter((r) => {
      if (r.endHour < r.startHour) {
        return currentHour >= r.startHour || currentHour < r.endHour;
      }
      return currentHour >= r.startHour && currentHour < r.endHour;
    }).sort((a, b) => b.priority - a.priority);

    return c.json({
      current_hour: currentHour,
      active_rules: activeRules.map((r) => ({
        id:             r.id,
        label:          r.label,
        category_slugs: r.categorySlugs,
        priority:       r.priority,
      })),
    });
  });

  return router;
}
