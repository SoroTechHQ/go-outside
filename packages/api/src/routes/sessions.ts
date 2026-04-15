import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { AppServices } from '../domain.js';
import { AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

type SessionRecord = {
  id:               string;
  userId:           string | null;
  anonymousId:      string | null;
  city:             string;
  deviceType:       string | null;
  startedAt:        string;
  endedAt:          string | null;
  interactionCount: number;
  eventsViewed:     number;
  eventsSaved:      number;
  eventsDismissed:  number;
  refreshCount:     number;
};

// In-memory session store
const sessions = new Map<string, SessionRecord>();

const StartSchema = z.object({
  city:        z.string().optional(),
  device_type: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  user_id:     z.string().optional(),
});

const EndSchema = z.object({
  session_id: z.string().uuid(),
});

export function getSession(id: string) {
  return sessions.get(id);
}

export function incrementSessionInteraction(sessionId: string) {
  const s = sessions.get(sessionId);
  if (s) s.interactionCount += 1;
}

export function createSessionsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  // POST /sessions/start
  router.post('/start', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = StartSchema.safeParse(body);
    const data = parsed.success ? parsed.data : {};

    const sessionId = randomUUID();
    const expiresAt = new Date(services.now().getTime() + 30 * 60 * 1000); // 30 min TTL

    const session: SessionRecord = {
      id:               sessionId,
      userId:           data.user_id ?? null,
      anonymousId:      null,
      city:             data.city ?? 'Accra',
      deviceType:       data.device_type ?? null,
      startedAt:        services.now().toISOString(),
      endedAt:          null,
      interactionCount: 0,
      eventsViewed:     0,
      eventsSaved:      0,
      eventsDismissed:  0,
      refreshCount:     0,
    };

    sessions.set(sessionId, session);

    return c.json({
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
    });
  });

  // POST /sessions/end
  router.post('/end', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = EndSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'session_id required' }, 400);
    }

    const session = sessions.get(parsed.data.session_id);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    session.endedAt = services.now().toISOString();

    // suggest_refresh = true when interaction rate < 1 per 90s
    const durationSecs = (services.now().getTime() - new Date(session.startedAt).getTime()) / 1000;
    const interactionRate = durationSecs > 0 ? session.interactionCount / durationSecs : 0;
    const suggestRefresh = interactionRate < (1 / 90);

    return c.json({
      events_viewed:    session.eventsViewed,
      events_saved:     session.eventsSaved,
      events_dismissed: session.eventsDismissed,
      suggest_refresh:  suggestRefresh,
    });
  });

  // GET /sessions/:id — debug
  router.get('/:id', (c) => {
    const session = sessions.get(c.req.param('id'));
    if (!session) return c.json({ error: 'not found' }, 404);
    return c.json(session);
  });

  return router;
}
