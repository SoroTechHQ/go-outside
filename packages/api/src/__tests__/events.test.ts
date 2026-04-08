import { describe, expect, it } from 'vitest';

import { createTestContext, createPublishedEvent, jsonRequest, tokenFor } from './test-helpers.js';

describe('events routes', () => {
  it('creates and publishes an event as an organizer', async () => {
    const context = createTestContext();
    const event = await createPublishedEvent(context);

    const response = await jsonRequest(context.app, '/events?category=music');
    const body = await response.json() as {
      data: Array<{ id: string; status: string }>;
      pagination: { total: number };
    };

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((entry) => entry.id === event.id && entry.status === 'published')).toBe(true);
  });

  it('returns 403 when an attendee attempts to create an event', async () => {
    const context = createTestContext();
    const category = context.store.listCategories()[0];

    const response = await jsonRequest(context.app, '/events', {
      method: 'POST',
      token: tokenFor(context.attendee.clerkId),
      body: {
        title: 'Blocked Event',
        description: 'This request should fail because attendees cannot create events.',
        categoryId: category.id,
        startDatetime: '2026-07-01T18:00:00.000Z',
        endDatetime: '2026-07-01T20:00:00.000Z',
        timezone: 'Africa/Accra',
        isOnline: false,
        customLocation: 'Accra',
        ticketTypes: [
          {
            name: 'General',
            price: 0,
            priceType: 'free'
          }
        ]
      }
    });

    expect(response.status).toBe(403);
  });
});
