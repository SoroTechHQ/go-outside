import { createMiddleware } from 'hono/factory';

import { AppServices, User, UserRole } from '../domain.js';
import { ApiError } from '../lib/errors.js';
import { MemoryStore } from '../store.js';

export type AppVariables = {
  user: User;
};

export function authMiddleware(store: MemoryStore, services: AppServices) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const authorization = c.req.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized');
    }

    const token = authorization.slice('Bearer '.length);
    let subject;
    try {
      subject = await services.auth.verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'Invalid token');
    }
    const user = store.getUserByClerkId(subject.sub);

    if (!user || !user.isActive) {
      throw new ApiError(403, 'User not found or suspended');
    }

    c.set('user', user);
    await next();
  });
}

export function requireRole(...roles: UserRole[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      throw new ApiError(403, 'Forbidden');
    }

    await next();
  });
}
