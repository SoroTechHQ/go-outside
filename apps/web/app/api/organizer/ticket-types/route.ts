import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveUser(clerkId: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data;
}

// POST /api/organizer/ticket-types — create a new ticket type for an event
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const eventId = body.eventId as string;
  if (!eventId) return jsonError(400, "eventId is required");

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  if (!body.name || typeof body.name !== "string") return jsonError(400, "name is required");

  const { count: existingCount } = await supabaseAdmin
    .from("ticket_types")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: ticketType, error } = await supabaseAdmin
    .from("ticket_types")
    .insert({
      event_id:       eventId,
      name:           body.name as string,
      description:    (body.description as string) || null,
      price:          Number(body.price ?? 0),
      price_type:     (body.priceType as string) || (Number(body.price ?? 0) > 0 ? "paid" : "free"),
      currency:       "GHS",
      quantity_total: body.quantityTotal != null ? Number(body.quantityTotal) : null,
      quantity_sold:  0,
      max_per_user:   body.maxPerUser != null ? Number(body.maxPerUser) : null,
      sale_starts_at: (body.saleStartsAt as string) || null,
      sale_ends_at:   (body.saleEndsAt as string) || null,
      is_active:      true,
      sort_order:     (existingCount ?? 0),
    })
    .select("*")
    .single();

  if (error) return jsonError(500, error.message);

  return NextResponse.json(ticketType, { status: 201 });
}
