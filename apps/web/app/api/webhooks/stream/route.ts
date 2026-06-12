import { NextRequest, NextResponse } from "next/server";
import type webpush from "web-push";
import { getStreamServerClient } from "../../../../lib/stream";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendWebPush } from "../../../../lib/notifications/send-web-push";

type StreamWebhookEvent = {
  type: string;
  message?: {
    text?: string;
    user?: { id?: string; name?: string; image?: string };
    attachments?: unknown[];
  };
  channel_id?: string;
  members?: { user_id: string }[];
};

async function getRecipientIds(params: {
  channelId: string;
  senderId: string;
  stream: ReturnType<typeof getStreamServerClient>;
  webhookMembers?: { user_id: string }[];
}) {
  const fromWebhook = (params.webhookMembers ?? [])
    .map((member) => member.user_id)
    .filter((id) => id && id !== params.senderId);

  if (fromWebhook.length > 0) return [...new Set(fromWebhook)];

  const channels = await params.stream.queryChannels(
    { id: params.channelId, type: "messaging" } as Record<string, unknown>,
    {},
    { limit: 1, state: true },
  );

  const members = channels[0]?.state.members ?? {};
  return Object.values(members)
    .map((member) => member.user?.id ?? member.user_id)
    .filter((id): id is string => Boolean(id) && id !== params.senderId);
}

async function triggerNovuNotification(payload: {
  subscriberId: string;
  senderName: string;
  senderAvatar: string | null;
  messagePreview: string;
  channelId: string;
  emailDelayMins: number;
}) {
  const novuApiKey = process.env.NOVU_API_KEY;
  if (!novuApiKey) return;

  await fetch("https://api.novu.co/v1/events/trigger", {
    method: "POST",
    headers: {
      Authorization: `ApiKey ${novuApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "new-direct-message",
      to: { subscriberId: payload.subscriberId },
      payload: {
        sender_name:           payload.senderName,
        sender_avatar:         payload.senderAvatar,
        message_preview:       payload.messagePreview,
        channel_id:            payload.channelId,
        conversation_url:      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club"}/dashboard/messages`,
        email_delay_minutes:   payload.emailDelayMins,
      },
    }),
  }).catch((err) => {
    console.error("[stream-webhook] Novu trigger failed:", err);
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  // Verify Stream webhook signature
  const stream = getStreamServerClient();
  const isValid = stream.verifyWebhook(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: StreamWebhookEvent;
  try {
    event = JSON.parse(body) as StreamWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process new messages
  if (event.type !== "message.new") {
    return NextResponse.json({ ok: true });
  }

  const senderId = event.message?.user?.id;
  const channelId = event.channel_id;
  if (!senderId || !channelId) return NextResponse.json({ ok: true });

  const recipientIds = await getRecipientIds({
    channelId,
    senderId,
    stream,
    webhookMembers: event.members,
  });

  if (recipientIds.length === 0) return NextResponse.json({ ok: true });

  const messagePreview =
    (event.message?.text ?? (event.message?.attachments?.length ? "Sent an image" : "")).slice(0, 80);
  const senderName = event.message?.user?.name ?? "Someone";
  const senderAvatar = event.message?.user?.image ?? null;
  const conversationUrl = "/dashboard/messages";

  for (const clerkId of recipientIds) {
    const { data: recipient } = await supabaseAdmin
      .from("users")
      .select("id, notification_prefs, push_subscriptions, unread_nudge_pending_at")
      .eq("clerk_id", clerkId)
      .single();

    if (!recipient) continue;

    const prefs = (recipient.notification_prefs ?? {}) as Record<string, unknown>;
    const messagesInApp = prefs.messages_in_app !== false && prefs.in_app !== false;
    const messagesPush = prefs.messages_push !== false && prefs.push !== false;
    const messagesEmail = prefs.messages_email !== false && prefs.email !== false;
    const emailDelayMins = typeof prefs.messages_email_delay_mins === "number"
      ? prefs.messages_email_delay_mins
      : 60;

    if (messagesInApp) {
      await supabaseAdmin.from("notifications").insert({
        user_id: recipient.id,
        type: "new_message",
        title: `${senderName} sent you a message`,
        body: messagePreview || "New message",
        data: {
          action_href: conversationUrl,
          actor_avatar_url: senderAvatar,
          actor_name: senderName,
          channel_id: channelId,
        },
        is_read: false,
      });
    }

    if (!messagesEmail && !messagesPush) continue;

    // Check Stream presence — skip if user is already active
    const { users } = await stream.queryUsers({ id: { $eq: clerkId } });
    if (users[0]?.online) continue;

    if (messagesEmail) {
      await triggerNovuNotification({
        subscriberId:  clerkId,
        senderName,
        senderAvatar,
        messagePreview,
        channelId,
        emailDelayMins,
      });
    }

    // Send Web Push to all stored subscriptions for this user
    const pushSubs = recipient.push_subscriptions as Record<string, webpush.PushSubscription> | null;
    if (messagesPush && pushSubs) {
      await Promise.all(
        Object.values(pushSubs).map((sub) =>
          sendWebPush(sub, {
            title: `${senderName} · GoOutside`,
            body: messagePreview || "New message",
            url: conversationUrl,
          }).catch(() => {})
        )
      );
    }

    // Mark nudge as pending if not already set — cron will fire a re-engagement push after delay
    if ((messagesEmail || messagesPush) && !recipient.unread_nudge_pending_at) {
      await supabaseAdmin
        .from("users")
        .update({ unread_nudge_pending_at: new Date().toISOString() })
        .eq("clerk_id", clerkId);
    }
  }

  return NextResponse.json({ ok: true });
}
