"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "../../../../lib/supabase-browser";
import {
  notificationsQueryKey,
  useMarkNotificationsRead,
  useNotifications,
} from "../../../../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeleton } from "./NotificationSkeleton";

interface NotificationFeedProps {
  userId: string;
}

export function NotificationFeed({ userId }: NotificationFeedProps) {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const markNotificationsRead = useMarkNotificationsRead();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotifications();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
        }
      )
      .subscribe();

    return () => {
      void supabaseBrowser.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingRead(true);
    try {
      await markNotificationsRead.mutateAsync();
    } finally {
      setMarkingRead(false);
    }
  }, [markNotificationsRead]);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  if (isLoading) {
    return <NotificationSkeleton count={7} />;
  }

  if (isError) {
    return (
      <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Could not load notifications. Try refreshing.
        </p>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-16 text-center">
        <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
          All caught up
        </h3>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Follows, mentions, replies, and event updates will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">
            {unreadCount} unread
          </span>
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead || markNotificationsRead.isPending}
            className="text-xs font-semibold text-[var(--brand)] transition hover:opacity-70 disabled:opacity-40"
          >
            {markingRead ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {allItems.map((item, index) => (
          <NotificationItem key={item.id} item={item} index={index} />
        ))}
      </div>

      <div ref={sentinelRef} className="py-6">
        {isFetchingNextPage && <NotificationSkeleton count={3} />}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            You&apos;re all caught up
          </p>
        )}
      </div>
    </div>
  );
}
