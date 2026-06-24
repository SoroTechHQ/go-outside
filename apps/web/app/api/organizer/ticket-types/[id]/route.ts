import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

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

async function getTicketTypeOwner(ticketTypeId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from("ticket_types")
    .select("id, events(organizer_id)")
    .eq("id", ticketTypeId)
    .maybeSingle();

  if (!data) return null;
  const event = data.events as unknown as { organizer_id: string } | null;
  if (!event || event.organizer_id !== userId) return null;
  return data;
}

// PATCH /api/organizer/ticket-types/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");

  const { id } = await params;
  const ticket = await getTicketTypeOwner(id, user.id);
  if (!ticket) return jsonError(404, "Ticket type not found");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON"); }

  const update: Record<string, unknown> = {};
  if ("isActive" in body) update.is_active = Boolean(body.isActive);
  if ("name" in body) update.name = body.name;
  if ("description" in body) update.description = body.description ?? null;
  if ("price" in body) update.price = Number(body.price);
  if ("quantityTotal" in body) update.quantity_total = body.quantityTotal != null ? Number(body.quantityTotal) : null;
  if ("maxPerUser" in body) update.max_per_user = body.maxPerUser != null ? Number(body.maxPerUser) : null;
  if ("saleStartsAt" in body) update.sale_starts_at = body.saleStartsAt ?? null;
  if ("saleEndsAt" in body) update.sale_ends_at = body.saleEndsAt ?? null;

  const { error } = await supabaseAdmin.from("ticket_types").update(update).eq("id", id);
  if (error) return jsonError(500, error.message);

  return NextResponse.json({ success: true });
}

// DELETE /api/organizer/ticket-types/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");

  const { id } = await params;
  const ticket = await getTicketTypeOwner(id, user.id);
  if (!ticket) return jsonError(404, "Ticket type not found");

  const { error } = await supabaseAdmin.from("ticket_types").delete().eq("id", id);
  if (error) return jsonError(500, error.message);

  return NextResponse.json({ success: true });
}
