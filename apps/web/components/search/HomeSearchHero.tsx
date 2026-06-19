"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarBlank,
  ClockCounterClockwise,
  Fire,
  MagnifyingGlass,
  Sparkle,
  Ticket,
  X,
} from "@phosphor-icons/react";
import { CategoryIcon } from "../../lib/category-icons";

const categories = [
  { slug: "music",      name: "Music" },
  { slug: "food-drink", name: "Food & Drink" },
  { slug: "arts",       name: "Arts" },
  { slug: "tech",       name: "Tech" },
  { slug: "sports",     name: "Sports" },
  { slug: "networking", name: "Networking" },
  { slug: "nightlife",  name: "Nightlife" },
  { slug: "wellness",   name: "Wellness" },
];
import type { EventItem } from "@gooutside/demo-data";
const events: EventItem[] = [];
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MobileUnifiedSearch from "./MobileUnifiedSearch";
import { SearchPillExpanded } from "./SearchPillExpanded";

type HomeSearchHeroMode = "expanded" | "compact" | "mini" | "mobile";
type ActiveSegment = "what" | "when" | "lucky" | null;

type HomeSearchHeroProps = {
  mode: HomeSearchHeroMode;
  className?: string;
  compactProgress?: number;
  miniProgress?: number;
};

const RECENT_SEARCHES = ["Afrofuture 2025", "Osu rooftop", "Jazz under the stars"];
const TRENDING_SEARCHES = ["Detty December events", "Rug Tufting Workshop", "Build Ghana Summit"];

// ── Mobile full-screen search overlay ────────────────────────────────────────
function MobileSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQuery("");
    }
  }, [open]);

  const suggestions = query.trim()
    ? events
        .filter((e) =>
          `${e.title} ${e.shortDescription} ${e.venue} ${e.city}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const applyQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(url, { scroll: false });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="fixed inset-x-0 top-0 z-[61] flex flex-col overflow-hidden rounded-b-[28px] bg-[var(--bg-card)] shadow-[0_8px_48px_rgba(0,0,0,0.28)]"
            exit={{ y: -20, opacity: 0 }}
            initial={{ y: -20, opacity: 0 }}
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                <MagnifyingGlass size={18} weight="bold" />
              </div>
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] caret-[var(--brand)]"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyQuery(query);
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Where to? Search events…"
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
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="h-px bg-[var(--border-subtle)]" />

            <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
              <AnimatePresence mode="wait">
                {query.trim() ? (
                  <motion.div
                    key="results"
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      Events
                    </p>
                    {suggestions.length > 0 ? (
                      <div className="space-y-1">
                        {suggestions.map((event) => (
                          <button
                            key={event.id}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]"
                            onClick={() => {
                              router.push(`/events/${event.slug}`);
                              onClose();
                            }}
                            type="button"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
                              <Ticket size={14} weight="duotone" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{event.dateLabel} · {event.venue}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[var(--brand-dim)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand)]">
                              {event.city}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-[var(--bg-muted)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                        No events found. Try a venue or category.
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="blank"
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Recent</p>
                      <div className="space-y-0.5">
                        {RECENT_SEARCHES.map((item) => (
                          <button
                            key={item}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition active:bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]"
                            onClick={() => applyQuery(item)}
                            type="button"
                          >
                            <ClockCounterClockwise size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Trending</p>
                      <div className="space-y-0.5">
                        {TRENDING_SEARCHES.map((item) => (
                          <button
                            key={item}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition active:bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]"
                            onClick={() => applyQuery(item)}
                            type="button"
                          >
                            <Fire size={16} className="shrink-0 text-[var(--brand)]" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Browse</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.slug}
                            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3.5 py-2 text-sm text-[var(--text-secondary)] transition active:scale-95 hover:border-[var(--brand)]/30"
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set("category", cat.slug);
                              router.push(`${pathname}?${params.toString()}`, { scroll: false });
                              onClose();
                            }}
                            type="button"
                          >
                            <CategoryIcon slug={cat.slug} size={12} weight="bold" className="inline-block" /> {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Airbnb-style Mini pill shown when scrolled ─────────────────────────────────
function MiniSearchPill({ onSegmentClick }: { onSegmentClick: (seg: ActiveSegment) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex h-[52px] items-stretch overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
      style={{ maxWidth: 520 }}
    >
      {/* What */}
      <motion.button
        type="button"
        onClick={() => onSegmentClick("what")}
        whileHover={{ backgroundColor: "rgba(var(--bg-muted-rgb, 240,240,240), 0.6)" }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-1 items-center justify-center gap-2 px-4 transition-colors"
      >
        <Ticket size={15} weight="duotone" className="shrink-0 text-[var(--brand)]" />
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">What</span>
      </motion.button>

      <div className="self-center h-5 w-px bg-[var(--border-subtle)]" />

      {/* When */}
      <motion.button
        type="button"
        onClick={() => onSegmentClick("when")}
        whileHover={{ backgroundColor: "rgba(var(--bg-muted-rgb, 240,240,240), 0.6)" }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-1 items-center justify-center gap-2 px-4 transition-colors"
      >
        <CalendarBlank size={15} weight="duotone" className="shrink-0 text-[var(--text-secondary)]" />
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">When</span>
      </motion.button>

      <div className="self-center h-5 w-px bg-[var(--border-subtle)]" />

      {/* Surprise Me */}
      <motion.button
        type="button"
        onClick={() => onSegmentClick("lucky")}
        whileHover={{ backgroundColor: "rgba(var(--bg-muted-rgb, 240,240,240), 0.6)" }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-1 items-center justify-center gap-2 px-4 transition-colors"
      >
        <Sparkle size={15} weight="fill" className="shrink-0 text-[var(--brand)]" />
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Surprise Me</span>
      </motion.button>

      {/* Search icon button */}
      <div className="flex items-center pr-2 pl-1">
        <motion.button
          type="button"
          onClick={() => onSegmentClick("what")}
          whileTap={{ scale: 0.93 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_2px_10px_rgba(var(--brand-rgb),0.35)] transition hover:bg-[var(--brand-hover)]"
        >
          <MagnifyingGlass size={15} weight="bold" />
        </motion.button>
      </div>
    </motion.div>
  );
}


// ── Compact mobile search pill (shown inline on home) ─────────────────────────
function MobileSearchPill({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const when = searchParams.get("when");

  const label = q ? q : when ? when : null;

  return (
    <motion.button
      className="flex w-full items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition active:scale-[0.98]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      type="button"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white">
        <MagnifyingGlass size={15} weight="bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
          {label ?? "Search events…"}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
          Accra · All dates
        </p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
        <Sparkle size={13} weight="fill" />
      </div>
    </motion.button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function HomeSearchHero({
  mode,
  className = "",
  compactProgress = 0,
  miniProgress = 0,
}: HomeSearchHeroProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [where, setWhere] = useState(searchParams.get("q") ?? "");
  const [when, setWhen] = useState(searchParams.get("when") ?? "");


  useEffect(() => {
    setWhere(searchParams.get("q") ?? "");
    setWhen(searchParams.get("when") ?? "");
  }, [searchParams]);

  const isExpanded = mode === "expanded";
  const isMini = mode === "mini";
  const isMobile = mode === "mobile";

  const handleSurpriseMe = () => {
    router.push(`/search?q=Surprise me with something perfect for my vibe&surprise=1`);
  };

  const handleMiniSegmentClick = (seg: ActiveSegment) => {
    if (seg === "lucky") {
      handleSurpriseMe();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Mobile: render compact pill + overlay ──
  if (isMobile) {
    return (
      <div className={`w-full ${className}`.trim()}>
        <MobileUnifiedSearch
          emptyLabel="Search events…"
          onSearch={(nextQuery) => {
            const params = new URLSearchParams(searchParams.toString());
            if (nextQuery) params.set("q", nextQuery);
            else params.delete("q");
            if (when.trim()) params.set("when", when.trim());
            else params.delete("when");
            const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            router.push(nextUrl, { scroll: false });
          }}
          subtitle="Accra · Trending events near you"
          value={where}
        />
      </div>
    );
  }

  // ── Mini mode (scrolled past threshold): Airbnb-style pill ──
  if (isMini && miniProgress > 0.85) {
    return (
      <div className={`w-full ${className}`.trim()}>
        <AnimatePresence mode="wait">
          <MiniSearchPill key="mini-pill" onSegmentClick={handleMiniSegmentClick} />
        </AnimatePresence>
      </div>
    );
  }

  // ── Desktop: SearchPillExpanded — has typeahead, category chips, date picker ──
  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="mx-auto w-full" style={{ maxWidth: 1020 }}>
        <SearchPillExpanded compact={false} />
      </div>
    </div>
  );
}

export default HomeSearchHero;
