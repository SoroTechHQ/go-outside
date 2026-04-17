"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { events } from "@gooutside/demo-data";

const INITIAL_COUNT = 6;
const PAGE_SIZE = 4;

export type EventItem = (typeof events)[number];
export type FeedEventItem = EventItem & { _feedIndex: number; _feedKey: string };

type Filters = { categories: string[]; query: string; when: string };
type EventPage = { items: FeedEventItem[]; nextPage: number; hasMore: boolean };

function applyFilters(source: typeof events, { categories, query, when }: Filters) {
  return source.filter((e) => {
    if (categories.length > 0 && !categories.includes(e.categorySlug)) return false;
    if (query && !`${e.title} ${e.venue} ${e.city} ${e.shortDescription}`.toLowerCase().includes(query)) return false;
    if (when && !`${e.dateLabel} ${e.timeLabel} ${e.eyebrow}`.toLowerCase().includes(when)) return false;
    return true;
  });
}

async function fetchEventPage(filters: Filters, page: number): Promise<EventPage> {
  const filtered = applyFilters(events, filters);
  const source = filtered.length > 0 ? filtered : events;
  const limit = page === 0 ? INITIAL_COUNT : PAGE_SIZE;
  const startIdx = page === 0 ? 0 : INITIAL_COUNT + (page - 1) * PAGE_SIZE;

  const items = Array.from({ length: limit }, (_, i) => {
    const feedIndex = startIdx + i;
    const event = source[feedIndex % source.length]!;
    return { ...event, _feedIndex: feedIndex, _feedKey: `${event.id}-${feedIndex}` };
  });

  return { items, nextPage: page + 1, hasMore: true };
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
  return applyFilters(events, filters);
}
