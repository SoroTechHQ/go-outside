"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appBootstrapQueryKey, EMPTY_NOTIFICATIONS_PAGE, notificationsQueryKey } from "../lib/app-contracts";
import type { NotificationsPage } from "../lib/notification-feed";

export { notificationsQueryKey } from "../lib/app-contracts";

async function fetchNotifications(cursor: string | null): Promise<NotificationsPage> {
  const url = new URL("/api/bootstrap", window.location.origin);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  if (!res.ok) return EMPTY_NOTIFICATIONS_PAGE;

  const data = await res.json() as { notifications?: NotificationsPage };
  return data.notifications ?? EMPTY_NOTIFICATIONS_PAGE;
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
      void qc.invalidateQueries({ queryKey: appBootstrapQueryKey });
      void qc.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}
