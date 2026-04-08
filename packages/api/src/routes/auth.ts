import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { clerkWebhookSchema, updateInterestsSchema, updateUserSchema } from '../validators/auth.js';
import { parseWithSchema } from '../lib/validation.js';

export function createAuthRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post('/webhook/clerk', async (c) => {
    const payload = parseWithSchema(clerkWebhookSchema, await c.req.json());
    if (payload.type === 'user.deleted') {
      const user = store.markUserDeleted(payload.data.id, services);
      return c.json({ data: { success: true, user } });
    }

    const user = store.createOrUpdateUser(
      {
        clerkId: payload.data.id,
        email: payload.data.email_addresses?.[0]?.email_address ?? `${payload.data.id}@placeholder.local`,
        firstName: payload.data.first_name || 'Unknown',
        lastName: payload.data.last_name || 'User',
        avatarUrl: payload.data.image_url ?? null,
        phone: payload.data.phone_numbers?.[0]?.phone_number ?? null
      },
      services
    );

    return c.json({ data: { success: true, user } });
  });

  router.use('/me/*', authMiddleware(store, services));
  router.use('/me', authMiddleware(store, services));

  router.get('/me', (c) => {
    const user = c.get('user');
    const organizerProfile = store.getOrganizerProfileByUserId(user.id);
    return c.json({ data: { ...user, organizerProfile } });
  });

  router.patch('/me', async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(updateUserSchema, await c.req.json());
    const updated = store.updateUser(user.id, payload, services);
    return c.json({ data: updated });
  });

  router.post('/me/interests', async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(updateInterestsSchema, await c.req.json());
    const updated = store.updateUserInterests(user.id, payload.interests, services);
    return c.json({ data: updated });
  });

  router.delete('/me', (c) => {
    const user = c.get('user');
    const deleted = store.markUserDeleted(user.clerkId, services);
    return c.json({ data: { success: true, user: deleted } });
  });

  return router;
}
