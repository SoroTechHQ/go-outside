import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

const DEFAULTS = {
  messages_in_app:           true,
  messages_push:             false,
  messages_email:            true,
  messages_email_delay_mins: 60,
  events_reminders:          true,
  events_friend_activity:    true,
  events_organizer_updates:  true,
  social_friend_requests:    true,
  social_mentions:           true,
};

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("users")
    .select("notification_prefs")
    .eq("clerk_id", clerk.id)
    .single();

  return NextResponse.json({ ...DEFAULTS, ...(data?.notification_prefs ?? {}) });
}

export async function PATCH(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const updates = (await req.json()) as Record<string, unknown>;

    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("notification_prefs")
      .eq("clerk_id", clerk.id)
      .single();

    const merged = { ...(existing?.notification_prefs ?? {}), ...updates };

    await supabaseAdmin
      .from("users")
      .update({ notification_prefs: merged })
      .eq("clerk_id", clerk.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/user/notification-prefs]", err);
    return NextResponse.json({ error: "Failed to update prefs" }, { status: 500 });
  }
}
