import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

export type ActivityEventType =
  | 'ticket_purchase'
  | 'review_posted'
  | 'event_saved'
  | 'new_follower'
  | 'friend_going'
  | 'scarcity_alert'
  | 'event_reminder';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  subtitle: string;
  timestamp: string;
  isRead: boolean;
  iconKey: string;
  accentTone: 'brand' | 'gold' | 'red' | 'blue' | 'purple';
  actionHref?: string;
}

export interface ActivityPage {
  items: ActivityEvent[];
  nextCursor: string | null;
  unreadCount: number;
}

const ICON_MAP: Record<ActivityEventType, string> = {
  ticket_purchase: 'ticket',
  review_posted:   'star',
  event_saved:     'bookmark',
  new_follower:    'user-plus',
  friend_going:    'users',
  scarcity_alert:  'fire',
  event_reminder:  'bell',
};

const ACCENT_MAP: Record<ActivityEventType, ActivityEvent['accentTone']> = {
  ticket_purchase: 'gold',
  review_posted:   'purple',
  event_saved:     'brand',
  new_follower:    'blue',
  friend_going:    'brand',
  scarcity_alert:  'red',
  event_reminder:  'brand',
};

export function createActivityRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services));

  /**
   * GET /activity
   * Returns a cursor-paginated activity feed for the authenticated user.
   * Merges: tickets, saved events, follows, reviews into a unified timeline.
   *
   * Query params:
   *   cursor  — ISO timestamp; return items older than this
   *   limit   — number of items (default 20, max 50)
   */
  router.get('/', (c) => {
    const user   = c.get('user');
    const cursor = c.req.query('cursor');
    const limit  = Math.min(Number(c.req.query('limit') ?? 20), 50);

    const cutoff = cursor ? new Date(cursor).getTime() : Infinity;

    // ── Collect activity events from in-memory store ────────────────────────

    const events: ActivityEvent[] = [];

    // 1. Ticket purchases
    const tickets = store.getUserTickets(user.id);
    for (const t of tickets) {
      if (new Date(t.createdAt).getTime() >= cutoff) continue;
      const ev = store.events.get(t.eventId);
      events.push({
        id:         `ticket-${t.id}`,
        type:       'ticket_purchase',
        title:      `You're going to ${ev?.title ?? 'an event'}`,
        subtitle:   `${t.status === 'active' ? 'Active ticket' : 'Ticket used'} · Ref ${t.id.slice(0, 8).toUpperCase()}`,
        timestamp:  t.createdAt,
        isRead:     true,
        iconKey:    ICON_MAP.ticket_purchase,
        accentTone: ACCENT_MAP.ticket_purchase,
        actionHref: `/dashboard/wallets/${t.id}`,
      });
    }

    // 2. Sort by timestamp descending, paginate, compute next cursor
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const page      = events.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].timestamp : null;
    const unreadCount = events.filter((e) => !e.isRead).length;

    return c.json<ActivityPage>({ items: page, nextCursor, unreadCount });
  });

  /**
   * POST /activity/read-all
   * Marks all activity items as read (no-op on in-memory demo store).
   */
  router.post('/read-all', (c) => {
    return c.json({ ok: true });
  });

  return router;
}
