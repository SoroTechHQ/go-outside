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
  void supabaseAdmin.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: { ...(payload.data ?? {}), action_href: payload.actionHref ?? null },
    is_read: false,
  });
}
