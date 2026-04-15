"use client";

import { useEffect, useRef, useReducer, useCallback } from "react";

export interface FeedEventCard {
  id:               string;
  slug:             string;
  title:            string;
  shortDescription: string | null;
  categoryId:       string;
  startDatetime:    string;
  priceLabel:       string;
  bannerUrl:        string | null;
  tags:             string[];
  isFeatured:       boolean;
  avgRating:        number | null;
  scarcity?: {
    state:            string;
    label:            string;
    ticketsRemaining: number | null;
  };
}

interface FeedPage {
  events:      FeedEventCard[];
  next_cursor: string | null;
  total:       number;
}

interface UseInfiniteFeedOptions {
  section?:    string;
  city?:       string;
  interests?:  string[];
  /** "api" hits /api/feed, "demo" paginates demoEvents locally */
  source?:     "api" | "demo";
  demoEvents?: FeedEventCard[];
}

export interface UseInfiniteFeedResult {
  events:        FeedEventCard[];
  sentinelRef:   React.RefObject<HTMLDivElement | null>;
  isLoadingMore: boolean;
  hasMore:       boolean;
  totalLoaded:   number;
}

const PAGE_SIZE = 12;

function paginateDemoEvents(all: FeedEventCard[], cursor: string | null): FeedPage {
  const startIdx = cursor ? all.findIndex((e) => e.id === cursor) + 1 : 0;
  const page = all.slice(startIdx, startIdx + PAGE_SIZE);
  return {
    events:      page,
    next_cursor: page.length === PAGE_SIZE ? (page[page.length - 1]?.id ?? null) : null,
    total:       all.length,
  };
}

export function useInfiniteFeed({
  section = "infinite",
  city = "Accra",
  interests = [],
  source = "demo",
  demoEvents = [],
}: UseInfiniteFeedOptions): UseInfiniteFeedResult {
  // Mutable refs so callbacks always see fresh values without causing re-renders
  const eventsRef       = useRef<FeedEventCard[]>([]);
  const cursorRef       = useRef<string | null>(null);
  const hasMoreRef      = useRef(true);
  const isLoadingRef    = useRef(false);
  const sentinelRef     = useRef<HTMLDivElement | null>(null);
  const demoEventsRef   = useRef(demoEvents);
  demoEventsRef.current = demoEvents;

  // Trigger re-renders without storing derived state
  const [tick, forceUpdate] = useReducer((n: number) => n + 1, 0);
  void tick;

  const fetchNextPage = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) return;

    isLoadingRef.current = true;
    forceUpdate();

    try {
      let page: FeedPage;

      if (source === "demo") {
        await new Promise<void>((r) => setTimeout(r, 250));
        page = paginateDemoEvents(demoEventsRef.current, cursorRef.current);
      } else {
        const params = new URLSearchParams({ section, city });
        if (interests.length) params.set("interests", interests.join(","));
        if (cursorRef.current) params.set("cursor", cursorRef.current);
        const res = await fetch(`/api/feed?${params}`);
        page = (await res.json()) as FeedPage;
      }

      eventsRef.current  = [...eventsRef.current, ...page.events];
      cursorRef.current  = page.next_cursor;
      hasMoreRef.current = page.next_cursor !== null;
    } catch {
      // Never interrupt UX on network errors
    } finally {
      isLoadingRef.current = false;
      forceUpdate();
    }
  }, [section, city, source, interests]);

  // Reset + load first page when key deps change
  useEffect(() => {
    eventsRef.current  = [];
    cursorRef.current  = null;
    hasMoreRef.current = true;
    fetchNextPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, city, source]);

  // IntersectionObserver — load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  return {
    events:        eventsRef.current,
    sentinelRef,
    isLoadingMore: isLoadingRef.current,
    hasMore:       hasMoreRef.current,
    totalLoaded:   eventsRef.current.length,
  };
}
