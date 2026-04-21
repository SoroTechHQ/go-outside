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

  const isSmallState = isCompact || isMini;
  const showCenteredCollapsedPlaceholder = isSmallState && !query && !isFocused;
  const showExpandedBlankState = isFocused && !query;
  const shellBackground = isFocused
    ? "bg-[color:rgba(var(--bg-card-rgb),0.95)]"
    : isSmallState
      ? "bg-[color:rgba(var(--bg-card-rgb),0.82)]"
      : "bg-[var(--bg-muted)]";
  const shellBorder = isFocused
    ? "border-[rgba(var(--brand-rgb),0.25)]"
    : isSmallState
      ? "border-[rgba(var(--brand-rgb),0.14)]"
      : "border-[var(--border-subtle)]";
  const shellHover = isSmallState
    ? "hover:border-[rgba(var(--brand-rgb),0.22)] hover:bg-[color:rgba(var(--bg-card-rgb),0.88)]"
    : "hover:border-[var(--border-default)] hover:bg-[var(--bg-card-alt)]";

  return (
    <div
      className={`relative mx-auto w-full ${isFocused ? "z-50" : ""}`}
      ref={containerRef}
    >
      <div
        className={`relative mx-auto flex w-full items-center rounded-full border backdrop-blur-xl transition-[background-color,border-color,box-shadow,max-width,height] duration-300 ease-out ${shellBackground} ${shellBorder} ${shellHover} ${
          isFocused ? "search-focused" : ""
        }`}
        style={{
          height: isFocused ? 64 : isMini ? 50 : 58,
          maxWidth: isFocused ? 820 : isMini ? 340 : isCompact ? 680 : 760,
          boxShadow: isFocused
            ? "0 0 0 3px rgba(var(--brand-rgb),0.10), 0 8px 24px rgba(0,0,0,0.20)"
            : "0 4px 16px rgba(0,0,0,0.16)",
        }}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-full transition-all ${
            isMini ? "ml-4 h-9 w-9" : "ml-4 h-9 w-9"
          } ${
            isFocused || isSmallState
              ? "bg-[rgba(var(--brand-rgb),0.12)] text-[var(--brand)]"
              : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
          }`}
        >
          <MagnifyingGlass size={isMini ? 16 : 18} weight="bold" />
        </div>

        <div className="relative mx-4 flex-1">
          <input
            ref={inputRef}
            className={`w-full bg-transparent text-[var(--text-primary)] outline-none caret-[var(--brand)] placeholder:text-transparent ${
              isMini ? "text-sm" : "text-[15px]"
            } ${showCenteredCollapsedPlaceholder ? "opacity-0" : ""}`}
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
            placeholder=""
            type="text"
            value={query}
          />

          {!query && !isFocused && !isMini ? (
            <div className="pointer-events-none absolute inset-0 flex items-center">
              <AnimatedSearchPlaceholder isVisible={!query && !isFocused} />
            </div>
          ) : null}

          {showCenteredCollapsedPlaceholder ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 pr-12">
              <span className="truncate text-center text-[15px] font-medium text-[var(--text-tertiary)]">
                Search events...
              </span>
            </div>
          ) : null}

          {showExpandedBlankState ? (
            <div className="pointer-events-none absolute inset-0 bg-transparent" />
          ) : null}

          {!query && isMini && !showCenteredCollapsedPlaceholder ? (
            <span className="pointer-events-none text-sm text-[var(--text-tertiary)]">Search events...</span>
          ) : null}
        </div>

        {!isMini ? (
          <button
            className="mr-3 rounded-full p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            type="button"
          >
            <SlidersHorizontal size={16} weight="bold" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {isFocused ? (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[-1] bg-black/45"
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
                        className="flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--bg-muted)]"
                        onClick={() => {
                          router.push(`/events/${event.slug}`);
                          onFocusChange(false);
                        }}
                        type="button"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{event.title}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            {event.dateLabel} · {event.venue}
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--brand)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                          {event.city}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[var(--bg-muted)] px-3 py-4 text-sm text-[var(--text-secondary)]">
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
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                          onClick={() => {
                            setQuery(item);
                            applyQuery(item);
                            onFocusChange(false);
                          }}
                          type="button"
                        >
                          <ClockCounterClockwise size={16} className="text-[var(--text-tertiary)]" />
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
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
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
                          className="rounded-full border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.72)] px-3.5 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
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
