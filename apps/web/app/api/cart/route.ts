import { NextRequest, NextResponse } from "next/server";
import { getCartCookie, buildCartCookieHeader, type CartCookieItem } from "../../../lib/cart-cookie";
import { enforceSameOrigin } from "../../../lib/api-security";

// GET /api/cart — read cart from cookie
export async function GET() {
  const cart = await getCartCookie();
  return NextResponse.json(cart);
}

// POST /api/cart — add or update an item in the cart cookie
export async function POST(req: NextRequest) {
  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const body = await req.json().catch(() => null) as { item?: CartCookieItem; sessionId?: string } | null;
  if (!body?.item) return NextResponse.json({ error: "Missing item" }, { status: 400 });

  const cart = await getCartCookie();
  const existing = cart.items.findIndex(
    (i) => i.eventId === body.item!.eventId && i.ticketTypeId === body.item!.ticketTypeId
  );

  if (existing >= 0) {
    cart.items[existing]!.qty = body.item.qty;
    if (body.item.qty <= 0) cart.items.splice(existing, 1);
  } else if (body.item.qty > 0) {
    cart.items.push(body.item);
  }

  if (body.sessionId) cart.sessionId = body.sessionId;

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", buildCartCookieHeader(cart));
  return res;
}

// DELETE /api/cart — clear the cart
export async function DELETE(req: NextRequest) {
  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", `go_cart=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res;
}
