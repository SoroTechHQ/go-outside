import { supabaseAdmin } from "../supabase";
import { adaptNotification, type DbNotificationRow } from "./adapters";

export async function getUserNotifications(supabaseUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) { console.error("[getUserNotifications]", error); return []; }
  return (data as DbNotificationRow[]).map(adaptNotification);
}

export async function getUnreadCount(supabaseUserId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", supabaseUserId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}
