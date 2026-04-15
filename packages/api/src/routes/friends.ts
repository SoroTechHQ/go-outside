import { Hono } from 'hono';
import { z } from 'zod';

import { AppServices } from '../domain.js';
import { authMiddleware, AppVariables } from '../middleware/auth.js';
import { MemoryStore } from '../store.js';
import { getInteractions } from './interactions.js';

type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

type Friendship = {
  id:          string;
  requesterId: string;
  addresseeId: string;
  status:      FriendshipStatus;
  createdAt:   string;
  updatedAt:   string;
};

// In-memory friendship store
const friendships = new Map<string, Friendship>();

function getFriendshipId(a: string, b: string) {
  return [a, b].sort().join('|');
}

function userFriends(userId: string): Friendship[] {
  return [...friendships.values()].filter(
    (f) =>
      (f.requesterId === userId || f.addresseeId === userId) &&
      f.status === 'accepted'
  );
}

function pendingForUser(userId: string): Friendship[] {
  return [...friendships.values()].filter(
    (f) => f.addresseeId === userId && f.status === 'pending'
  );
}

const RequestSchema = z.object({ user_id: z.string() });

export function createFriendsRouter(store: MemoryStore, services: AppServices) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use('*', authMiddleware(store, services));

  // GET /friends — list accepted friends
  router.get('/', (c) => {
    const user = c.get('user');
    const accepted = userFriends(user.id);

    const friends = accepted.map((f) => {
      const friendId = f.requesterId === user.id ? f.addresseeId : f.requesterId;
      const friend = store.users.get(friendId);
      return friend
        ? {
            friendship_id: f.id,
            user_id:       friend.id,
            display_name:  `${friend.firstName} ${friend.lastName}`,
            first_name:    friend.firstName,
            avatar_url:    friend.avatarUrl ?? null,
            location_city: friend.locationCity,
            since:         f.updatedAt,
          }
        : null;
    }).filter(Boolean);

    return c.json({ data: friends });
  });

  // GET /friends/requests — incoming pending requests
  router.get('/requests', (c) => {
    const user = c.get('user');
    const pending = pendingForUser(user.id);

    const requests = pending.map((f) => {
      const requester = store.users.get(f.requesterId);
      return requester
        ? {
            friendship_id: f.id,
            user_id:       requester.id,
            display_name:  `${requester.firstName} ${requester.lastName}`,
            avatar_url:    requester.avatarUrl ?? null,
            requested_at:  f.createdAt,
          }
        : null;
    }).filter(Boolean);

    return c.json({ data: requests });
  });

  // GET /friends/activity — recent friend event interactions for social feed
  router.get('/activity', (c) => {
    const user = c.get('user');
    const friendList = userFriends(user.id);
    const friendIds = new Set(
      friendList.map((f) => (f.requesterId === user.id ? f.addresseeId : f.requesterId))
    );

    const interactions = getInteractions();
    const recentActivity = interactions
      .filter((i) => friendIds.has(i.fromId) && ['save', 'registered'].includes(i.edgeType))
      .slice(-20)
      .map((i) => {
        const friend = store.users.get(i.fromId);
        const event = store.events.get(i.toId);
        return friend && event
          ? {
              user_id:      friend.id,
              display_name: friend.firstName,
              avatar_url:   friend.avatarUrl ?? null,
              action:       i.edgeType,
              event_id:     event.id,
              event_slug:   event.slug,
              event_title:  event.title,
              action_at:    i.createdAt,
            }
          : null;
      })
      .filter(Boolean);

    return c.json({ data: recentActivity });
  });

  // POST /friends/request — send friend request
  router.post('/request', async (c) => {
    const user = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) return c.json({ error: 'user_id required' }, 400);

    const targetId = parsed.data.user_id;
    if (targetId === user.id) return c.json({ error: 'Cannot add yourself' }, 400);

    const target = store.users.get(targetId);
    if (!target) return c.json({ error: 'User not found' }, 404);

    const key = getFriendshipId(user.id, targetId);
    if (friendships.has(key)) {
      return c.json({ error: 'Request already exists' }, 409);
    }

    const friendship: Friendship = {
      id:          key,
      requesterId: user.id,
      addresseeId: targetId,
      status:      'pending',
      createdAt:   services.now().toISOString(),
      updatedAt:   services.now().toISOString(),
    };

    friendships.set(key, friendship);
    return c.json({ success: true, friendship_id: key }, 201);
  });

  // POST /friends/:id/accept
  router.post('/:id/accept', (c) => {
    const user = c.get('user');
    const f = friendships.get(c.req.param('id'));

    if (!f) return c.json({ error: 'Request not found' }, 404);
    if (f.addresseeId !== user.id) return c.json({ error: 'Forbidden' }, 403);
    if (f.status !== 'pending') return c.json({ error: 'Not a pending request' }, 400);

    f.status = 'accepted';
    f.updatedAt = services.now().toISOString();
    return c.json({ success: true });
  });

  // POST /friends/:id/decline
  router.post('/:id/decline', (c) => {
    const user = c.get('user');
    const f = friendships.get(c.req.param('id'));

    if (!f) return c.json({ error: 'Request not found' }, 404);
    if (f.addresseeId !== user.id) return c.json({ error: 'Forbidden' }, 403);

    friendships.delete(c.req.param('id'));
    return c.json({ success: true });
  });

  // POST /friends/:id/block
  router.post('/:id/block', (c) => {
    const user = c.get('user');
    const f = friendships.get(c.req.param('id'));

    if (f) {
      f.status = 'blocked';
      f.updatedAt = services.now().toISOString();
    }

    return c.json({ success: true });
  });

  // DELETE /friends/:id — unfriend
  router.delete('/:id', (c) => {
    const user = c.get('user');
    const f = friendships.get(c.req.param('id'));

    if (!f) return c.json({ error: 'Not found' }, 404);
    if (f.requesterId !== user.id && f.addresseeId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    friendships.delete(c.req.param('id'));
    return c.json({ success: true });
  });

  return router;
}
