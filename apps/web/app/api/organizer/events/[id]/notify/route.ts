import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { insertNotification } from "../../../../../../lib/db/insert-notification";
import { sendEventBroadcast } from "../../../../../../lib/email";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type OrganizerRow = {
  organization_name: string | null;
};

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
    sendEmail?: boolean;
  };

  if (!body.message?.trim()) return jsonError(400, "Message body is required");

  // Fetch organizer name for email "from" context
  let organizerName = "Your event organizer";
  if (body.sendEmail) {
    const { data: profile } = await supabaseAdmin
      .from("organizer_profiles")
      .select("organization_name")
      .eq("user_id", user.id)
      .maybeSingle();
    organizerName = (profile as OrganizerRow | null)?.organization_name ?? organizerName;
  }

  // Fetch active ticket holders with email + name for email sends
  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select("user_id, users ( first_name, email )")
    .eq("event_id", id)
    .in("status", ["active", "used"]);

  type TicketWithUser = {
    user_id: string;
    users: { first_name: string | null; email: string | null } | null;
  };

  const rows = (tickets ?? []) as unknown as TicketWithUser[];

  // Deduplicate by user_id
  const seen = new Set<string>();
  const recipients: TicketWithUser[] = [];
  for (const row of rows) {
    if (!seen.has(row.user_id)) {
      seen.add(row.user_id);
      recipients.push(row);
    }
  }

  let sent = 0;
  let emailsSent = 0;

  for (const recipient of recipients) {
    // In-app notification (fire-and-forget)
    insertNotification({
      userId: recipient.user_id,
      type: "organizer_message",
      title: body.subject?.trim() || `Update about ${event.title}`,
      body: body.message.trim(),
      data: { event_id: id, event_title: event.title },
      actionHref: `/events/${event.slug}`,
    });
    sent++;

    // Email broadcast — send concurrently in the background
    if (body.sendEmail && recipient.users?.email) {
      void sendEventBroadcast({
        to:           recipient.users.email,
        firstName:    recipient.users.first_name ?? "there",
        subject:      body.subject?.trim() || `Update about ${event.title}`,
        message:      body.message.trim(),
        eventName:    event.title,
        eventSlug:    event.slug,
        organizerName,
      });
      emailsSent++;
    }
  }

  return NextResponse.json({ sent, emailsSent, failed: 0 });
}
