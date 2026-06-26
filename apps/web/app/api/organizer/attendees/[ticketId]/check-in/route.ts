import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (!user) return jsonError(404, "User not found");

  const { ticketId } = await params;

  const { data: ticket } = await supabaseAdmin
    .from("tickets")
    .select("id, status, checked_in_at, event_id, events!inner ( organizer_id )")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) return jsonError(404, "Ticket not found");

  const event = ticket.events as unknown as { organizer_id: string } | null;
  if (!event || event.organizer_id !== user.id) return jsonError(403, "Forbidden");

  const nowOrNull = ticket.checked_in_at ? null : new Date().toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from("tickets")
    .update({ checked_in_at: nowOrNull })
    .eq("id", ticketId)
    .select("id, checked_in_at, status")
    .maybeSingle();

  if (error || !updated) return jsonError(500, "Failed to update check-in");

  return NextResponse.json({
    id: updated.id,
    checkedIn: updated.checked_in_at !== null,
    checkedInAt: updated.checked_in_at,
  });
}
