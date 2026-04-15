import { Hono } from 'hono';
import { z } from 'zod';

import { AppServices } from '../domain.js';
import { AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

// Weight map — mirrors graph_edge_type weights from PRD
const WEIGHTS: Record<string, number> = {
  card_view:       0.5,
  card_hover:      1.0,
  card_long_dwell: 1.5,
  card_click:      2.0,
  peek_open:       1.5,
  save:            5.0,
  unsave:         -1.0,
  not_interested: -1.5,
  share:           4.0,
  ticket_intent:   7.0,
  keyboard_save:   5.0,
  scroll_past:    -0.3,
};

const InteractionSchema = z.object({
  event_id:    z.string().uuid(),
  action_type: z.enum([
    'card_view', 'card_hover', 'card_long_dwell', 'card_click', 'peek_open',
    'save', 'unsave', 'not_interested', 'share', 'ticket_intent',
    'keyboard_save', 'scroll_past',
  ]),
  dwell_ms:    z.number().int().positive().optional(),
  source:      z.enum(['feed', 'search', 'peek_panel', 'keyboard', 'direct']).optional(),
  session_id:  z.string().uuid().optional(),
  position:    z.number().int().nonnegative().optional(),
  section:     z.string().optional(),
  anonymous_id: z.string().optional(),
});

// In-memory interaction log (replaces Supabase graph_edges for demo mode)
type InteractionRecord = {
  id:          string;
  fromId:      string;
  fromType:    'user';
  toId:        string;
  toType:      'event';
  edgeType:    string;
  weight:      number;
  dwellMs:     number | null;
  source:      string | null;
  sessionId:   string | null;
  position:    number | null;
  section:     string | null;
  isActive:    boolean;
  createdAt:   string;
};

// Singleton in-memory store for interactions (per process)
const interactionLog: InteractionRecord[] = [];
const suppressions = new Map<string, Set<string>>(); // userId → Set<eventId>

export function getInteractions() {
  return interactionLog;
}

export function getSuppressions() {
  return suppressions;
}

export function createInteractionsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  // POST /interactions — fire-and-forget interaction logging
  // SLA: < 50ms response. Write happens asynchronously.
  router.post('/', async (c) => {
    // Respond immediately
    const responsePromise = c.json({ success: true });

    const body = await c.req.json().catch(() => null);
    if (!body) return responsePromise;

    const parsed = InteractionSchema.safeParse(body);
    if (!parsed.success) return responsePromise;

    const data = parsed.data;

    // Async write — does not block response
    setImmediate(() => {
      try {
        // Resolve actor ID (demo mode: use anonymous_id or session_id as proxy)
        const actorId = data.anonymous_id ?? data.session_id ?? 'anonymous';
        const weight = WEIGHTS[data.action_type] ?? 0;

        // Upsert: replace existing edge of same type between same nodes
        const existingIdx = interactionLog.findIndex(
          (r) => r.fromId === actorId && r.toId === data.event_id && r.edgeType === data.action_type
        );

        const record: InteractionRecord = {
          id:        services.now().toISOString() + Math.random(),
          fromId:    actorId,
          fromType:  'user',
          toId:      data.event_id,
          toType:    'event',
          edgeType:  data.action_type,
          weight,
          dwellMs:   data.dwell_ms ?? null,
          source:    data.source ?? null,
          sessionId: data.session_id ?? null,
          position:  data.position ?? null,
          section:   data.section ?? null,
          isActive:  data.action_type !== 'unsave',
          createdAt: services.now().toISOString(),
        };

        if (existingIdx >= 0) {
          interactionLog[existingIdx] = record;
        } else {
          interactionLog.push(record);
        }

        // Suppression for not_interested
        if (data.action_type === 'not_interested') {
          if (!suppressions.has(actorId)) {
            suppressions.set(actorId, new Set());
          }
          suppressions.get(actorId)!.add(data.event_id);
        }
      } catch {
        // Silently swallow — never block the response
      }
    });

    return responsePromise;
  });

  // GET /interactions/debug — dev only, shows logged interactions
  router.get('/debug', (c) => {
    return c.json({
      total:        interactionLog.length,
      interactions: interactionLog.slice(-50), // last 50
      suppressions: Object.fromEntries(
        [...suppressions.entries()].map(([k, v]) => [k, [...v]])
      ),
    });
  });

  return router;
}
