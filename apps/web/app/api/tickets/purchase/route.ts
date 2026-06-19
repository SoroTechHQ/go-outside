import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { supabaseAdmin } from "../../../../lib/supabase";
import { insertNotification } from "../../../../lib/db/insert-notification";
import { enforceSameOrigin } from "../../../../lib/api-security";
import { getResendClient } from "../../../../lib/email";

type PurchaseItem = {
  eventId: string;
  tierId: string;
  quantity: number;
  attendeeName?: string;
  attendeeEmail?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paymentNetwork?: string | null;
};

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  price: number | string;
  price_type: "free" | "paid";
  quantity_total: number | null;
  quantity_sold: number | null;
  is_active: boolean;
};

type EventRow = {
  id: string;
  title: string;
  status: string;
  is_age_restricted: boolean;
};

type PaystackVerifyResponse = {
  status: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  };
  message?: string;
};

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

async function verifyPaystackPayment(reference: string, expectedAmountPesewas: number) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Payment verification is not configured" };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, error: "Could not verify payment" };
  }

  const payload = await response.json() as PaystackVerifyResponse;
  const paid = payload.status === true &&
    payload.data?.status === "success" &&
    payload.data.reference === reference &&
    payload.data.currency === "GHS" &&
    payload.data.amount === expectedAmountPesewas;

  return paid
    ? { ok: true, error: null }
    : { ok: false, error: payload.message ?? "Payment was not successful" };
}

export async function POST(req: NextRequest) {
  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const user = await getOrCreateSupabaseUser();
  if (!user) {
    return jsonError(401, "Unauthorized");
  }

  let items: PurchaseItem[];
  try {
    items = await req.json();
  } catch {
    return jsonError(400, "Invalid body");
  }

  if (!Array.isArray(items) || items.length === 0) {
    return jsonError(400, "No items");
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    quantity: Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0,
  }));
  if (normalizedItems.some((item) => !item.eventId || !item.tierId || item.quantity < 1 || item.quantity > 10)) {
    return jsonError(400, "Invalid ticket selection");
  }

  const uniqueEventIds = [...new Set(normalizedItems.map((i) => i.eventId))];
  const uniqueTierIds = [...new Set(normalizedItems.map((i) => i.tierId))];

  const [{ data: ticketTypes, error: ticketTypesError }, { data: events, error: eventsError }] = await Promise.all([
    supabaseAdmin
      .from("ticket_types")
      .select("id, event_id, name, price, price_type, quantity_total, quantity_sold, is_active")
      .in("id", uniqueTierIds),
    supabaseAdmin
      .from("events")
      .select("id, title, status, is_age_restricted")
      .in("id", uniqueEventIds),
  ]);

  if (ticketTypesError || eventsError) {
    console.error("[tickets/purchase] validation lookup", ticketTypesError ?? eventsError);
    return jsonError(500, "Could not validate tickets");
  }

  const eventInfoMap = new Map((events as EventRow[] | null ?? []).map((event) => [event.id, event]));
  if (uniqueEventIds.some((eventId) => eventInfoMap.get(eventId)?.status !== "published")) {
    return jsonError(400, "Event is not available for purchase");
  }

  const ticketTypeMap = new Map((ticketTypes as TicketTypeRow[] | null ?? []).map((tier) => [tier.id, tier]));
  let expectedTotal = 0;
  const quantityByTier = new Map<string, number>();

  for (const item of normalizedItems) {
    const tier = ticketTypeMap.get(item.tierId);
    if (!tier || tier.event_id !== item.eventId || !tier.is_active) {
      return jsonError(400, "Ticket type is no longer available");
    }

    quantityByTier.set(item.tierId, (quantityByTier.get(item.tierId) ?? 0) + item.quantity);
    expectedTotal += Number(tier.price) * item.quantity;
  }

  for (const [tierId, requested] of quantityByTier) {
    const tier = ticketTypeMap.get(tierId)!;
    const sold = tier.quantity_sold ?? 0;
    if (tier.quantity_total != null && sold + requested > tier.quantity_total) {
      return jsonError(409, `${tier.name} does not have enough tickets left`);
    }
  }

  const restrictedEvents = Array.from(eventInfoMap.values()).filter((event) => event.is_age_restricted);
  if (restrictedEvents.length > 0) {
    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("date_of_birth")
      .eq("id", user.id)
      .maybeSingle();

    const dob = (userRecord as { date_of_birth: string | null } | null)?.date_of_birth;
    if (!dob) {
      return jsonError(403, "This event is 18+. Please add your date of birth in your profile to continue.");
    }
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      const eventTitles = restrictedEvents.map((e) => e.title).join(", ");
      return jsonError(403, `You must be 18 or older to purchase tickets for: ${eventTitles}`);
    }
  }

  const paymentReference = normalizedItems.find((item) => item.paymentReference)?.paymentReference ?? null;
  if (expectedTotal > 0) {
    if (!paymentReference) return jsonError(400, "Payment reference required");

    const { data: existingTickets } = await supabaseAdmin
      .from("tickets")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_reference", paymentReference);

    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({ ticketIds: existingTickets.map((ticket) => ticket.id) });
    }

    const verification = await verifyPaystackPayment(paymentReference, Math.round(expectedTotal * 100));
    if (!verification.ok) {
      return jsonError(402, verification.error ?? "Payment verification failed");
    }
  }

  const rows = normalizedItems.flatMap((item) => {
    const tier = ticketTypeMap.get(item.tierId)!;
    const price = Number(tier.price);
    return Array.from({ length: item.quantity }, () => ({
        event_id:          item.eventId,
        ticket_type_id:    item.tierId,
        user_id:           user.id,
        qr_code:           crypto.randomUUID(),
        qr_secret_hash:    crypto.randomUUID(),
        status:            "active",
        purchase_price:    price,
        currency:          "GHS",
        attendee_name:     item.attendeeName ?? `${user.first_name} ${user.last_name}`.trim(),
        attendee_email:    item.attendeeEmail ?? user.email,
        payment_reference: item.paymentReference ?? null,
        payment_method:    item.paymentMethod   ?? null,
        payment_network:   item.paymentNetwork  ?? null,
      }));
  });

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[tickets/purchase]", error);
    return jsonError(500, error.message);
  }

  // Write graph edge for each unique event purchased — strong signal for recommendations
  const [, eventRows] = await Promise.all([
    Promise.all(
      uniqueEventIds.map((eventId) =>
        supabaseAdmin.from("graph_edges").upsert(
          { from_id: user.id, from_type: "user", to_id: eventId, to_type: "event", edge_type: "registered", weight: 10.0, is_active: true },
          { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
        )
      )
    ),
    supabaseAdmin
      .from("events")
      .select("id, title, slug")
      .in("id", uniqueEventIds)
      .then((r) => r.data ?? []),
  ]);

  const notificationEventMap = new Map((eventRows as { id: string; title: string; slug: string }[]).map((e) => [e.id, e]));

  for (const eventId of uniqueEventIds) {
    const ev = notificationEventMap.get(eventId);
    insertNotification({
      userId: user.id,
      type: "ticket_purchase",
      title: ev ? `You're going to ${ev.title}` : "Ticket confirmed",
      body: "Your ticket has been confirmed. Tap to view.",
      data: { event_id: eventId, event_title: ev?.title ?? null },
      actionHref: "/dashboard/wallets",
    });
  }

  if (user.email) {
    const firstName = user.first_name || "there";
    const pp = rows.reduce((sum) => sum + 1, 0) * 50;
    const eventRows2 = eventRows as { id: string; title: string; slug: string }[];

    for (const eventId of uniqueEventIds) {
      const ev = eventRows2.find((e) => e.id === eventId);
      if (!ev) continue;

      const eventDetail = await supabaseAdmin
        .from("events")
        .select("start_datetime, custom_location")
        .eq("id", eventId)
        .maybeSingle()
        .then((r) => r.data as { start_datetime: string | null; custom_location: string | null } | null);

      const eventDateStr = eventDetail?.start_datetime
        ? new Date(eventDetail.start_datetime).toLocaleDateString("en-GH", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Date TBD";

      const eventItems = normalizedItems.filter((i) => i.eventId === eventId);
      const ticketTypeIds = [...new Set(eventItems.map((i) => i.tierId))];
      const { data: tierRows } = await supabaseAdmin
        .from("ticket_types")
        .select("id, name")
        .in("id", ticketTypeIds);
      const tierNameMap = new Map((tierRows ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));

      const ticketLines = eventItems
        .map((i) => {
          const tierName = tierNameMap.get(i.tierId) ?? "General";
          const price = Number(ticketTypeMap.get(i.tierId)?.price ?? 0);
          const priceStr = price === 0 ? "Free" : `GHS ${price.toFixed(2)}`;
          return `<tr>
            <td style="padding:6px 0;color:#cccccc;font-size:14px;">${tierName} x${i.quantity}</td>
            <td style="padding:6px 0;color:#cccccc;font-size:14px;text-align:right;">${priceStr}</td>
          </tr>`;
        })
        .join("");

      const total = eventItems.reduce((s, i) => s + Number(ticketTypeMap.get(i.tierId)?.price ?? 0) * i.quantity, 0);
      const totalStr = total === 0 ? "Free" : `GHS ${total.toFixed(2)}`;
      const attendeeName = eventItems[0]?.attendeeName ?? `${user.first_name} ${user.last_name}`.trim();

      getResendClient().emails.send({
        from: "GoOutside <noreply@mail.gooutside.club>",
        to: user.email,
        subject: `Your ticket for ${ev.title} is confirmed!`,
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
              Your ticket for <strong style="color:#ffffff;">${ev.title}</strong> has been confirmed. We will see you there!
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:10px;padding:20px;margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
                  <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">${ev.title}</p>
                  <p style="margin:6px 0 0;font-size:13px;color:#888888;">${eventDateStr}</p>
                  ${eventDetail?.custom_location ? `<p style="margin:4px 0 0;font-size:13px;color:#888888;">${eventDetail.custom_location}</p>` : ""}
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
      }).catch((err: unknown) => {
        console.error("[tickets/purchase] email send failed:", err);
      });
    }
  }

  return NextResponse.json({ ticketIds: data.map((r) => r.id) });
}
