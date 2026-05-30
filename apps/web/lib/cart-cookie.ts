// Cart cookie utilities — server-side only
// Cookie name: go_cart (HTTP-only, 7-day TTL, signed via HMAC)

import { cookies } from "next/headers";
import { createHmac } from "crypto";

const CART_COOKIE = "go_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 7;
const CART_SECRET = process.env.CART_COOKIE_SECRET ?? "go-outside-cart-secret-change-in-prod";

export type CartCookieItem = {
  eventId: string;
  ticketTypeId: string;
  qty: number;
  addedAt: string;
};

type CartCookiePayload = {
  items: CartCookieItem[];
  sessionId?: string;
};

function sign(data: string): string {
  return createHmac("sha256", CART_SECRET).update(data).digest("hex").slice(0, 16);
}

function encode(payload: CartCookiePayload): string {
  const data = JSON.stringify(payload);
  const b64 = Buffer.from(data).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

function decode(value: string): CartCookiePayload | null {
  try {
    const [b64, sig] = value.split(".");
    if (!b64 || !sig) return null;
    if (sign(b64) !== sig) return null;
    return JSON.parse(Buffer.from(b64, "base64url").toString()) as CartCookiePayload;
  } catch {
    return null;
  }
}

export async function getCartCookie(): Promise<CartCookiePayload> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return { items: [] };
  return decode(raw) ?? { items: [] };
}

export async function setCartCookie(payload: CartCookiePayload): Promise<string> {
  return encode(payload);
}

export function buildCartCookieHeader(payload: CartCookiePayload): string {
  const value = encode(payload);
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${CART_MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
