import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

type GlobalWithRateStore = typeof globalThis & {
  __goOutsideRateStore?: Map<string, RateEntry>;
};

function getRateStore() {
  const globalState = globalThis as GlobalWithRateStore;
  globalState.__goOutsideRateStore ??= new Map<string, RateEntry>();
  return globalState.__goOutsideRateStore;
}

export function jsonNoStore<T>(body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  return NextResponse.json(body, { ...init, headers });
}

export function jsonError(status: number, message: string) {
  return jsonNoStore({ error: message }, { status });
}

export function enforceSameOrigin(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    if (origin !== expectedOrigin) {
      return jsonError(403, "Forbidden");
    }
    return null;
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return jsonError(403, "Forbidden");
      }
      return null;
    } catch {
      return jsonError(403, "Forbidden");
    }
  }

  return process.env.NODE_ENV === "production" ? jsonError(403, "Forbidden") : null;
}

export function getActorKey(request: NextRequest, userId?: string | null) {
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "anonymous";
}

export function enforceRateLimit({ bucket, key, limit, windowMs }: RateLimitOptions) {
  const store = getRateStore();
  const now = Date.now();
  const compositeKey = `${bucket}:${key}`;
  const existing = store.get(compositeKey);

  if (!existing || existing.resetAt <= now) {
    store.set(compositeKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    const response = jsonError(429, "Too many requests");
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  }

  existing.count += 1;
  store.set(compositeKey, existing);
  return null;
}
