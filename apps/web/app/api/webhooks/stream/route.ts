import { NextRequest, NextResponse } from "next/server";
import { getStreamServerClient } from "../../../../lib/stream";
import { supabaseAdmin } from "../../../../lib/supabase";

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
        conversation_url:      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.com"}/dashboard/messages`,
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

  const recipientIds = (event.members ?? [])
    .map((m) => m.user_id)
    .filter((id) => id !== senderId);

  if (recipientIds.length === 0) return NextResponse.json({ ok: true });

  const messagePreview =
    (event.message?.text ?? (event.message?.attachments?.length ? "Sent an image" : "")).slice(0, 80);

  for (const clerkId of recipientIds) {
    // Check Stream presence — skip if user is already active
    const { users } = await stream.queryUsers({ id: { $eq: clerkId } });
    if (users[0]?.online) continue;

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("notification_prefs")
      .eq("clerk_id", clerkId)
      .single();

    const prefs = (user?.notification_prefs ?? {}) as Record<string, unknown>;
    const messagesEmail = prefs.messages_email !== false;
    const emailDelayMins = typeof prefs.messages_email_delay_mins === "number"
      ? prefs.messages_email_delay_mins
      : 60;

    if (!messagesEmail && prefs.messages_in_app === false) continue;

    await triggerNovuNotification({
      subscriberId:  clerkId,
      senderName:    event.message?.user?.name ?? "Someone",
      senderAvatar:  event.message?.user?.image ?? null,
      messagePreview,
      channelId,
      emailDelayMins,
    });
  }

  return NextResponse.json({ ok: true });
}
