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
      event_id: item.eventId,
      ticket_type_id: item.tierId,
      user_id: user.id,
      qr_code: crypto.randomUUID(),
      qr_secret_hash: crypto.randomUUID(),
      status: "active",
      purchase_price: item.price,
      currency: "GHS",
      attendee_name: item.attendeeName ?? `${user.first_name} ${user.last_name}`.trim(),
      attendee_email: item.attendeeEmail ?? user.email,
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

  return NextResponse.json({ ticketIds: data.map((r) => r.id) });
}
