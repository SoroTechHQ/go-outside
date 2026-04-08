"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClockCounterClockwise, Fire, MagnifyingGlass, SlidersHorizontal } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories, events, getCategoryEmoji } from "@gooutside/demo-data";
import AnimatedSearchPlaceholder from "./AnimatedSearchPlaceholder";

const RECENT_SEARCHES = ["Afrofuture 2025", "Osu rooftop", "Jazz under the stars"];
const TRENDING_SEARCHES = ["Detty December events", "Rug Tufting Workshop", "Build Ghana Summit"];

type SearchBarProps = {
  isCompact: boolean;
  isFocused: boolean;
  isMini: boolean;
  onFocusChange: (focused: boolean) => void;
};

export function SearchBar({
  isCompact,
  isFocused,
  isMini,
  onFocusChange,
}: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onFocusChange(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onFocusChange(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onFocusChange]);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return events
      .filter((event) =>
        `${event.title} ${event.shortDescription} ${event.venue} ${event.city}`
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 5);
  }, [query]);

  const applyQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextValue = value.trim();

    if (nextValue) {
      params.set("q", nextValue);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  return (
    <div
      className={`relative mx-auto w-full ${isFocused ? "z-50" : ""}`}
      ref={containerRef}
    >
      <motion.div
        animate={{
          height: isMini ? 40 : isFocused ? 60 : isCompact ? 48 : 52,
          maxWidth: isMini ? 220 : isFocused ? 680 : isCompact ? 400 : 560,
        }}
        className={`relative flex w-full items-center rounded-full border ${
          isFocused
            ? "search-focused border-[rgba(var(--brand-rgb),0.25)] bg-white/8"
            : "border-white/8 bg-white/6 hover:border-white/12 hover:bg-white/8"
        }`}
        style={{
          boxShadow: isFocused
            ? "0 0 0 4px rgba(95,191,42,0.10), 0 8px 32px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.2)",
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <MagnifyingGlass
          className={`shrink-0 ${isFocused ? "text-[var(--brand)]" : "text-white/40"} ${
            isMini ? "ml-3" : "ml-5"
          }`}
          size={isMini ? 16 : 20}
          weight="bold"
        />

        <div className="relative mx-4 flex-1">
          <input
            ref={inputRef}
            className={`w-full bg-transparent text-white/90 outline-none caret-[var(--brand)] placeholder:text-transparent ${
              isMini ? "text-sm" : "text-base"
            }`}
            onBlur={() => {
              if (!isFocused) {
                applyQuery(query);
              }
            }}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => onFocusChange(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyQuery(query);
                onFocusChange(false);
              }
            }}
            type="text"
            value={query}
          />

          {!query && !isFocused && !isMini ? (
            <div className="pointer-events-none absolute inset-0 flex items-center">
              <AnimatedSearchPlaceholder isVisible={!query && !isFocused} />
            </div>
          ) : null}

          {!query && isMini ? (
            <span className="pointer-events-none text-sm text-white/30">Search events...</span>
          ) : null}
        </div>

        {!isMini ? (
          <button
            className="mr-3 rounded-full p-2 text-white/40 transition-colors hover:bg-white/8 hover:text-white/80"
            type="button"
          >
            <SlidersHorizontal size={16} weight="bold" />
          </button>
        ) : null}
      </motion.div>

      <AnimatePresence>
        {isFocused ? (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[-1] bg-black/60"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => onFocusChange(false)}
            />

            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card absolute left-0 right-0 top-full mt-3 max-h-[480px] overflow-y-auto p-4"
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              initial={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {query.trim() ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Matching events
                  </p>
                  {suggestions.length > 0 ? (
                    suggestions.map((event) => (
                      <button
                        key={event.id}
                        className="flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.04]"
                        onClick={() => {
                          router.push(`/events/${event.slug}`);
                          onFocusChange(false);
                        }}
                        type="button"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white/90">{event.title}</p>
                          <p className="mt-1 text-xs text-white/50">
                            {event.dateLabel} · {event.venue}
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--brand)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                          {event.city}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white/[0.03] px-3 py-4 text-sm text-white/55">
                      No close matches yet. Try a venue, organizer, or category.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Recent searches
                    </p>
                    <div className="mt-3 space-y-1">
                      {RECENT_SEARCHES.map((item) => (
                        <button
                          key={item}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/72 transition hover:bg-white/[0.04]"
                          onClick={() => {
                            setQuery(item);
                            applyQuery(item);
                            onFocusChange(false);
                          }}
                          type="button"
                        >
                          <ClockCounterClockwise size={16} className="text-white/35" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Trending in Accra
                    </p>
                    <div className="mt-3 space-y-1">
                      {TRENDING_SEARCHES.map((item) => (
                        <button
                          key={item}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/72 transition hover:bg-white/[0.04]"
                          onClick={() => {
                            setQuery(item);
                            applyQuery(item);
                            onFocusChange(false);
                          }}
                          type="button"
                        >
                          <Fire size={16} className="text-[var(--brand)]" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Categories
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.slug}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 text-sm text-white/72 transition hover:border-[var(--brand)]/30 hover:text-white"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("category", category.slug);
                            router.push(`${pathname}?${params.toString()}`, { scroll: false });
                            onFocusChange(false);
                          }}
                          type="button"
                        >
                          {getCategoryEmoji(category.slug)} {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
