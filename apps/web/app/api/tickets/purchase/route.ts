import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { supabaseAdmin } from "../../../../lib/supabase";

type PurchaseItem = {
  eventId: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
  attendeeName?: string;
  attendeeEmail?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paymentNetwork?: string | null;
};

export async function POST(req: NextRequest) {
  const user = await getOrCreateSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let items: PurchaseItem[];
  try {
    items = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const rows = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      event_id:          item.eventId,
      ticket_type_id:    item.tierId,
      user_id:           user.id,
      qr_code:           crypto.randomUUID(),
      qr_secret_hash:    crypto.randomUUID(),
      status:            item.price === 0 ? "active" : "pending",
      purchase_price:    item.price,
      currency:          "GHS",
      attendee_name:     item.attendeeName ?? `${user.first_name} ${user.last_name}`.trim(),
      attendee_email:    item.attendeeEmail ?? user.email,
      payment_reference: item.paymentReference ?? null,
      payment_method:    item.paymentMethod   ?? null,
      payment_network:   item.paymentNetwork  ?? null,
    }))
  );

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[tickets/purchase]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Write graph edge for each unique event purchased — strong signal for recommendations
  const uniqueEventIds = [...new Set(items.map((i) => i.eventId))];
  await Promise.all(
    uniqueEventIds.map((eventId) =>
      supabaseAdmin.from("graph_edges").upsert(
        { from_id: user.id, from_type: "user", to_id: eventId, to_type: "event", edge_type: "registered", weight: 10.0, is_active: true },
        { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
      )
    )
  );

  return NextResponse.json({ ticketIds: data.map((r) => r.id) });
}
