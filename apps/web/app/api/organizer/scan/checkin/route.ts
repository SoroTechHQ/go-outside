import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: actor } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!actor) return NextResponse.json({ error: "User not found" }, { status: 401 });
  if (actor.role !== "organizer" && actor.role !== "admin") {
    return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
  }

  const { ticketId } = (await req.json()) as { ticketId?: string };
  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

  const { data: ticket, error } = await supabaseAdmin
    .from("tickets")
    .select("id, status, attendee_name, attendee_email, checked_in_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !ticket) return NextResponse.json({ result: "invalid", reason: "ticket_not_found" });
  if (ticket.status === "used") return NextResponse.json({ result: "already_used", checked_in_at: ticket.checked_in_at });
  if (ticket.status !== "active") return NextResponse.json({ result: "invalid", reason: ticket.status });

  await supabaseAdmin
    .from("tickets")
    .update({ status: "used", checked_in_at: new Date().toISOString(), checked_in_by: actor.id })
    .eq("id", ticketId);

  return NextResponse.json({ result: "valid" });
}
