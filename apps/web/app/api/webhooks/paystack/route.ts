import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const resend = new Resend(process.env.RESEND_API_KEY);

function verifySignature(payload: string, signature: string): boolean {
  const hash = createHmac("sha512", SECRET).update(payload).digest("hex");
  return hash === signature;
}

async function fulfillTickets(reference: string): Promise<void> {
  // Activate tickets
  const { data: tickets, error } = await supabaseAdmin
    .from("tickets")
    .update({ status: "active" })
    .eq("payment_reference", reference)
    .eq("status", "pending")
    .select("id, user_id, event_id, quantity");

  if (error) {
    throw new Error(`DB update failed: ${error.message}`);
  }

  if (!tickets || tickets.length === 0) return;

  const ticket = tickets[0] as { id: string; user_id: string; event_id: string; quantity: number };

  // Award Pulse Points for ticket purchase (50 PP per ticket)
  const pp = ticket.quantity * 50;
  await supabaseAdmin.rpc("award_pulse_points", {
    p_user_id: ticket.user_id,
    p_delta: pp,
    p_type: "ticket_purchase",
    p_description: `Ticket purchase (×${ticket.quantity})`,
    p_event_id: ticket.event_id,
  });

  // Send confirmation email
  const [userRow, eventRow] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("first_name, email")
      .eq("id", ticket.user_id)
      .maybeSingle()
      .then((r) => r.data as { first_name: string; email: string } | null),
    supabaseAdmin
      .from("events")
      .select("title, start_date")
      .eq("id", ticket.event_id)
      .maybeSingle()
      .then((r) => r.data as { title: string; start_date: string } | null),
  ]);

  if (userRow?.email && eventRow) {
    await resend.emails.send({
      from: "GoOutside <noreply@mail.gooutside.club>",
      to: userRow.email,
      subject: `Your ticket for ${eventRow.title} is confirmed!`,
      html: `
        <p>Hi ${userRow.first_name},</p>
        <p>Your ticket for <strong>${eventRow.title}</strong> has been confirmed.</p>
        <p>You earned <strong>${pp} Pulse Points</strong> for this purchase.</p>
        <p>View your ticket at <a href="https://gooutside.club/dashboard/tickets">dashboard/tickets</a>.</p>
      `,
    });
  }
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
