import crypto from 'node:crypto';

import { Hono } from 'hono';

import { AppServices } from '../domain.js';
import { ApiError } from '../lib/errors.js';
import { parseWithSchema } from '../lib/validation.js';
import { authMiddleware, AppVariables, requireRole } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { refundPaymentSchema } from '../validators/payments.js';
import { purchaseTicketSchema } from '../validators/tickets.js';

export function createPaymentsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post('/webhook/paystack', async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header('x-paystack-signature') ?? '';
    const computed = crypto.createHmac('sha512', services.paystackWebhookSecret).update(rawBody).digest('hex');
    if (signature !== computed) {
      throw new ApiError(403, 'Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string };
    };
    if (!payload.data?.reference) {
      throw new ApiError(400, 'Missing payment reference');
    }

    const payment = await store.processPaystackWebhook(
      {
        reference: payload.data.reference,
        signature,
        payload: payload as Record<string, unknown>
      },
      services
    );

    return c.json({ data: { status: 'ok', payment } });
  });

  router.use('*', authMiddleware(store, services));

  router.post('/initiate', requireRole('attendee', 'organizer', 'admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(purchaseTicketSchema, await c.req.json());
    const result = await store.purchaseTickets(user.id, payload, services);
    return c.json({ data: result });
  });

  router.get('/verify/:reference', (c) => {
    const user = c.get('user');
    const payment = store.getPaymentByReference(c.req.param('reference'));
    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }
    const event = store.events.get(payment.eventId);
    const canAccess =
      payment.userId === user.id ||
      user.role === 'admin' ||
      event?.organizerId === user.id;
    if (!canAccess) {
      throw new ApiError(403, 'Forbidden');
    }

    const tickets = store.ticketsByPaymentReference(payment.paystackReference);
    return c.json({
      data: {
        status: payment.status,
        payment,
        tickets
      }
    });
  });

  router.get('/my', (c) => {
    const user = c.get('user');
    return c.json({ data: store.listUserPayments(user.id) });
  });

  router.post('/:id/refund', requireRole('admin'), async (c) => {
    const user = c.get('user');
    const payload = parseWithSchema(refundPaymentSchema, await c.req.json().catch(() => ({})));
    const payment = [...store.payments.values()].find((entry) => entry.id === c.req.param('id'));
    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    const updated = {
      ...payment,
      status: 'refunded' as const,
      refundReason: payload.reason ?? 'Manual admin refund',
      refundedAt: services.now().toISOString(),
      updatedAt: services.now().toISOString()
    };
    store.payments.set(updated.id, updated);
    return c.json({ data: { payment: updated, refundedBy: user.id } });
  });

  return router;
}
