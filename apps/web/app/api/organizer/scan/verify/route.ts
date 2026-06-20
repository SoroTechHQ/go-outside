import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TICKET_SECRET = process.env.TICKET_SECRET ?? "";
const MAX_TOKEN_AGE_SECONDS = 120;

function jsonResult(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type TicketRow = {
  id: string;
  status: string;
  event_id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  purchase_price: number | null;
  currency: string | null;
  checked_in_at: string | null;
  ticket_types: { name: string } | null;
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
};

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { data: actor } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!actor) return jsonError(401, "User not found");
  if (actor.role !== "organizer" && actor.role !== "admin") {
    return jsonError(403, "Organizer access required");
  }

  let body: { payload: string; eventId: string };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const { payload, eventId } = body;
  if (!payload || !eventId) {
    return jsonError(400, "payload and eventId are required");
  }

  if (payload.startsWith("gooutside-ticket:")) {
    const ticketId = payload.slice("gooutside-ticket:".length);
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .select("id, status, event_id, attendee_name, attendee_email, purchase_price, currency, checked_in_at, ticket_types ( name ), users ( first_name, last_name, avatar_url )")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return jsonResult({ result: "invalid", reason: "ticket_not_found" });
    }

    if (ticket.event_id !== eventId) {
      return jsonResult({ result: "invalid", reason: "wrong_event" });
    }

    if (ticket.status === "used") {
      return jsonResult({ result: "already_used", checked_in_at: ticket.checked_in_at });
    }

    if (ticket.status !== "active") {
      return jsonResult({ result: "invalid", reason: ticket.status });
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("tickets")
      .update({
        status: "used",
        checked_in_at: now,
        checked_in_by: actor.id,
      })
      .eq("id", ticketId);

    const row = ticket as unknown as TicketRow;
    const u = row.users;
    const firstName = u?.first_name ?? "";
    const lastName = u?.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || row.attendee_name || "Attendee";

    return jsonResult({
      result: "valid",
      attendee: {
        name: fullName,
        email: row.attendee_email,
        ticketType: row.ticket_types?.name ?? "General",
        purchasePrice: row.purchase_price ?? 0,
        currency: row.currency ?? "GHS",
        avatarUrl: u?.avatar_url ?? null,
      },
    });
  }

  let decoded: string;
  try {
    decoded = Buffer.from(payload, "base64url").toString();
  } catch {
    return jsonResult({ result: "invalid", reason: "malformed_payload" });
  }

  const parts = decoded.split(":");
  if (parts.length !== 6) {
    return jsonResult({ result: "invalid", reason: "malformed_payload" });
  }

  const [ticketId, encodedEventId, tokenVersionStr, timestampStr, nonce, sig] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  if (!TICKET_SECRET) {
    console.error("[scan/verify] TICKET_SECRET not set");
    return jsonError(500, "Server misconfiguration");
  }

  const message = `${ticketId}:${encodedEventId}:${tokenVersionStr}:${timestampStr}:${nonce}`;
  const expectedSig = createHmac("sha256", TICKET_SECRET)
    .update(message)
    .digest("hex")
    .slice(0, 32);

  let sigValid = false;
  try {
    sigValid = timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedSig, "utf8"));
  } catch {
    return jsonResult({ result: "invalid", reason: "malformed_payload" });
  }

  if (!sigValid) {
    return jsonResult({ result: "invalid", reason: "invalid_signature" });
  }

  const timestamp = parseInt(timestampStr, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || nowSeconds - timestamp > MAX_TOKEN_AGE_SECONDS) {
    return jsonResult({ result: "invalid", reason: "token_expired" });
  }

  const { data: nonceRow } = await supabaseAdmin
    .from("qr_nonces")
    .select("ticket_id, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (!nonceRow) {
    return jsonResult({ result: "invalid", reason: "nonce_not_found" });
  }

  if (nonceRow.ticket_id !== ticketId) {
    return jsonResult({ result: "invalid", reason: "nonce_mismatch" });
  }

  if (new Date(nonceRow.expires_at) <= new Date()) {
    return jsonResult({ result: "invalid", reason: "nonce_expired" });
  }

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("tickets")
    .select(`
      id,
      status,
      event_id,
      attendee_name,
      attendee_email,
      purchase_price,
      currency,
      checked_in_at,
      ticket_types ( name ),
      users ( first_name, last_name, avatar_url )
    `)
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    return jsonResult({ result: "invalid", reason: "ticket_not_found" });
  }

  const row = ticket as unknown as TicketRow;

  if (row.event_id !== eventId) {
    return jsonResult({ result: "invalid", reason: "wrong_event" });
  }

  if (row.status === "used") {
    return jsonResult({
      result: "already_used",
      checked_in_at: row.checked_in_at,
    });
  }

  if (row.status !== "active") {
    return jsonResult({ result: "invalid", reason: row.status });
  }

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("tickets")
    .update({
      status: "used",
      checked_in_at: now,
      checked_in_by: actor.id,
    })
    .eq("id", ticketId);

  await supabaseAdmin.from("qr_nonces").delete().eq("nonce", nonce);

  const u = row.users;
  const firstName = u?.first_name ?? "";
  const lastName = u?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || row.attendee_name || "Attendee";

  return jsonResult({
    result: "valid",
    attendee: {
      name: fullName,
      email: row.attendee_email,
      ticketType: row.ticket_types?.name ?? "General",
      purchasePrice: row.purchase_price ?? 0,
      currency: row.currency ?? "GHS",
      avatarUrl: u?.avatar_url ?? null,
    },
  });
}
