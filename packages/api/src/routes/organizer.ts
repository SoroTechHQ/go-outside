import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { applyOrganizerSchema, updateOrganizerSchema } from '../validators/organizer.js';
import { parseWithSchema } from '../lib/validation.js';

export function createOrganizerRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services));

  router.post('/apply', requireRole('attendee'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(applyOrganizerSchema, await c.req.json());
    const profile = store.applyOrganizer(user.id, payload, services);
    return c.json({ data: profile }, 201);
  });

  router.get('/profile', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const profile = store.getOrganizerProfileByUserId(user.id);
    return c.json({ data: profile });
  });

  router.patch('/profile', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(updateOrganizerSchema, await c.req.json());
    const profile = store.updateOrganizerProfile(user.id, payload, services);
    return c.json({ data: profile });
  });

  router.get('/events', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const result = store.listEvents({ requesterId: user.id, organizerId: user.id, page: 1, limit: 100 });
    return c.json(result);
  });

  router.get('/analytics', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    return c.json({ data: store.organizerAnalytics(user.id) });
  });

  router.get('/events/:id/analytics', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const analytics = store.organizerAnalytics(user.id);
    const eventAnalytics = analytics.eventsPerformance.find((entry) => entry.eventId === c.req.param('id'));
    return c.json({ data: eventAnalytics ?? null });
  });

  router.get('/events/:id/attendees', requireRole('organizer', 'admin'), (c) => {
    const user = c.get('user');
    const attendees = store.organizerAttendees(user.id, c.req.param('id'));
    return c.json({ data: attendees });
  });

  router.post('/events/:id/message', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const attendees = store.organizerAttendees(user.id, c.req.param('id'));
    return c.json({ data: { success: true, recipients: attendees.length } });
  });

  return router;
}
