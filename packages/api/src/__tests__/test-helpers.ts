import crypto from 'node:crypto';

import { createApp } from '../app.js';
import { AppServices } from '../domain.js';
import { MemoryStore } from '../store.js';

export function createTestContext(overrides?: { services?: Partial<AppServices> }) {
  const store = new MemoryStore();
  const { app, services } = createApp({
    store,
    services: {
      qrJwtSecret: 'test-qr-secret',
      paystackWebhookSecret: 'test-paystack-secret',
      ...overrides?.services
    }
  });

  const admin = store.createOrUpdateUser(
    {
      clerkId: 'admin_clerk',
      email: 'admin@gooutside.test',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    },
    services
  );
  const organizer = store.createOrUpdateUser(
    {
      clerkId: 'organizer_clerk',
      email: 'organizer@gooutside.test',
      firstName: 'Olivia',
      lastName: 'Organizer',
      role: 'organizer'
    },
    services
  );
  const attendee = store.createOrUpdateUser(
    {
      clerkId: 'attendee_clerk',
      email: 'attendee@gooutside.test',
      firstName: 'Amina',
      lastName: 'Attendee',
      role: 'attendee'
    },
    services
  );

  return { app, store, services, admin, organizer, attendee };
}

export async function jsonRequest(
  app: ReturnType<typeof createApp>['app'],
  path: string,
  options?: {
    method?: string;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
) {
  const headers = new Headers(options?.headers);
  if (options?.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }
  if (options?.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  return app.request(path, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
  });
}

export function tokenFor(clerkId: string) {
  return `clerk_${clerkId}`;
}

export async function createPublishedEvent(context: ReturnType<typeof createTestContext>, options?: { paid?: boolean }) {
  const category = context.store.listCategories()[0];
  const createResponse = await jsonRequest(context.app, '/events', {
    method: 'POST',
    token: tokenFor(context.organizer.clerkId),
    body: {
      title: options?.paid ? 'Paid Event' : 'Free Event',
      description: 'A production-grade event used to exercise the GoOutside backend routes.',
      categoryId: category.id,
      startDatetime: '2026-06-01T18:00:00.000Z',
      endDatetime: '2026-06-01T21:00:00.000Z',
      timezone: 'Africa/Accra',
      totalCapacity: 100,
      isOnline: false,
      customLocation: 'Accra International Conference Centre',
      tags: ['music'],
      ticketTypes: [
        {
          name: options?.paid ? 'VIP' : 'General Admission',
          price: options?.paid ? 150 : 0,
          priceType: options?.paid ? 'paid' : 'free',
          quantityTotal: 100,
          maxPerUser: 4
        }
      ]
    }
  });
  const createdBody = await createResponse.json() as { data: { id: string; ticketTypes: Array<{ id: string }> } };
  await jsonRequest(context.app, `/events/${createdBody.data.id}/publish`, {
    method: 'POST',
    token: tokenFor(context.organizer.clerkId)
  });

  return createdBody.data;
}

export function signPaystackWebhook(secret: string, payload: Record<string, unknown>) {
  return crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
}
