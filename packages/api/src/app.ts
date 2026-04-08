import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { AppServices } from './domain.js';
import { ApiError } from './lib/errors.js';
import { createDefaultServices } from './lib/services.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRouter } from './routes/auth.js';
import { createDiscoveryRouter } from './routes/discovery.js';
import { createEventsRouter } from './routes/events.js';
import { createMediaRouter } from './routes/media.js';
import { createOrganizerRouter } from './routes/organizer.js';
import { createPaymentsRouter } from './routes/payments.js';
import { createTicketsRouter } from './routes/tickets.js';
import { MemoryStore } from './store.js';

export function createApp(options?: {
  store?: MemoryStore;
  services?: Partial<AppServices>;
}) {
  const store = options?.store ?? new MemoryStore();
  const services = createDefaultServices(options?.services);

  const app = new Hono();

  app.use('*', cors());

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      const status = error.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500;
      return c.json({ error: error.message, details: error.details }, status);
    }

    return c.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      db: 'ok',
      timestamp: services.now().toISOString()
    })
  );

  app.route('/auth', createAuthRouter(store, services));
  app.route('/events', createEventsRouter(store, services));
  app.route('/tickets', createTicketsRouter(store, services));
  app.route('/payments', createPaymentsRouter(store, services));
  app.route('/organizer', createOrganizerRouter(store, services));
  app.route('/admin', createAdminRouter(store, services));
  app.route('/discovery', createDiscoveryRouter(store, services));
  app.route('/media', createMediaRouter(store, services));

  return { app, store, services };
}
