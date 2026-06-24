import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

type Params = { params: Promise<{ id: string }> };

function jsonError(status: number, msg: string) {
  return NextResponse.json({ error: msg }, { status });
}

async function verifyOwner(clerkId: string, eventId: string) {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return null;
  if (user.role !== "organizer" && user.role !== "admin") return null;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return null;
  return user;
}

// GET /api/organizer/events/[id]/promo-codes
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("event_id", id)
    .order("created_at");

  if (error) return jsonError(500, error.message);
  return NextResponse.json({ codes: data });
}

// POST /api/organizer/events/[id]/promo-codes
export async function POST(req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");
  const { id: eventId } = await params;

  const user = await verifyOwner(clerkId, eventId);
  if (!user) return jsonError(403, "Forbidden");

  let body: {
    code?: string;
    discountType?: "percent" | "fixed";
    discountValue?: number;
    maxUses?: number | null;
    validFrom?: string | null;
    validUntil?: string | null;
    ticketTypeId?: string | null;
  };
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON"); }

  if (!body.code?.trim()) return jsonError(400, "code is required");
  if (!body.discountValue || body.discountValue <= 0) return jsonError(400, "discountValue must be > 0");

  const { data, error } = await supabaseAdmin
    .from("promo_codes")
    .insert({
      event_id:        eventId,
      ticket_type_id:  body.ticketTypeId ?? null,
      code:            body.code.trim().toUpperCase(),
      discount_type:   body.discountType ?? "percent",
      discount_value:  body.discountValue,
      max_uses:        body.maxUses ?? null,
      valid_from:      body.validFrom ?? null,
      valid_until:     body.validUntil ?? null,
      created_by:      user.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return jsonError(409, "Promo code already exists for this event");
    return jsonError(500, error.message);
  }

  return NextResponse.json({ code: data }, { status: 201 });
}

// DELETE /api/organizer/events/[id]/promo-codes?codeId=...
export async function DELETE(req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");
  const { id: eventId } = await params;

  const user = await verifyOwner(clerkId, eventId);
  if (!user) return jsonError(403, "Forbidden");

  const codeId = new URL(req.url).searchParams.get("codeId");
  if (!codeId) return jsonError(400, "codeId query param required");

  const { error } = await supabaseAdmin
    .from("promo_codes")
    .delete()
    .eq("id", codeId)
    .eq("event_id", eventId);

  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}
