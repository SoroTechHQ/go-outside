import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { supabaseAdmin } from "../../../../lib/supabase";
import { insertNotification } from "../../../../lib/db/insert-notification";
import { enforceSameOrigin } from "../../../../lib/api-security";

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

  return NextResponse.json({ ticketIds: data.map((r) => r.id) });
}
