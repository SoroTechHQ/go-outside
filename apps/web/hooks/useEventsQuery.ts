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
import {
  DEFAULT_FEED_FILTERS,
  eventsFeedQueryKey,
  normalizeFeedFilters,
  savedEventsQueryKey,
  type FeedEventItem,
  type FeedFilters,
  type FeedPage,
} from "../lib/app-contracts";
import { appBootstrapQueryKey } from "../lib/app-contracts";

// ─── Feed fetcher ─────────────────────────────────────────────

async function fetchEventPage(filters: FeedFilters, page: number, opts?: { featuredOnly?: boolean; limit?: number }) {
  const res = await fetch("/api/feed/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: normalizeFeedFilters(filters),
      page,
      featuredOnly: opts?.featuredOnly ?? false,
      limit: opts?.limit,
    }),
  });

  if (!res.ok) throw new Error(`Feed API ${res.status}`);
  return res.json() as Promise<FeedPage>;
}

// ─── useInfiniteEvents — main feed hook ───────────────────────

export function useInfiniteEvents(filters: FeedFilters) {
  const normalizedFilters = normalizeFeedFilters(filters);

  return useInfiniteQuery({
    queryKey: eventsFeedQueryKey(normalizedFilters),
    queryFn: ({ pageParam }) => fetchEventPage(normalizedFilters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextPage : undefined),
    staleTime: 60_000,         // re-use cached data for 1 min
    refetchOnWindowFocus: false,
  });
}

// ─── useSavedEvents — what the current user saved ─────────────

async function fetchSavedEvents(): Promise<string[]> {
  const res = await fetch("/api/bootstrap", { credentials: "same-origin" });
  if (!res.ok) return [];

  const data = await res.json() as { savedEventIds?: string[] };
  return data.savedEventIds ?? [];
}

export function useSavedEvents() {
  return useQuery({
    queryKey: savedEventsQueryKey,
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
      const previousSaved = qc.getQueryData(savedEventsQueryKey);

      // Optimistically update feed pages
      qc.setQueriesData(
        { queryKey: ["events", "feed"], exact: false },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const data = old as { pages: FeedPage[] };
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

      qc.setQueryData<string[]>(savedEventsQueryKey, (old) => {
        const current = Array.isArray(old) ? old : [];
        if (saved) {
          return current.includes(eventId) ? current : [...current, eventId];
        }
        return current.filter((id) => id !== eventId);
      });

      return { previousFeed, previousSaved };
    },

    // On error, roll back
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousFeed) qc.setQueryData(["events", "feed"], ctx.previousFeed);
      if (ctx?.previousSaved) qc.setQueryData(savedEventsQueryKey, ctx.previousSaved);
    },

    // Always sync saved events list
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: savedEventsQueryKey });
      void qc.invalidateQueries({ queryKey: appBootstrapQueryKey });
    },
  });
}

// ─── useFeaturedEvents — dashboard quick-load ────────────────

async function fetchFeaturedEvents(limit = 4): Promise<FeedEventItem[]> {
  const data = await fetchEventPage(DEFAULT_FEED_FILTERS, 0, { featuredOnly: true, limit });
  if (!data) return [];
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

export function useSearchEvents(filters: FeedFilters, enabled = true) {
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
    queryFn: async () => null,
    staleTime: Infinity,
  });
}

// ─── Compatibility re-export: getFilteredEvents for HomeClient ─

export function getFilteredEvents(filters: FeedFilters, events: FeedEventItem[]): FeedEventItem[] {
  return events.filter((e) => {
    if (filters.categories.length > 0 && !filters.categories.includes(e.categorySlug)) return false;
    if (filters.query) {
      const haystack = `${e.title} ${e.venue} ${e.city} ${e.shortDescription ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.query)) return false;
    }
    return true;
  });
}
