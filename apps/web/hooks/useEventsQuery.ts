"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { events } from "@gooutside/demo-data";
import type { EventItem } from "@gooutside/demo-data";

export type FeedEventItem = EventItem & { _feedIndex: number; _feedKey: string };

type Filters = { categories: string[]; query: string; when: string };
type EventPage = { items: FeedEventItem[]; nextPage: number; hasMore: boolean; total: number };

async function fetchEventPage(filters: Filters, page: number): Promise<EventPage> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.categories.length > 0) params.set("category", filters.categories.join(","));
  if (filters.query) params.set("q", filters.query);
  if (filters.when) params.set("when", filters.when);

  try {
    const res = await fetch(`/api/events/feed?${params.toString()}`);
    if (res.ok) return res.json() as Promise<EventPage>;
  } catch {
    // fall through to demo fallback
  }

  // Fallback to demo data if API unavailable
  const INITIAL_COUNT = 6;
  const PAGE_SIZE = 4;
  const limit = page === 0 ? INITIAL_COUNT : PAGE_SIZE;
  const startIdx = page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE;
  const items = Array.from({ length: limit }, (_, i) => {
    const feedIndex = startIdx + i;
    const event = events[feedIndex % events.length]!;
    return { ...event, _feedIndex: feedIndex, _feedKey: `${event.id}-${feedIndex}` };
  });
  return { items, nextPage: page + 1, hasMore: true, total: events.length };
}

export function useInfiniteEvents(filters: Filters) {
  return useInfiniteQuery({
    queryKey: ["events", "feed", filters] as const,
    queryFn: ({ pageParam }) => fetchEventPage(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextPage : undefined),
    staleTime: 60_000,
  });
}

export function getFilteredEvents(filters: Filters) {
  return events.filter((e) => {
    if (filters.categories.length > 0 && !filters.categories.includes(e.categorySlug)) return false;
    if (filters.query) {
      const haystack = `${e.title} ${e.venue} ${e.city} ${e.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query)) return false;
    }
    return true;
  });
}
