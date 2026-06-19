"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellSimple } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "../../../../lib/supabase-browser";
import {
  notificationsQueryKey,
  useMarkNotificationsRead,
  useNotifications,
} from "../../../../hooks/useNotifications";
import type { NotificationFeedItem } from "../../../../lib/notification-feed";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeleton } from "./NotificationSkeleton";

interface NotificationFeedProps {
  userId: string;
}

export function NotificationFeed({ userId }: NotificationFeedProps) {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoMarkedRef = useRef(false);
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
    // Use a broadcast channel to receive server-pushed invalidation signals.
    // We avoid postgres_changes here because it requires a Supabase auth session
    // (auth.uid()) to satisfy RLS — our app uses Clerk, not Supabase auth, so
    // the anon browser client has no uid and the filter is always rejected.
    const channel = supabaseBrowser
      .channel(`notifications-broadcast:${userId}`)
      .on(
        "broadcast",
        { event: "new_notification" },
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

  // Auto-mark as read after a short delay when first loaded with unread items
  useEffect(() => {
    if (!data || unreadCount === 0 || autoMarkedRef.current) return;
    autoMarkedRef.current = true;
    const timer = setTimeout(() => {
      void markNotificationsRead.mutateAsync();
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, unreadCount, markNotificationsRead]);

  // Group items by time bucket
  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayItems: NotificationFeedItem[] = [];
  const thisWeekItems: NotificationFeedItem[] = [];
  const earlierItems: NotificationFeedItem[] = [];

  for (const item of allItems) {
    const d = new Date(item.timestamp);
    if (d.toDateString() === todayStr) {
      todayItems.push(item);
    } else if (d >= weekAgo) {
      thisWeekItems.push(item);
    } else {
      earlierItems.push(item);
    }
  }

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
      <div className="mt-8 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-dim)]">
          <BellSimple size={28} weight="duotone" className="text-[var(--brand)]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          Nothing yet
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          When someone follows you, buys a ticket, or an event you saved gets updated, it'll show up here.
        </p>
      </div>
    );
  }

  // Compute a global index offset for stagger animations across groups
  let globalIndex = 0;

  const renderGroup = (label: string, items: NotificationFeedItem[]) => {
    if (items.length === 0) return null;
    const nodes = items.map((item) => {
      const node = <NotificationItem key={item.id} item={item} index={globalIndex} />;
      globalIndex++;
      return node;
    });
    return (
      <div key={label}>
        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)] first:mt-0">
          {label}
        </p>
        <div className="space-y-3">{nodes}</div>
      </div>
    );
  };

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

      <div>
        {renderGroup("Today", todayItems)}
        {renderGroup("This week", thisWeekItems)}
        {renderGroup("Earlier", earlierItems)}
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
