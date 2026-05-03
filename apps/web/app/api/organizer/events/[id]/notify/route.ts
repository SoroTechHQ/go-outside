import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { insertNotification } from "../../../../../../lib/db/insert-notification";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");
  if (user.role !== "organizer" && user.role !== "admin") return jsonError(403, "Organizer required");

  const { id } = await params;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, organizer_id, title, slug")
    .eq("id", id)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return jsonError(404, "Event not found");

  const body = await req.json() as {
    subject?: string;
    message: string;
    channels?: string[];
  };

  if (!body.message?.trim()) return jsonError(400, "Message body is required");

  // Fetch active ticket holders
  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select("user_id")
    .eq("event_id", id)
    .in("status", ["active", "used"]);

  const recipientIds = [...new Set((tickets ?? []).map((t: { user_id: string }) => t.user_id))];

  let sent = 0;
  for (const userId of recipientIds) {
    insertNotification({
      userId,
      type: "organizer_message",
      title: body.subject?.trim() || `Update about ${event.title}`,
      body: body.message.trim(),
      data: { event_id: id, event_title: event.title },
      actionHref: `/events/${event.slug}`,
    });
    sent++;
  }

  return NextResponse.json({ sent, failed: 0 });
}
