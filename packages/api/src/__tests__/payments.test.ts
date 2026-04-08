import { describe, expect, it } from 'vitest';

import { createPublishedEvent, createTestContext, jsonRequest, signPaystackWebhook, tokenFor } from './test-helpers.js';

describe('payments routes', () => {
  it('rejects invalid paystack webhook signatures', async () => {
    const context = createTestContext();
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'missing',
        amount: 1000,
        currency: 'GHS',
        status: 'success'
      }
    };

    const response = await context.app.request('/payments/webhook/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'invalid'
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(403);
  });

  it('processes a successful webhook once and remains idempotent on retry', async () => {
    const context = createTestContext();
    const event = await createPublishedEvent(context, { paid: true });
    const ticketTypeId = event.ticketTypes[0].id;

    const purchaseResponse = await jsonRequest(context.app, '/tickets/purchase', {
      method: 'POST',
      token: tokenFor(context.attendee.clerkId),
      body: {
        eventId: event.id,
        ticketTypeId,
        quantity: 2
      }
    });
    const purchaseBody = await purchaseResponse.json() as {
      data: {
        payment: { reference: string };
      };
    };

    const payload = {
      event: 'charge.success',
      data: {
        reference: purchaseBody.data.payment.reference,
        amount: 30000,
        currency: 'GHS',
        status: 'success',
        paid_at: '2026-05-01T10:00:00.000Z',
        channel: 'card'
      }
    };
    const signature = signPaystackWebhook(context.services.paystackWebhookSecret, payload);

    const firstResponse = await context.app.request('/payments/webhook/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature
      },
      body: JSON.stringify(payload)
    });
    expect(firstResponse.status).toBe(200);
    expect(context.store.ticketsByPaymentReference(purchaseBody.data.payment.reference)).toHaveLength(2);

    const secondResponse = await context.app.request('/payments/webhook/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature
      },
      body: JSON.stringify(payload)
    });
    expect(secondResponse.status).toBe(200);
    expect(context.store.ticketsByPaymentReference(purchaseBody.data.payment.reference)).toHaveLength(2);

    const verifyResponse = await jsonRequest(context.app, `/payments/verify/${purchaseBody.data.payment.reference}`, {
      token: tokenFor(context.attendee.clerkId)
    });
    const verifyBody = await verifyResponse.json() as {
      data: {
        status: string;
        tickets: unknown[];
      };
    };

    expect(verifyResponse.status).toBe(200);
    expect(verifyBody.data.status).toBe('success');
    expect(verifyBody.data.tickets).toHaveLength(2);
  });
});
