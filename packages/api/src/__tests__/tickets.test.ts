import { describe, expect, it } from 'vitest';

import { createPublishedEvent, createTestContext, jsonRequest, tokenFor } from './test-helpers.js';

describe('tickets routes', () => {
  it('creates a free ticket immediately and verifies it at check-in', async () => {
    const context = createTestContext();
    const event = await createPublishedEvent(context);
    const ticketTypeId = event.ticketTypes[0].id;

    const purchaseResponse = await jsonRequest(context.app, '/tickets/purchase', {
      method: 'POST',
      token: tokenFor(context.attendee.clerkId),
      body: {
        eventId: event.id,
        ticketTypeId,
        quantity: 1
      }
    });
    const purchaseBody = await purchaseResponse.json() as {
      data: {
        status: string;
        tickets: Array<{ id: string }>;
      };
    };

    expect(purchaseResponse.status).toBe(200);
    expect(purchaseBody.data.status).toBe('confirmed');
    expect(purchaseBody.data.tickets).toHaveLength(1);

    const qrResponse = await jsonRequest(context.app, `/tickets/${purchaseBody.data.tickets[0].id}/qr`, {
      token: tokenFor(context.attendee.clerkId)
    });
    const qrBody = await qrResponse.json() as { data: { qrCode: string } };

    const verifyResponse = await jsonRequest(context.app, '/tickets/verify', {
      method: 'POST',
      token: tokenFor(context.organizer.clerkId),
      body: {
        eventId: event.id,
        qrCode: qrBody.data.qrCode
      }
    });
    const verifyBody = await verifyResponse.json() as { data: { valid: boolean } };
    expect(verifyResponse.status).toBe(200);
    expect(verifyBody.data.valid).toBe(true);

    const secondScan = await jsonRequest(context.app, '/tickets/verify', {
      method: 'POST',
      token: tokenFor(context.organizer.clerkId),
      body: {
        eventId: event.id,
        qrCode: qrBody.data.qrCode
      }
    });
    const secondBody = await secondScan.json() as { data: { valid: boolean; reason: string } };
    expect(secondScan.status).toBe(400);
    expect(secondBody.data.valid).toBe(false);
    expect(secondBody.data.reason).toBe('already_used');
  });

  it('returns payment details for paid tickets and forbids non-organizer QR verification', async () => {
    const context = createTestContext();
    const event = await createPublishedEvent(context, { paid: true });
    const ticketTypeId = event.ticketTypes[0].id;

    const response = await jsonRequest(context.app, '/tickets/purchase', {
      method: 'POST',
      token: tokenFor(context.attendee.clerkId),
      body: {
        eventId: event.id,
        ticketTypeId,
        quantity: 2
      }
    });
    const body = await response.json() as {
      data: {
        status: string;
        payment: { reference: string; authorizationUrl: string };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('payment_required');
    expect(body.data.payment.reference).toBeTruthy();
    expect(body.data.payment.authorizationUrl).toContain('https://checkout.paystack.com/');

    const verifyResponse = await jsonRequest(context.app, '/tickets/verify', {
      method: 'POST',
      token: tokenFor(context.attendee.clerkId),
      body: {
        eventId: event.id,
        qrCode: 'invalid'
      }
    });
    expect(verifyResponse.status).toBe(403);
  });
});
