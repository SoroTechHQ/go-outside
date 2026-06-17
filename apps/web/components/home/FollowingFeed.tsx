"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  Users,
  UserPlus,
  ArrowRight,
  ChatCircleDots,
} from "@phosphor-icons/react";
import type { SocialActivityItem } from "../../lib/social/types";
import { NaviiAvatar } from "../profile/NaviiAvatar";

type ActivityResponse = {
  items: SocialActivityItem[];
  nextCursor: string | null;
};

async function fetchFollowingActivity(cursor?: string): Promise<ActivityResponse> {
  const url = new URL("/api/social/activity", window.location.origin);
  url.searchParams.set("mode", "following");
  url.searchParams.set("limit", "20");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url.toString());
  return res.json();
}

function ActivityCard({ item }: { item: SocialActivityItem }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (item.verb !== "posted") return;
      await fetch(`/api/posts/${item.targetId}/like`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following-activity"] });
    },
  });

  const profileHref = item.actorUsername ? `/${item.actorUsername}` : `/dashboard/user/${item.actorUserId}`;
  const relativeTime = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  function verbLabel() {
    switch (item.verb) {
      case "posted":       return "posted";
      case "saved_event":  return "saved";
      case "registered":   return "is going to";
      case "checked_in":   return "checked in at";
      case "followed":     return "followed";
      case "reviewed":     return "reviewed";
      case "liked":        return "liked";
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]">
      {/* Actor row */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={profileHref} className="shrink-0">
          {item.actorAvatarUrl ? (
            <Image
              src={item.actorAvatarUrl}
              alt={item.actorName}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <NaviiAvatar seed={item.actorName} size={36} />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[var(--text-secondary)]">
            <Link href={profileHref} className="font-semibold text-[var(--text-primary)] hover:underline">
              {item.actorName}
            </Link>
            {" "}{verbLabel()}{" "}
            {item.targetType === "event" && item.targetTitle && (
              <Link href={item.targetHref} className="font-semibold text-[var(--brand)] hover:underline">
                {item.targetTitle}
              </Link>
            )}
            {item.targetType === "user" && item.targetTitle && (
              <Link href={item.targetHref} className="font-semibold text-[var(--text-primary)] hover:underline">
                {item.targetTitle}
              </Link>
            )}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{relativeTime}</p>
        </div>
      </div>

      {/* Post body */}
      {item.verb === "posted" && item.targetTitle && (
        <p className="text-[14px] text-[var(--text-primary)] leading-relaxed mb-3">
          {item.targetTitle}
        </p>
      )}

      {/* Event thumbnail */}
      {item.eventImageUrl && (item.verb === "saved_event" || item.verb === "registered") && (
        <Link href={item.targetHref}>
          <div className="relative h-32 w-full overflow-hidden rounded-xl mb-3">
            <Image
              src={item.eventImageUrl}
              alt={item.targetTitle ?? "Event"}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <p className="text-[12px] font-semibold text-white truncate">{item.targetTitle}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Actions for posts */}
      {item.verb === "posted" && (
        <div className="flex items-center gap-4 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-red-500 transition"
          >
            <Heart size={15} />
            Like
          </button>
          <Link
            href={item.targetHref}
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--brand)] transition"
          >
            <ChatCircleDots size={15} />
            View post
          </Link>
        </div>
      )}

      {/* CTA for events */}
      {(item.verb === "saved_event" || item.verb === "registered") && (
        <Link
          href={item.targetHref}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand)] hover:underline"
        >
          View event <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Users size={24} className="text-[var(--text-tertiary)]" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[var(--text-secondary)]">
        Nothing here yet
      </p>
      <p className="mt-1 text-[13px] text-[var(--text-tertiary)] max-w-xs">
        Follow people to see their posts, saved events, and activity here
      </p>
      <Link
        href="/people"
        className="mt-4 flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-bold text-black hover:opacity-90 transition"
      >
        <UserPlus size={14} />
        Find people to follow
      </Link>
    </div>
  );
}

export function FollowingFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["following-activity"],
    queryFn: ({ pageParam }) => fetchFollowingActivity(pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (allItems.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3 py-2">
      {allItems.map((item) => (
        <ActivityCard key={item.id} item={item} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-2.5 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {isFetchingNextPage ? "Loading..." : <>Load more <ArrowRight size={14} /></>}
          </button>
        </div>
      )}
    </div>
  );
}
