import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  adaptNotificationFeedItem,
  type DbNotificationFeedRow,
  type NotificationsPage,
} from "../../../lib/notification-feed";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) {
    return NextResponse.json<NotificationsPage>({ items: [], nextCursor: null, unreadCount: 0 });
  }

  const userId = sbUser.id;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? PAGE_SIZE), 50);

  let notificationsQuery = supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    notificationsQuery = notificationsQuery.lt("created_at", cursor);
  }

  const { data } = await notificationsQuery;
  const items = (data as DbNotificationFeedRow[] | null)?.map(adaptNotificationFeedItem) ?? [];
  const nextCursor = items.length === limit ? items[items.length - 1]?.timestamp ?? null : null;

  const { count: unreadCount } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return NextResponse.json<NotificationsPage>({
    items,
    nextCursor,
    unreadCount: unreadCount ?? 0,
  });
}
