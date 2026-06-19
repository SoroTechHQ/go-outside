import { supabaseAdmin } from "../supabase";

export type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionHref?: string;
};

export function insertNotification(payload: NotificationPayload): void {
  supabaseAdmin
    .from("notifications")
    .insert({
      user_id: payload.userId,
      type:    payload.type,
      title:   payload.title,
      body:    payload.body,
      data:    { ...(payload.data ?? {}), action_href: payload.actionHref ?? null },
      channel: "in_app",
      is_read: false,
    })
    .then(({ error }) => {
      if (error) {
        console.error("[insertNotification] failed:", error.message, {
          type:   payload.type,
          userId: payload.userId,
        });
        return;
      }
      // Broadcast so the client's broadcast channel listener can invalidate immediately
      // rather than waiting for the 15-second poll interval.
      void supabaseAdmin
        .channel(`notifications-broadcast:${payload.userId}`)
        .send({
          type:    "broadcast",
          event:   "new_notification",
          payload: { type: payload.type },
        });
    });
}
