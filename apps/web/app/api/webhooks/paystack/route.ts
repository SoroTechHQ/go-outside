import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendTicketReceipt } from "../../../../lib/email";

export const dynamic = "force-dynamic";

const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

function verifySignature(payload: string, signature: string): boolean {
  if (!SECRET || !signature) return false;
  const hash = createHmac("sha512", SECRET).update(payload).digest("hex");
  return hash === signature;
}

type TicketFulfillRow = {
  id: string;
  user_id: string;
  event_id: string;
  purchase_price: number | null;
  currency: string | null;
  attendee_name: string | null;
  ticket_type_id: string | null;
  ticket_types: { name: string } | null;
};

async function fulfillTickets(reference: string): Promise<void> {
  const { data: tickets, error } = await supabaseAdmin
    .from("tickets")
    .update({ status: "active" })
    .eq("payment_reference", reference)
    .eq("status", "pending")
    .select(`
      id,
      user_id,
      event_id,
      purchase_price,
      currency,
      attendee_name,
      ticket_type_id,
      ticket_types ( name )
    `);

  if (error) {
    throw new Error(`DB update failed: ${error.message}`);
  }

  if (!tickets || tickets.length === 0) return;

  const rows = tickets as unknown as TicketFulfillRow[];
  const firstTicket = rows[0]!;

  const pp = rows.length * 50;
  await supabaseAdmin.rpc("award_pulse_points", {
    p_user_id: firstTicket.user_id,
    p_delta: pp,
    p_type: "ticket_purchase",
    p_description: `Ticket purchase (x${rows.length})`,
    p_event_id: firstTicket.event_id,
  });

  const [userRow, eventRow] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("first_name, email")
      .eq("id", firstTicket.user_id)
      .maybeSingle()
      .then((r) => r.data as { first_name: string; email: string } | null),
    supabaseAdmin
      .from("events")
      .select("title, slug, start_datetime, custom_location")
      .eq("id", firstTicket.event_id)
      .maybeSingle()
      .then(
        (r) =>
          r.data as {
            title: string;
            slug: string;
            start_datetime: string | null;
            custom_location: string | null;
          } | null
      ),
  ]);

  if (!userRow?.email || !eventRow) return;

  const firstName = userRow.first_name || "there";
  const eventDateStr = eventRow.start_datetime
    ? new Date(eventRow.start_datetime).toLocaleDateString("en-GH", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date TBD";

  const tierLines = rows.map((t) => ({
    label: t.ticket_types?.name ?? "General",
    quantity: 1,
    priceLabel: (t.purchase_price ?? 0) === 0 ? "Free" : `GHS ${(t.purchase_price ?? 0).toFixed(2)}`,
  }));
  const mapsUrl = eventRow.custom_location ? `https://maps.google.com/?q=${encodeURIComponent(eventRow.custom_location)}` : undefined;
  const qrPayload = `gooutside-ticket:${firstTicket.id}`;

  await sendTicketReceipt({
    to: userRow.email,
    firstName,
    eventName: eventRow.title,
    eventDate: eventDateStr,
    ticketId: firstTicket.id,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrPayload)}&size=320x320&color=081008&bgcolor=ffffff`,
    venue: eventRow.custom_location ?? eventRow.title,
    venueAddress: eventRow.custom_location ?? undefined,
    mapsUrl,
    eventUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club"}/dashboard/wallets/${firstTicket.id}`,
    startDatetime: eventRow.start_datetime,
    ticketLines: tierLines,
    organizer: {
      name: "GoOutside",
      websiteUrl: "https://gooutside.club",
      socialLinks: null,
    },
  });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: { reference: string; status: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const { reference } = event.data;

    // Retry up to 3 times with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await fulfillTickets(reference);
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
    }

    if (lastError) {
      console.error("[webhook/paystack] fulfillment failed after retries:", lastError.message);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
