import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';

export function createDiscoveryRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get('/feed', (c) => {
    const result = store.listEvents({ requesterId: null, page: 1, limit: 20 });
    return c.json(result);
  });

  router.get('/nearby', (c) => {
    const city = c.req.query('city') ?? 'Accra';
    const result = store.listEvents({ requesterId: null, page: 1, limit: 20, city });
    return c.json(result);
  });

  router.get('/trending', (c) => {
    const result = store.listEvents({ requesterId: null, page: 1, limit: 20, trendingOnly: true });
    return c.json(result);
  });

  router.get('/categories', (c) => {
    return c.json({ data: store.listCategories() });
  });

  router.use('/recommended', authMiddleware(store, services));
  router.get('/recommended', (c) => {
    const user = c.get('user');
    const categorySlugs = new Set(user.interests);
    const categories = [...store.categories.values()].filter((category) => categorySlugs.has(category.slug));
    const categoryIds = new Set(categories.map((category) => category.id));
    const allEvents = store.listEvents({ requesterId: user.id, page: 1, limit: 100 }).data;
    const recommended = allEvents.filter((event) => categoryIds.has(event.categoryId));
    return c.json({ data: recommended.slice(0, 20) });
  });

  return router;
}
