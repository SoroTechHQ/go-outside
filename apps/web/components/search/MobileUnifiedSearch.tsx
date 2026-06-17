"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClockCounterClockwise,
  Fire,
  MagnifyingGlass,
  Sparkle,
  Ticket,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryIcon } from "../../lib/category-icons";
import { aiSearchHref } from "../../lib/search/ai-search-href";

const categories = [
  { slug: "music",      name: "Music"      },
  { slug: "food-drink", name: "Food & Drink"},
  { slug: "arts",       name: "Arts"       },
  { slug: "tech",       name: "Tech"       },
  { slug: "sports",     name: "Sports"     },
  { slug: "networking", name: "Networking" },
  { slug: "nightlife",  name: "Nightlife"  },
  { slug: "wellness",   name: "Wellness"   },
];

type Suggestion = {
  id: string;
  title: string;
  slug: string;
  type: "event" | "user";
  subtitle?: string;
};

type MobileUnifiedSearchProps = {
  className?: string;
  emptyLabel?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
};

const RECENT_SEARCHES   = ["Afrofuture 2025", "Osu rooftop", "Jazz under the stars"];
const TRENDING_SEARCHES = ["Detty December events", "Rug Tufting Workshop", "Build Ghana Summit"];

const AI_QUICK_PROMPTS = [
  "Something free and chill tonight",
  "Live music in Osu this weekend",
  "Best networking event this week",
  "Date night with good drinks",
];

export function MobileUnifiedSearch({
  className = "",
  emptyLabel = "Search events or trends…",
  subtitle = "Accra · Events, organizers, topics",
  searchPlaceholder = "Search events, organizers, topics…",
  value = "",
  onSearch,
}: MobileUnifiedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Live typeahead using /api/search ────────────────────────────────────────
  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    abortRef.current?.abort();

    if (!q.trim()) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    suggestDebounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=all&limit=6`,
          { signal: abortRef.current.signal },
        );
        if (res.ok) {
          const data = await res.json() as {
            events: { id: string; title: string; slug: string }[];
            users: { clerk_id: string; first_name: string | null; last_name: string | null; username: string | null }[];
          };
          const eventSuggestions: Suggestion[] = (data.events ?? []).map((e) => ({
            id: e.id, title: e.title, slug: e.slug, type: "event" as const,
          }));
          const userSuggestions: Suggestion[] = (data.users ?? []).slice(0, 2).map((u) => ({
            id: u.clerk_id,
            title: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "User",
            slug: u.username ? `/go/${u.username}` : `/dashboard/user/${u.clerk_id}`,
            type: "user" as const,
            subtitle: u.username ? `@${u.username}` : undefined,
          }));
          setSuggestions([...eventSuggestions, ...userSuggestions].slice(0, 7));
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 200);
  }, []);

  const visibleLabel = value.trim() || emptyLabel;

  const runSearch = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed); else params.delete("q");
      const href = params.toString() ? `/search?${params.toString()}` : "/search";
      router.push(href);
    }
    setQuery(trimmed);
    setOpen(false);
    setSuggestions([]);
  };

  const runCategorySearch = (slug: string) => {
    router.push(`/search?categories=${slug}`);
    setOpen(false);
    setSuggestions([]);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    fetchSuggestions(q);
  };

  const closePanel = () => {
    setOpen(false);
    setSuggestions([]);
  };

  const normalizedQuery = query.trim().toLowerCase();

  return (
    <>
      <div
        className={`flex w-full items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] ${className}`.trim()}
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setOpen(true)}
          type="button"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white">
            <MagnifyingGlass size={15} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              {visibleLabel}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{subtitle}</p>
          </div>
        </button>

        {/* AI button — routes directly to /ai (no inline overlay) */}
        <button
          aria-label="Open AI search"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--brand)] transition active:scale-95"
          onClick={() => router.push(aiSearchHref("What's happening in Accra this weekend?"))}
          type="button"
        >
          <Sparkle size={13} weight="fill" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={closePanel}
            />

            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="fixed inset-x-0 top-0 z-[61] overflow-hidden rounded-b-[28px] bg-[var(--bg-card)] shadow-[0_8px_48px_rgba(0,0,0,0.28)]"
              exit={{ y: -20, opacity: 0 }}
              initial={{ y: -20, opacity: 0 }}
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                  <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] caret-[var(--brand)]"
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch(query);
                    if (e.key === "Escape") closePanel();
                  }}
                  placeholder={searchPlaceholder}
                  value={query}
                />
                {query ? (
                  <button
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition active:scale-95"
                    onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
                    type="button"
                  >
                    <X size={14} weight="bold" />
                  </button>
                ) : (
                  <button
                    className="text-sm font-semibold text-[var(--text-secondary)] transition active:scale-95"
                    onClick={closePanel}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="h-px bg-[var(--border-subtle)]" />

              <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
                {normalizedQuery ? (
                  <div>
                    {/* Live suggestions */}
                    {suggestionsLoading && (
                      <div className="flex items-center gap-2 py-2 text-[12px] text-[var(--text-tertiary)]">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand)]/30 border-t-[var(--brand)]" />
                        Searching…
                      </div>
                    )}

                    {suggestions.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                          Quick results
                        </p>
                        <div className="space-y-1">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted)]"
                              onClick={() => {
                                if (s.type === "user") router.push(s.slug);
                                else router.push(`/events/${s.slug}`);
                                closePanel();
                              }}
                              type="button"
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.type === "event" ? "bg-[#f0fae6] text-[#5FBF2A]" : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"}`}>
                                {s.type === "event" ? <Ticket size={14} weight="duotone" /> : <UserCircle size={14} weight="duotone" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{s.title}</p>
                                {s.subtitle && <p className="text-xs text-[var(--text-tertiary)]">{s.subtitle}</p>}
                              </div>
                              <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                                {s.type === "event" ? "Event" : "Person"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search all + Ask AI CTAs */}
                    <div className="space-y-1.5">
                      <button
                        className="flex w-full items-center gap-3 rounded-2xl bg-[var(--bg-muted)] px-4 py-3.5 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)]"
                        onClick={() => runSearch(query)}
                        type="button"
                      >
                        <MagnifyingGlass size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                        Search for &ldquo;{query.trim()}&rdquo;
                      </button>

                      <button
                        className="flex w-full items-center gap-3 rounded-2xl border border-[#5FBF2A]/30 bg-[#f0fae6] px-4 py-3.5 text-left text-sm font-medium text-[#1a5c0a] transition hover:bg-[#e6f7d9]"
                        onClick={() => { router.push(aiSearchHref(query.trim())); closePanel(); }}
                        type="button"
                      >
                        <Sparkle size={15} className="shrink-0 text-[#5FBF2A]" weight="fill" />
                        Ask AI about &ldquo;{query.trim()}&rdquo;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Recent searches */}
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Recent</p>
                      <div className="space-y-0.5">
                        {RECENT_SEARCHES.map((item) => (
                          <button
                            key={item}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
                            onClick={() => runSearch(item)}
                            type="button"
                          >
                            <ClockCounterClockwise size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trending */}
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Trending</p>
                      <div className="space-y-0.5">
                        {TRENDING_SEARCHES.map((item) => (
                          <button
                            key={item}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
                            onClick={() => runSearch(item)}
                            type="button"
                          >
                            <Fire size={16} className="shrink-0 text-[var(--brand)]" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI quick prompts */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Ask AI</p>
                        <Sparkle size={10} weight="fill" className="text-[#5FBF2A]" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AI_QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            className="rounded-full border border-[#5FBF2A]/30 bg-[#f0fae6] px-3 py-1.5 text-[12px] font-medium text-[#1a5c0a] transition active:scale-95"
                            onClick={() => { router.push(aiSearchHref(prompt)); closePanel(); }}
                            type="button"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category browse */}
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Browse</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.slug}
                            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3.5 py-2 text-sm text-[var(--text-secondary)] transition active:scale-95"
                            onClick={() => runCategorySearch(cat.slug)}
                            type="button"
                          >
                            <CategoryIcon slug={cat.slug} size={12} weight="bold" className="inline-block mr-1" />
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileUnifiedSearch;
