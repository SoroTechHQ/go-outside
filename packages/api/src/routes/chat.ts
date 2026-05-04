import { createClerkClient } from '@clerk/backend';
import { Hono } from 'hono';
import { StreamChat } from 'stream-chat';

import { ApiError } from '../lib/errors.js';

type ChatTokenPayload = {
  image?: string | null;
  name?: string | null;
};

const SUPPORT_USER_ID = 'gooutside-concierge';
const SUPPORT_USER_NAME = 'GoOutside Concierge';
const WELCOME_CHANNEL_PREFIX = 'welcome';

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ApiError(503, `${name} is not configured`);
  }

  return value;
}

function getOptionalListEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return undefined;

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

async function authenticateUser(request: Request) {
  const clerk = createClerkClient({
    publishableKey: getRequiredEnv('CLERK_PUBLISHABLE_KEY'),
    secretKey: getRequiredEnv('CLERK_SECRET_KEY')
  });

  const state = await clerk.authenticateRequest(request, {
    authorizedParties: getOptionalListEnv('CLERK_AUTHORIZED_PARTIES'),
    jwtKey: process.env.CLERK_JWT_KEY
  });

  if (!state.isAuthenticated) {
    throw new ApiError(401, state.message ?? 'Unauthorized');
  }

  const auth = state.toAuth();
  if (!auth.userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  return auth.userId;
}

function createStreamClient() {
  return StreamChat.getInstance(
    getRequiredEnv('STREAM_API_KEY'),
    getRequiredEnv('STREAM_API_SECRET')
  );
}

async function ensureStarterChannel(client: StreamChat, userId: string) {
  await client.upsertUsers([
    { id: SUPPORT_USER_ID, name: SUPPORT_USER_NAME }
  ]);

  const channel = client.channel('messaging', `${WELCOME_CHANNEL_PREFIX}-${userId}`, {
    created_by_id: SUPPORT_USER_ID,
    members: [SUPPORT_USER_ID, userId]
  });

  await channel.create().catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  });

  return channel.cid;
}

export function createChatRouter() {
  const router = new Hono();

  router.post('/token', async (c) => {
    const userId = await authenticateUser(c.req.raw);
    const payload = (await c.req.json().catch(() => ({}))) as ChatTokenPayload;

    const streamClient = createStreamClient();
    const name = payload.name?.trim() || 'GoOutside User';
    const image = payload.image?.trim() || undefined;

    await streamClient.upsertUsers([
      {
        id: userId,
        image,
        name,
      }
    ]);

    const starterChannelCid = await ensureStarterChannel(streamClient, userId);
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
    const token = streamClient.createToken(userId, expiry);

    return c.json({
      starterChannelCid,
      token,
      user: {
        id: userId,
        image: image ?? null,
        name
      }
    });
  });

  return router;
}
