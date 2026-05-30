import { NextRequest, NextResponse } from "next/server";
import {
  sendMessageNudge,
  sendTicketReceipt,
  sendEventReminder,
  sendPioneerInvite,
  sendWaitlistConfirmation,
} from "../../../lib/email";

// Internal test route — only callable with CRON_SECRET or in development.
// DELETE THIS FILE or add stronger auth before going to production.

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const secret = req.headers.get("x-test-secret");
  if (!isDev && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to } = (await req.json().catch(() => ({}))) as { to?: string };
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });

  const results: Record<string, string> = {};

  // 1. Message nudge
  try {
    await sendMessageNudge({ to, senderName: "Kofi Mensah" });
    results.nudge = "sent";
  } catch (e) { results.nudge = `error: ${(e as Error).message}`; }

  // 2. Ticket receipt (uses a real QR code generator for the test image)
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=GOOUTSIDE-TEST-001&size=180x180&color=000000&bgcolor=ffffff`;
    await sendTicketReceipt({
      to,
      firstName: "Nana",
      eventName: "Detty December · Afro Nation Ghana 2026",
      eventDate: "Sat, 28 Dec · 8:00 PM GMT",
      venue: "Accra Sports Stadium, Accra",
      ticketId: "GOOUT-TEST-001",
      qrUrl,
    });
    results.ticket = "sent";
  } catch (e) { results.ticket = `error: ${(e as Error).message}`; }

  // 3. Event reminder
  try {
    await sendEventReminder({
      to,
      firstName: "Nana",
      eventName: "Chale Wote Street Art Festival",
      eventDate: "Sat, 15 Aug · 4:00 PM GMT",
      venue: "James Town, Accra",
      slug: "chale-wote-street-art-festival-2026",
    });
    results.reminder = "sent";
  } catch (e) { results.reminder = `error: ${(e as Error).message}`; }

  // 4. Pulse Pioneers invite
  try {
    await sendPioneerInvite({ to, firstName: "Nana" });
    results.pioneer = "sent";
  } catch (e) { results.pioneer = `error: ${(e as Error).message}`; }

  // 5. Waitlist confirmation
  try {
    await sendWaitlistConfirmation({ to, firstName: "Nana", roleLabel: "event goer" });
    results.waitlist = "sent";
  } catch (e) { results.waitlist = `error: ${(e as Error).message}`; }

  const allOk = Object.values(results).every((r) => r === "sent");
  return NextResponse.json({ ok: allOk, results });
}
