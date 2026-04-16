"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "../../../../lib/supabase-browser";
import { ActivityItem } from "./ActivityItem";
import { ActivitySkeleton } from "./ActivitySkeleton";
import type { ActivityPage, ActivityEvent } from "../../../api/activity/route";

async function fetchActivity({ pageParam }: { pageParam: string | null }): Promise<ActivityPage> {
  const url = new URL("/api/activity", window.location.origin);
  if (pageParam) url.searchParams.set("cursor", pageParam);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json() as Promise<ActivityPage>;
}

async function markAllRead() {
  await fetch("/api/activity/read-all", { method: "POST" });
}

interface ActivityFeedProps {
  userId: string;
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["activity", userId],
    queryFn:  fetchActivity,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  // ── Infinite scroll via IntersectionObserver ──────────────────────────────
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

  // ── Supabase Realtime: watch notifications for this user ──────────────────
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate so next render refetches from page 1
          void queryClient.invalidateQueries({ queryKey: ["activity", userId] });
        }
      )
      .subscribe();

    return () => {
      void supabaseBrowser.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // ── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    setMarkingRead(true);
    await markAllRead();
    await queryClient.invalidateQueries({ queryKey: ["activity", userId] });
    setMarkingRead(false);
  }, [userId, queryClient]);

  // ── Flatten pages ─────────────────────────────────────────────────────────
  const allItems: ActivityEvent[] = data?.pages.flatMap((p) => p.items) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <ActivitySkeleton count={7} />;
  }

  if (isError) {
    return (
      <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Could not load activity. Try refreshing.
        </p>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-16 text-center">
        <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
          All quiet here
        </h3>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Your activity will appear here once you start booking and saving events.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header bar ────────────────────────────────────────────────── */}
      {unreadCount > 0 && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">
            {unreadCount} unread
          </span>
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="text-xs font-semibold text-[var(--brand)] transition hover:opacity-70 disabled:opacity-40"
          >
            {markingRead ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      )}

      {/* ── Feed items ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {allItems.map((item, i) => (
          <ActivityItem key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* ── Infinite scroll sentinel ──────────────────────────────────── */}
      <div ref={sentinelRef} className="py-6">
        {isFetchingNextPage && <ActivitySkeleton count={3} />}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            You&apos;re all caught up
          </p>
        )}
      </div>
    </div>
  );
}
