import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { cancelEventSchema, createEventSchema, eventQuerySchema, updateEventSchema } from '../validators/events.js';
import { parseWithSchema } from '../lib/validation.js';

export function createEventsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();
  const toListOptions = (query: {
    page?: number;
    limit?: number;
    category?: string;
    city?: string;
    price?: 'free' | 'paid';
    q?: string;
    organizerId?: string;
  }) => ({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    category: query.category,
    city: query.city,
    price: query.price,
    q: query.q,
    organizerId: query.organizerId
  });

  router.get('/', (c) => {
    const query = parseWithSchema(eventQuerySchema, c.req.query());
    const result = store.listEvents({ ...toListOptions(query), requesterId: null });
    return c.json(result);
  });

  router.get('/featured', (c) => {
    const query = parseWithSchema(eventQuerySchema, c.req.query());
    const result = store.listEvents({ ...toListOptions(query), featuredOnly: true, requesterId: null });
    return c.json(result);
  });

  router.get('/trending', (c) => {
    const query = parseWithSchema(eventQuerySchema, c.req.query());
    const result = store.listEvents({ ...toListOptions(query), trendingOnly: true, requesterId: null });
    return c.json(result);
  });

  router.get('/search', (c) => {
    const query = parseWithSchema(eventQuerySchema, c.req.query());
    const result = store.listEvents({ ...toListOptions(query), requesterId: null });
    return c.json(result);
  });

  router.get('/:id', (c) => {
    const event = store.getEventDetail(c.req.param('id'), null);
    return c.json({ data: event });
  });

  router.get('/:id/ticket-types', (c) => {
    const event = store.getEventDetail(c.req.param('id'), null);
    return c.json({ data: event.ticketTypes });
  });

  router.use('*', authMiddleware(store, services));

  router.post('/', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(createEventSchema, await c.req.json());
    const event = store.createEvent(
      {
        ...payload,
        organizerId: user.id,
        timezone: payload.timezone ?? 'Africa/Accra'
      },
      services
    );
    return c.json({ data: event }, 201);
  });

  router.patch('/:id', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(updateEventSchema, await c.req.json());
    const event = store.updateEvent(c.req.param('id'), user.id, payload, services);
    return c.json({ data: event });
  });

  router.delete('/:id', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    store.deleteDraftEvent(c.req.param('id'), user.id);
    return c.json({ data: { success: true } });
  });

  router.post('/:id/publish', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const event = store.publishEvent(c.req.param('id'), user.id, services);
    return c.json({ data: event });
  });

  router.post('/:id/unpublish', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const event = store.unpublishEvent(c.req.param('id'), user.id, services);
    return c.json({ data: event });
  });

  router.post('/:id/cancel', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(cancelEventSchema, await c.req.json().catch(() => ({})));
    const event = store.cancelEvent(c.req.param('id'), user.id, payload.reason ?? null, services);
    return c.json({ data: event });
  });

  router.post('/:id/clone', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const event = store.cloneEvent(c.req.param('id'), user.id, services);
    return c.json({ data: event }, 201);
  });

  router.post('/:id/save', requireRole('attendee', 'organizer', 'admin'), (c) => {
    const user = c.get('user');
    store.saveEvent(user.id, c.req.param('id'));
    return c.json({ data: { success: true } });
  });

  router.delete('/:id/save', requireRole('attendee', 'organizer', 'admin'), (c) => {
    const user = c.get('user');
    store.unsaveEvent(user.id, c.req.param('id'));
    return c.json({ data: { success: true } });
  });

  return router;
}
