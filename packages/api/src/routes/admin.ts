import { Hono } from 'hono';
import { z } from 'zod';

import { AppServices } from '../domain.js';
import { ApiError } from '../lib/errors.js';
import { parseWithSchema } from '../lib/validation.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

const updateUserSchema = z.object({
  role: z.enum(['admin', 'organizer', 'attendee']).optional(),
  isActive: z.boolean().optional()
});

const rejectOrganizerSchema = z.object({
  reason: z.string().trim().max(500).optional()
});

const resolveReportSchema = z.object({
  status: z.enum(['reviewed', 'resolved'])
});

export function createAdminRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services), requireRole('admin'));

  router.get('/dashboard', (c) => c.json({ data: store.adminDashboard() }));

  router.get('/users', (c) => c.json({ data: store.listUsers() }));

  router.patch('/users/:id', async (c) => {
    const payload = parseWithSchema(updateUserSchema, await c.req.json());
    const user = store.getUserById(c.req.param('id'));
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updated = {
      ...user,
      role: payload.role ?? user.role,
      isActive: payload.isActive ?? user.isActive,
      updatedAt: services.now().toISOString()
    };
    store.users.set(updated.id, updated);
    return c.json({ data: updated });
  });

  router.delete('/users/:id', (c) => {
    const user = store.getUserById(c.req.param('id'));
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const updated = { ...user, isActive: false, updatedAt: services.now().toISOString() };
    store.users.set(updated.id, updated);
    return c.json({ data: { success: true } });
  });

  router.get('/organizers', (c) => {
    return c.json({ data: [...store.organizerProfiles.values()] });
  });

  router.post('/organizers/:id/approve', (c) => {
    const admin = c.get('user');
    const profile = store.approveOrganizer(c.req.param('id'), admin.id, services);
    return c.json({ data: profile });
  });

  router.post('/organizers/:id/reject', async (c) => {
    const admin = c.get('user');
    const payload = parseWithSchema(rejectOrganizerSchema, await c.req.json().catch(() => ({})));
    const profile = store.rejectOrganizer(c.req.param('id'), admin.id, payload.reason ?? null, services);
    return c.json({ data: profile });
  });

  router.get('/events', (c) => {
    return c.json({ data: [...store.events.values()] });
  });

  router.post('/events/:id/feature', (c) => {
    const event = store.events.get(c.req.param('id'));
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }
    const updated = { ...event, isFeatured: !event.isFeatured, updatedAt: services.now().toISOString() };
    store.events.set(updated.id, updated);
    return c.json({ data: updated });
  });

  router.delete('/events/:id', (c) => {
    const event = store.events.get(c.req.param('id'));
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }
    store.events.delete(event.id);
    return c.json({ data: { success: true } });
  });

  router.get('/reports', (c) => c.json({ data: store.adminReports() }));

  router.patch('/reports/:id', async (c) => {
    const payload = parseWithSchema(resolveReportSchema, await c.req.json());
    const report = store.reports.get(c.req.param('id'));
    if (!report) {
      throw new ApiError(404, 'Report not found');
    }
    const updated = {
      ...report,
      status: payload.status,
      resolvedAt: services.now().toISOString()
    };
    store.reports.set(updated.id, updated);
    return c.json({ data: updated });
  });

  router.get('/payments', (c) => c.json({ data: store.adminPayments() }));

  router.post('/broadcast', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { title?: string; body?: string };
    return c.json({ data: { success: true, recipients: store.users.size, title: body.title ?? '', body: body.body ?? '' } });
  });

  router.get('/logs', (c) => c.json({ data: store.adminLogs() }));

  return router;
}
