import { NextRequest, NextResponse } from "next/server";
import type webpush from "web-push";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendWebPush } from "../../../../lib/notifications/send-web-push";

// Vercel cron: runs every 15 minutes.
// Finds users who received a message more than `messages_email_delay_mins` minutes ago
// and haven't had a re-engagement nudge sent yet, then fires a Web Push.

const DEFAULT_DELAY_MINS = 60;
const MIN_DELAY_MINS = 15;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch users with a pending nudge that is at least MIN_DELAY_MINS old
  // (we'll filter further per-user based on their pref)
  const cutoff = new Date(Date.now() - MIN_DELAY_MINS * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabaseAdmin
    .from("users")
    .select("clerk_id, push_subscriptions, notification_prefs, unread_nudge_pending_at, unread_nudge_sent_at")
    .not("unread_nudge_pending_at", "is", null)
    .lte("unread_nudge_pending_at", cutoff)
    .limit(200);

  if (error) {
    console.error("[cron/message-digest]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let nudged = 0;

  for (const user of candidates ?? []) {
    const prefs = (user.notification_prefs ?? {}) as Record<string, unknown>;

    // Respect user pref — default 60 min
    const delayMins =
      typeof prefs.messages_email_delay_mins === "number"
        ? prefs.messages_email_delay_mins
        : DEFAULT_DELAY_MINS;

    // 0 = never send re-engagement nudge
    if (delayMins === 0) {
      await supabaseAdmin
        .from("users")
        .update({ unread_nudge_pending_at: null })
        .eq("clerk_id", user.clerk_id);
      continue;
    }

    // Push notifications must be enabled
    if (prefs.messages_push === false) {
      await supabaseAdmin
        .from("users")
        .update({ unread_nudge_pending_at: null })
        .eq("clerk_id", user.clerk_id);
      continue;
    }

    const pendingSince = new Date(user.unread_nudge_pending_at as string).getTime();
    const requiredDelay = delayMins * 60 * 1000;
    if (Date.now() - pendingSince < requiredDelay) continue;

    // Avoid sending more than once per delay window
    if (user.unread_nudge_sent_at) {
      const lastSent = new Date(user.unread_nudge_sent_at as string).getTime();
      if (Date.now() - lastSent < requiredDelay) continue;
    }

    const pushSubs = user.push_subscriptions as Record<string, webpush.PushSubscription> | null;
    if (!pushSubs || Object.keys(pushSubs).length === 0) {
      await supabaseAdmin
        .from("users")
        .update({ unread_nudge_pending_at: null })
        .eq("clerk_id", user.clerk_id);
      continue;
    }

    const now = new Date().toISOString();
    await Promise.all(
      Object.values(pushSubs).map((sub) =>
        sendWebPush(sub, {
          title: "GoOutside · Unread message",
          body: "You have an unread message waiting for you.",
          url: "/dashboard/messages",
        }).catch(() => {})
      )
    );

    await supabaseAdmin
      .from("users")
      .update({
        unread_nudge_pending_at: null,
        unread_nudge_sent_at: now,
      })
      .eq("clerk_id", user.clerk_id);

    nudged++;
  }

  return NextResponse.json({ nudged, candidates: candidates?.length ?? 0 });
}
