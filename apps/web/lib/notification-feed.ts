export type NotificationAccentTone = "brand" | "gold" | "red" | "blue" | "purple";

export interface NotificationFeedItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  isRead: boolean;
  iconKey: string;
  accentTone: NotificationAccentTone;
  actionHref?: string;
  actorAvatarUrl?: string;
  actorName?: string;
}

export interface NotificationsPage {
  items: NotificationFeedItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface DbNotificationFeedRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
}

const EXACT_VISUALS: Record<string, { accentTone: NotificationAccentTone; iconKey: string }> = {
  event_cancelled:  { iconKey: "warning-circle", accentTone: "red" },
  event_reminder:   { iconKey: "bell",           accentTone: "brand" },
  event_saved:      { iconKey: "bookmark",        accentTone: "brand" },
  event_update:     { iconKey: "megaphone",       accentTone: "blue" },
  new_event:        { iconKey: "calendar-plus",   accentTone: "blue" },
  friend_going:     { iconKey: "users",           accentTone: "brand" },
  new_follower:     { iconKey: "user-plus",       accentTone: "blue" },
  post_like:        { iconKey: "heart",           accentTone: "red" },
  review_posted:    { iconKey: "sparkle",         accentTone: "purple" },
  review_reply:     { iconKey: "megaphone",       accentTone: "purple" },
  ticket_purchase:  { iconKey: "ticket",          accentTone: "gold" },
  snippet_posted:   { iconKey: "note-pencil",     accentTone: "purple" },
  snippet_liked:    { iconKey: "heart",           accentTone: "red" },
};

export function getNotificationVisuals(type: string) {
  const normalized = type.trim().toLowerCase();
  const exact = EXACT_VISUALS[normalized];

  if (exact) return exact;
  if (normalized.includes("follow"))    return { iconKey: "user-plus",       accentTone: "blue" }    as const;
  if (normalized.includes("mention"))   return { iconKey: "megaphone",       accentTone: "purple" }  as const;
  if (normalized.includes("reply") || normalized.includes("comment"))
                                         return { iconKey: "megaphone",       accentTone: "purple" }  as const;
  if (normalized.includes("ticket") || normalized.includes("purchase") || normalized.includes("booking"))
                                         return { iconKey: "ticket",          accentTone: "gold" }    as const;
  if (normalized.includes("like") || normalized.includes("heart"))
                                         return { iconKey: "heart",           accentTone: "red" }     as const;
  if (normalized.includes("save") || normalized.includes("bookmark"))
                                         return { iconKey: "bookmark",        accentTone: "brand" }   as const;
  if (normalized.includes("cancel") || normalized.includes("declin"))
                                         return { iconKey: "warning-circle",  accentTone: "red" }     as const;
  if (normalized.includes("event"))      return { iconKey: "calendar-plus",   accentTone: "blue" }    as const;
  if (normalized.includes("update") || normalized.includes("reminder") || normalized.includes("announce"))
                                         return { iconKey: "bell",            accentTone: "brand" }   as const;

  return { iconKey: "bell", accentTone: "brand" } as const;
}

export function adaptNotificationFeedItem(row: DbNotificationFeedRow): NotificationFeedItem {
  const visuals = getNotificationVisuals(row.type);
  const data = row.data ?? {};

  return {
    id:             row.id,
    type:           row.type,
    title:          row.title,
    subtitle:       row.body ?? "",
    timestamp:      row.created_at,
    isRead:         row.is_read,
    iconKey:        visuals.iconKey,
    accentTone:     visuals.accentTone,
    actionHref:     (data.action_href as string) || undefined,
    actorAvatarUrl: (data.actor_avatar_url as string) || undefined,
    actorName:      (data.actor_name as string) || undefined,
  };
}
