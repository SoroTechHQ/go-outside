import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { parseWithSchema } from '../lib/validation.js';
import { purchaseTicketSchema, verifyQrSchema } from '../validators/tickets.js';

export function createTicketsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services));

  router.post('/purchase', requireRole('attendee', 'organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(purchaseTicketSchema, await c.req.json());
    const result = await store.purchaseTickets(user.id, payload, services);
    return c.json({ data: result });
  });

  router.get('/my', (c) => {
    const user = c.get('user');
    return c.json({ data: store.getUserTickets(user.id) });
  });

  router.get('/:id', (c) => {
    const user = c.get('user');
    const ticket = store.getTicketForRequester(c.req.param('id'), user.id);
    return c.json({ data: ticket });
  });

  router.get('/:id/qr', (c) => {
    const user = c.get('user');
    const ticket = store.getTicketForRequester(c.req.param('id'), user.id);
    if (ticket.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    return c.json({ data: { id: ticket.id, qrCode: ticket.qrCode } });
  });

  router.post('/:id/cancel', requireRole('attendee', 'organizer', 'admin'), (c) => {
    const user = c.get('user');
    const ticket = store.cancelTicket(c.req.param('id'), user.id, services);
    return c.json({ data: ticket });
  });

  router.post('/verify', requireRole('organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(verifyQrSchema, await c.req.json());
    const result = await store.verifyTicketQr(user.id, payload.eventId, payload.qrCode, services);
    return c.json({ data: result }, result.valid ? 200 : 400);
  });

  return router;
}
