import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

export function createMediaRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services));

  router.post('/upload/banner', requireRole('organizer', 'admin'), (c) => {
    return c.json({ data: { key: `media/banner/${crypto.randomUUID()}.jpg`, url: 'https://cdn.gooutside.local/banner.jpg' } }, 201);
  });

  router.post('/upload/gallery', requireRole('organizer', 'admin'), (c) => {
    return c.json({ data: { key: `media/gallery/${crypto.randomUUID()}.jpg`, url: 'https://cdn.gooutside.local/gallery.jpg' } }, 201);
  });

  router.delete('/:key', requireRole('organizer', 'admin'), (c) => {
    return c.json({ data: { success: true, key: c.req.param('key') } });
  });

  return router;
}
