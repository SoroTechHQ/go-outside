"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Ticket,
  BookmarkSimple,
  Users,
  UserPlus,
  ArrowRight,
  CalendarBlank,
} from "@phosphor-icons/react";
import type { SocialActivityItem } from "../../lib/social/types";
import { NaviiAvatar } from "../profile/NaviiAvatar";

type ActivityResponse = {
  items: SocialActivityItem[];
  nextCursor: string | null;
};

async function fetchPlansActivity(cursor?: string): Promise<ActivityResponse> {
  const url = new URL("/api/social/activity", window.location.origin);
  url.searchParams.set("mode", "plans");
  url.searchParams.set("limit", "20");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url.toString());
  return res.json();
}

function PlanCard({ item }: { item: SocialActivityItem }) {
  const profileHref = item.actorUsername ? `/${item.actorUsername}` : `/dashboard/user/${item.actorUserId}`;
  const relativeTime = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  const isGoing = item.verb === "registered" || item.verb === "checked_in";
  const isSaved = item.verb === "saved_event";

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden transition hover:border-[var(--border-default)]">
      {/* Event image */}
      {item.eventImageUrl && (
        <Link href={item.targetHref}>
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              src={item.eventImageUrl}
              alt={item.targetTitle ?? "Event"}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isGoing
                  ? "bg-[var(--brand)] text-black"
                  : "bg-white/20 backdrop-blur-sm text-white"
              }`}>
                {isGoing ? <Ticket size={11} weight="fill" /> : <BookmarkSimple size={11} weight="fill" />}
                {isGoing ? "Going" : "Saved"}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[13px] font-bold text-white truncate">{item.targetTitle}</p>
            </div>
          </div>
        </Link>
      )}

      <div className="p-3.5">
        {/* Actor */}
        <div className="flex items-center gap-2.5 mb-2">
          <Link href={profileHref} className="shrink-0">
            {item.actorAvatarUrl ? (
              <Image
                src={item.actorAvatarUrl}
                alt={item.actorName}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <NaviiAvatar seed={item.actorName} size={28} />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[var(--text-secondary)]">
              <Link href={profileHref} className="font-semibold text-[var(--text-primary)] hover:underline">
                {item.actorName}
              </Link>
              {" "}{isGoing ? "is going to this" : "saved this"}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{relativeTime}</p>
          </div>
        </div>

        {/* Event title when no image */}
        {!item.eventImageUrl && item.targetTitle && (
          <Link href={item.targetHref} className="block mb-2">
            <p className="text-[14px] font-semibold text-[var(--text-primary)] hover:underline">
              {item.targetTitle}
            </p>
          </Link>
        )}

        <Link
          href={item.targetHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1.5 text-[12px] font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/20 transition"
        >
          <CalendarBlank size={12} />
          View event
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CalendarBlank size={24} className="text-[var(--text-tertiary)]" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[var(--text-secondary)]">
        No plans yet
      </p>
      <p className="mt-1 text-[13px] text-[var(--text-tertiary)] max-w-xs">
        When people you follow save or buy tickets to events, you will see their plans here
      </p>
      <Link
        href="/people"
        className="mt-4 flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-bold text-black hover:opacity-90 transition"
      >
        <UserPlus size={14} />
        Follow people
      </Link>
    </div>
  );
}

export function PlansFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["plans-activity"],
    queryFn: ({ pageParam }) => fetchPlansActivity(pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (allItems.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3 py-2">
      {allItems.map((item) => (
        <PlanCard key={item.id} item={item} />
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
