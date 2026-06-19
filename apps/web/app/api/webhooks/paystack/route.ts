import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const resend = new Resend(process.env.RESEND_API_KEY);

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
      .select("title, start_datetime, custom_location")
      .eq("id", firstTicket.event_id)
      .maybeSingle()
      .then(
        (r) =>
          r.data as {
            title: string;
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

  const ticketLines = rows
    .map((t) => {
      const tierName = t.ticket_types?.name ?? "General";
      const price = t.purchase_price ?? 0;
      const priceStr = price === 0 ? "Free" : `GHS ${price.toFixed(2)}`;
      return `<tr>
        <td style="padding:6px 0;color:#cccccc;font-size:14px;">${tierName}</td>
        <td style="padding:6px 0;color:#cccccc;font-size:14px;text-align:right;">${priceStr}</td>
      </tr>`;
    })
    .join("");

  const total = rows.reduce((s, t) => s + (t.purchase_price ?? 0), 0);
  const totalStr = total === 0 ? "Free" : `GHS ${total.toFixed(2)}`;
  const attendeeName = firstTicket.attendee_name ?? firstName;

  await resend.emails.send({
    from: "GoOutside <noreply@mail.gooutside.club>",
    to: userRow.email,
    subject: `Your ticket for ${eventRow.title} is confirmed!`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr>
          <td style="background:#0e2212;border-radius:12px 12px 0 0;padding:28px 32px;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">GoOutside</p>
            <p style="margin:8px 0 0;font-size:13px;color:#4ade80;">Your ticket is confirmed</p>
          </td>
        </tr>

        <tr>
          <td style="background:#1a1a1a;padding:32px;">
            <p style="margin:0 0 24px;font-size:16px;color:#ffffff;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#cccccc;line-height:1.6;">
              Your ticket for <strong style="color:#ffffff;">${eventRow.title}</strong> has been confirmed. We will see you there!
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:10px;padding:20px;margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">${eventRow.title}</p>
                  <p style="margin:6px 0 0;font-size:13px;color:#888888;">${eventDateStr}</p>
                  ${eventRow.custom_location ? `<p style="margin:4px 0 0;font-size:13px;color:#888888;">${eventRow.custom_location}</p>` : ""}
                </td>
              </tr>
              <tr><td colspan="2" style="height:12px;"></td></tr>
              <tr>
                <td style="font-size:12px;color:#666666;padding-bottom:4px;">Ticket</td>
                <td style="font-size:12px;color:#666666;padding-bottom:4px;text-align:right;">Price</td>
              </tr>
              ${ticketLines}
              <tr>
                <td colspan="2" style="border-top:1px solid #2a2a2a;padding-top:12px;">
                  <table width="100%"><tr>
                    <td style="font-size:14px;font-weight:600;color:#ffffff;">Total</td>
                    <td style="font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${totalStr}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:8px;font-size:13px;color:#888888;">Attendee: ${attendeeName}</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="https://gooutside.club/dashboard/wallets"
                     style="display:inline-block;background:#0e2212;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                    View My Ticket
                  </a>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e2212;border-radius:10px;padding:16px 20px;">
              <tr>
                <td>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#4ade80;">+${pp} Pulse Points earned!</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#86efac;">You earned Pulse Points for this purchase. Redeem them for rewards in the app.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#0d0d0d;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#555555;">GoOutside &middot; Accra, Ghana</p>
            <p style="margin:4px 0 0;font-size:12px;color:#444444;">
              <a href="https://gooutside.club" style="color:#444444;">gooutside.club</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
