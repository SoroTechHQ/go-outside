import type { EventItem } from "@gooutside/demo-data";
import type { NotificationsPage } from "./notification-feed";

export type FeedFilters = {
  categories: string[];
  query: string;
  when: string;
};

export type SearchParamValue = string | string[] | undefined;

export type FeedEventItem = EventItem & {
  _feedIndex: number;
  _feedKey: string;
  _aiPicked?: boolean;
  _friendNames?: string[];
  _socialScore?: number;
  scarcity?: {
    state: "normal" | "low" | "critical" | "sold_out";
    label: string;
    ticketsRemaining: number | null;
  };
};

export type FeedPage = {
  items: FeedEventItem[];
  nextPage: number;
  hasMore: boolean;
  total: number;
};

export type PublicShellUser = {
  role: "attendee" | "organizer" | "admin";
  userName: string;
  avatarUrl?: string | null;
};

export type AppBootstrap = {
  shellUser: PublicShellUser;
  savedEventIds: string[];
  notifications: NotificationsPage;
};

export const DEFAULT_FEED_FILTERS: FeedFilters = {
  categories: [],
  query: "",
  when: "",
};

export const EMPTY_NOTIFICATIONS_PAGE: NotificationsPage = {
  items: [],
  nextCursor: null,
  unreadCount: 0,
};

export const DEFAULT_SHELL_USER: PublicShellUser = {
  role: "attendee",
  userName: "Kofi Mensah",
};

export const DEFAULT_APP_BOOTSTRAP: AppBootstrap = {
  shellUser: DEFAULT_SHELL_USER,
  savedEventIds: [],
  notifications: EMPTY_NOTIFICATIONS_PAGE,
};

function normalizeMultiValue(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => entry.split(","));
  }

  return typeof value === "string" ? value.split(",") : [];
}

export function normalizeFeedFilters(filters: FeedFilters): FeedFilters {
  return {
    categories: Array.from(new Set(filters.categories.map((value) => value.trim()).filter(Boolean))).sort(),
    query: filters.query.trim().toLowerCase(),
    when: filters.when.trim().toLowerCase(),
  };
}

export function feedFiltersFromSearchParams(
  searchParams: Record<string, SearchParamValue>,
): FeedFilters {
  return normalizeFeedFilters({
    categories: normalizeMultiValue(searchParams.category),
    query: typeof searchParams.q === "string" ? searchParams.q : "",
    when: typeof searchParams.when === "string" ? searchParams.when : "",
  });
}

export const appBootstrapQueryKey = ["app", "bootstrap"] as const;
export const savedEventsQueryKey = ["events", "saved"] as const;
export const notificationsQueryKey = ["notifications"] as const;

export function eventsFeedQueryKey(filters: FeedFilters) {
  return ["events", "feed", normalizeFeedFilters(filters)] as const;
}
