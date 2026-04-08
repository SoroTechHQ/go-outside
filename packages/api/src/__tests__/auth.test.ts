import { describe, expect, it } from 'vitest';

import { createTestContext, jsonRequest, tokenFor } from './test-helpers.js';

describe('auth routes', () => {
  it('creates a user from the Clerk webhook and returns the user profile', async () => {
    const { app } = createTestContext();

    const webhookResponse = await jsonRequest(app, '/auth/webhook/clerk', {
      method: 'POST',
      body: {
        type: 'user.created',
        data: {
          id: 'new_clerk',
          email_addresses: [{ email_address: 'new@gooutside.test' }],
          first_name: 'New',
          last_name: 'User',
          image_url: 'https://example.com/avatar.jpg',
          phone_numbers: [{ phone_number: '+233000000000' }]
        }
      }
    });

    expect(webhookResponse.status).toBe(200);

    const meResponse = await jsonRequest(app, '/auth/me', {
      token: tokenFor('new_clerk')
    });
    const body = await meResponse.json() as { data: { email: string; firstName: string } };

    expect(meResponse.status).toBe(200);
    expect(body.data.email).toBe('new@gooutside.test');
    expect(body.data.firstName).toBe('New');
  });

  it('updates user interests and rejects requests without auth', async () => {
    const { app, attendee } = createTestContext();

    const unauthorized = await jsonRequest(app, '/auth/me');
    expect(unauthorized.status).toBe(401);

    const response = await jsonRequest(app, '/auth/me/interests', {
      method: 'POST',
      token: tokenFor(attendee.clerkId),
      body: { interests: ['music', 'tech'] }
    });
    const body = await response.json() as { data: { interests: string[] } };

    expect(response.status).toBe(200);
    expect(body.data.interests).toEqual(['music', 'tech']);
  });
});
