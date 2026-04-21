"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ClockCounterClockwise,
  Fire,
  MagnifyingGlass,
  PaperPlaneTilt,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories, events, getCategoryEmoji } from "@gooutside/demo-data";
import { thumbnailUrl } from "../../lib/image-url";

type PickEvent = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
  start_datetime: string;
} | null;

type AssistantPick = {
  event_id: string;
  title: string;
  reason: string;
  event: PickEvent;
};

type WeekendResponse = {
  intro: string;
  picks: AssistantPick[];
};

type MobileUnifiedSearchProps = {
  className?: string;
  emptyLabel?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
};

type PanelMode = "search" | "ai";

const RECENT_SEARCHES = ["Afrofuture 2025", "Osu rooftop", "Jazz under the stars"];
const TRENDING_SEARCHES = ["Detty December events", "Rug Tufting Workshop", "Build Ghana Summit"];
const QUICK_PROMPTS = [
  "Something free and chill tonight",
  "I want live music",
  "Fun with friends on Saturday",
  "Trending events this weekend",
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
  const aiInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("search");
  const [query, setQuery] = useState(value);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<WeekendResponse | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      if (panelMode === "search") {
        inputRef.current?.focus();
      } else {
        aiInputRef.current?.focus();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [open, panelMode]);

  const visibleLabel = value.trim() || emptyLabel;
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = normalizedQuery
    ? events
        .filter((event) =>
          `${event.title} ${event.shortDescription} ${event.venue} ${event.city}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
        .slice(0, 6)
    : [];

  const runSearch = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const href = params.toString() ? `/search?${params.toString()}` : "/search";
      router.push(href);
    }
    setQuery(trimmed);
    setOpen(false);
    setPanelMode("search");
  };

  const runCategorySearch = (slug: string) => {
    router.push(`/search?categories=${slug}`);
    setOpen(false);
    setPanelMode("search");
  };

  const askAssistant = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/weekend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as WeekendResponse;
      setAiResult(data);
    } catch {
      setAiResult({
        intro: "I couldn't pull AI picks right now. Try another prompt in a moment.",
        picks: [],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const closePanel = () => {
    setOpen(false);
    setPanelMode("search");
  };

  return (
    <>
      <div
        className={`flex w-full items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] ${className}`.trim()}
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => {
            setPanelMode("search");
            setOpen(true);
          }}
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

        <button
          aria-label="Open AI search"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--brand)] transition active:scale-95"
          onClick={() => {
            setPanelMode("ai");
            setOpen(true);
          }}
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
              <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                <button
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    panelMode === "search"
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  }`}
                  onClick={() => setPanelMode("search")}
                  type="button"
                >
                  Search
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    panelMode === "ai"
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  }`}
                  onClick={() => setPanelMode("ai")}
                  type="button"
                >
                  <Sparkle size={14} weight="fill" />
                  AI Search
                </button>
              </div>

              {panelMode === "search" ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                      <MagnifyingGlass size={18} weight="bold" />
                    </div>
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] caret-[var(--brand)]"
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          runSearch(query);
                        }
                        if (event.key === "Escape") {
                          closePanel();
                        }
                      }}
                      placeholder={searchPlaceholder}
                      value={query}
                    />
                    {query ? (
                      <button
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition active:scale-95"
                        onClick={() => setQuery("")}
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
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                          Matching events
                        </p>
                        {suggestions.length > 0 ? (
                          <div className="space-y-1">
                            {suggestions.map((event) => (
                              <button
                                key={event.id}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted)]"
                                onClick={() => {
                                  router.push(`/events/${event.slug}`);
                                  closePanel();
                                }}
                                type="button"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
                                  <MagnifyingGlass size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                    {event.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                                    {event.dateLabel} · {event.venue}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-[var(--brand-dim)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand)]">
                                  {event.city}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            className="w-full rounded-2xl bg-[var(--bg-muted)] px-4 py-4 text-left text-sm text-[var(--text-secondary)]"
                            onClick={() => runSearch(query)}
                            type="button"
                          >
                            Search for “{query.trim()}”
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                            Recent
                          </p>
                          <div className="space-y-0.5">
                            {RECENT_SEARCHES.map((item) => (
                              <button
                                key={item}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted)]"
                                onClick={() => runSearch(item)}
                                type="button"
                              >
                                <ClockCounterClockwise size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                            Trending
                          </p>
                          <div className="space-y-0.5">
                            {TRENDING_SEARCHES.map((item) => (
                              <button
                                key={item}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted)]"
                                onClick={() => runSearch(item)}
                                type="button"
                              >
                                <Fire size={16} className="shrink-0 text-[var(--brand)]" />
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                            Browse
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <button
                                key={category.slug}
                                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3.5 py-2 text-sm text-[var(--text-secondary)] transition active:scale-95"
                                onClick={() => runCategorySearch(category.slug)}
                                type="button"
                              >
                                {getCategoryEmoji(category.slug)} {category.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-4">
                    <div className="mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                          <Sparkle size={16} weight="fill" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Ask for the vibe, not just keywords
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                            Try prompts like “something chill tonight” or “best trending event for a group”.
                          </p>
                        </div>
                      </div>
                    </div>

                    {!aiResult && !aiLoading ? (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition active:scale-95"
                            onClick={() => {
                              setAiQuery(prompt);
                              void askAssistant(prompt);
                            }}
                            type="button"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void askAssistant(aiQuery);
                      }}
                    >
                      <input
                        ref={aiInputRef}
                        className="flex-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-3 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onChange={(event) => setAiQuery(event.target.value)}
                        placeholder="Find me the best trending event tonight…"
                        value={aiQuery}
                      />
                      <button
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_4px_12px_rgba(47,143,69,0.28)] transition active:scale-95 disabled:opacity-50 disabled:shadow-none"
                        disabled={!aiQuery.trim() || aiLoading}
                        type="submit"
                      >
                        <PaperPlaneTilt size={16} weight="fill" />
                      </button>
                    </form>
                  </div>

                  <div className="h-px bg-[var(--border-subtle)]" />

                  <div className="max-h-[65vh] overflow-y-auto px-4 py-4">
                    {aiLoading ? (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-muted)] px-4 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          Finding a strong match for you…
                        </span>
                      </div>
                    ) : aiResult ? (
                      <div className="space-y-3">
                        <p className="text-sm text-[var(--text-secondary)]">{aiResult.intro}</p>

                        {aiResult.picks.length === 0 ? (
                          <p className="rounded-2xl bg-[var(--bg-muted)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                            No AI picks came back yet. Try a more specific vibe or date.
                          </p>
                        ) : (
                          aiResult.picks.map((pick) => (
                            <button
                              key={pick.event_id}
                              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3 text-left transition hover:border-[var(--brand)]/30 hover:bg-[var(--bg-card-hover)]"
                              onClick={() => {
                                if (pick.event?.slug) {
                                  router.push(`/events/${pick.event.slug}`);
                                  closePanel();
                                }
                              }}
                              type="button"
                            >
                              {pick.event?.banner_url ? (
                                <img
                                  alt={pick.title}
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                                  src={thumbnailUrl(pick.event.banner_url) ?? pick.event.banner_url}
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-dim)] text-[var(--brand)]">
                                  <Sparkle size={18} weight="fill" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                                  {pick.title}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-secondary)]">
                                  {pick.reason}
                                </p>
                              </div>
                              <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                            </button>
                          ))
                        )}

                        <button
                          className="text-[12px] font-semibold text-[var(--brand)]"
                          onClick={() => {
                            setAiResult(null);
                            aiInputRef.current?.focus();
                          }}
                          type="button"
                        >
                          Ask something else
                        </button>
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-[var(--bg-muted)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                        Tap a prompt or ask for the kind of event you want.
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileUnifiedSearch;
