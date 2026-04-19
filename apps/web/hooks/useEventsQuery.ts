"use client";

/**
 * useEventsQuery.ts — TanStack Query hooks for real Supabase events
 *
 * Feed API: GET /api/events/feed?page=N&category=X&q=Y&when=Z
 * Save  API: POST /api/events/save { eventId }
 *          : DELETE /api/events/save { eventId }
 * Saved API: GET /api/events/saved
 * Scarcity : bundled in feed response
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { EventItem } from "@gooutside/demo-data";

// ─── Types ────────────────────────────────────────────────────

export type FeedEventItem = EventItem & {
  _feedIndex: number;
  _feedKey: string;
  /** scarcity from DB scarcity_state table */
  scarcity?: {
    state: "normal" | "low" | "critical" | "sold_out";
    label: string;
    ticketsRemaining: number | null;
  };
};

type Filters = { categories: string[]; query: string; when: string };
type EventPage = {
  items: FeedEventItem[];
  nextPage: number;
  hasMore: boolean;
  total: number;
};

// ─── Feed fetcher ─────────────────────────────────────────────

async function fetchEventPage(filters: Filters, page: number): Promise<EventPage> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.categories.length > 0) params.set("category", filters.categories.join(","));
  if (filters.query) params.set("q", filters.query);
  if (filters.when) params.set("when", filters.when);

  const res = await fetch(`/api/events/feed?${params.toString()}`);
  if (!res.ok) throw new Error(`Feed API ${res.status}`);
  return res.json() as Promise<EventPage>;
}

// ─── useInfiniteEvents — main feed hook ───────────────────────

export function useInfiniteEvents(filters: Filters) {
  return useInfiniteQuery({
    queryKey: ["events", "feed", filters] as const,
    queryFn: ({ pageParam }) => fetchEventPage(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextPage : undefined),
    staleTime: 60_000,         // re-use cached data for 1 min
    refetchOnWindowFocus: false,
  });
}

// ─── useSavedEvents — what the current user saved ─────────────

async function fetchSavedEvents(): Promise<FeedEventItem[]> {
  const res = await fetch("/api/events/saved");
  if (!res.ok) return [];
  return res.json() as Promise<FeedEventItem[]>;
}

export function useSavedEvents() {
  return useQuery({
    queryKey: ["events", "saved"],
    queryFn: fetchSavedEvents,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── useSaveEvent — optimistic toggle mutation ─────────────────

export function useSaveEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, saved }: { eventId: string; saved: boolean }) => {
      const res = await fetch("/api/events/save", {
        method: saved ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json() as Promise<{ saved: boolean }>;
    },

    // Optimistic update: immediately flip the saved state in the feed cache
    onMutate: async ({ eventId, saved }) => {
      await qc.cancelQueries({ queryKey: ["events"] });

      // Snapshot current state
      const previousFeed = qc.getQueryData(["events", "feed"]);
      const previousSaved = qc.getQueryData(["events", "saved"]);

      // Optimistically update feed pages
      qc.setQueriesData(
        { queryKey: ["events", "feed"], exact: false },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const data = old as { pages: EventPage[] };
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((ev) =>
                ev.id === eventId ? { ...ev, saved } : ev
              ),
            })),
          };
        }
      );

      return { previousFeed, previousSaved };
    },

    // On error, roll back
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousFeed) qc.setQueryData(["events", "feed"], ctx.previousFeed);
      if (ctx?.previousSaved) qc.setQueryData(["events", "saved"], ctx.previousSaved);
    },

    // Always sync saved events list
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["events", "saved"] });
    },
  });
}

// ─── useFeaturedEvents — dashboard quick-load ────────────────

async function fetchFeaturedEvents(limit = 4): Promise<FeedEventItem[]> {
  const params = new URLSearchParams({ page: "0", featured: "true", limit: String(limit) });
  const res = await fetch(`/api/events/feed?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as EventPage;
  return data.items ?? [];
}

export function useFeaturedEvents(limit = 4) {
  return useQuery({
    queryKey: ["events", "featured", limit],
    queryFn: () => fetchFeaturedEvents(limit),
    staleTime: 120_000,
    retry: 1,
  });
}

// ─── useSearchEvents — debounced search ───────────────────────

export function useSearchEvents(filters: Filters, enabled = true) {
  return useQuery({
    queryKey: ["events", "search", filters],
    queryFn: () => fetchEventPage(filters, 0).then((p) => p.items),
    staleTime: 30_000,
    enabled: enabled && (filters.query.length > 1 || filters.categories.length > 0),
  });
}

// ─── useCategories — for filter chips ────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/events/feed?page=0&limit=0");
      // Categories come from DB — use the static list as fallback from demo-data
      if (!res.ok) return null;
      return null; // categories are pre-loaded in HomeClient via server component
    },
    staleTime: Infinity,
  });
}

// ─── Compatibility re-export: getFilteredEvents for HomeClient ─

export function getFilteredEvents(filters: Filters, events: FeedEventItem[]): FeedEventItem[] {
  return events.filter((e) => {
    if (filters.categories.length > 0 && !filters.categories.includes(e.categorySlug)) return false;
    if (filters.query) {
      const haystack = `${e.title} ${e.venue} ${e.city} ${e.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query)) return false;
    }
    return true;
  });
}
