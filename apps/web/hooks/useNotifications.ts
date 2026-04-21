"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationsPage } from "../lib/notification-feed";

export const notificationsQueryKey = ["notifications"] as const;

async function fetchNotifications(cursor: string | null): Promise<NotificationsPage> {
  const url = new URL("/api/notifications", window.location.origin);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  if (!res.ok) return { items: [], nextCursor: null, unreadCount: 0 };

  return res.json() as Promise<NotificationsPage>;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationsQueryKey,
    queryFn: ({ pageParam }) => fetchNotifications(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}
