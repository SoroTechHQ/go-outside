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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  const { id } = await params;
  const body = await req.json() as { status: string };
  const { status } = body;

  if (!["published", "draft", "cancelled"].includes(status)) {
    return jsonError(400, "Invalid status. Must be published, draft, or cancelled.");
  }

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    })
    .eq("id", id);

  if (error) return jsonError(500, error.message);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const user = await resolveUser(clerkId);
  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  const { id } = await params;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id, tickets_sold, title")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  if ((event.tickets_sold ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "TICKETS_SOLD",
        message: "Cannot delete an event with sold tickets. Unpublish or cancel it instead.",
      },
      { status: 400 },
    );
  }

  // Delete ticket types first (FK constraint)
  await supabaseAdmin.from("ticket_types").delete().eq("event_id", id);

  const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ success: true });
}
