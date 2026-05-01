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
import { categories, events, getCategoryEmoji } from "@gooutside/demo-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AnimatedSearchPlaceholder from "./AnimatedSearchPlaceholder";
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

const WHERE_SUGGESTIONS = [
  "Osu rooftop nights",
  "East Legon brunch this Sunday",
  "Labadi beach after work",
  "Spintex live music tomorrow",
  "Cantonments art shows this weekend",
  "Airport City networking tonight",
];

const RECENT_SEARCHES = ["Afrofuture 2025", "Osu rooftop", "Jazz under the stars"];
const TRENDING_SEARCHES = ["Detty December events", "Rug Tufting Workshop", "Build Ghana Summit"];

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function smoothStep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

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
                            {getCategoryEmoji(cat.slug)} {cat.name}
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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_2px_10px_rgba(95,191,42,0.35)] transition hover:bg-[var(--brand-hover)]"
        >
          <MagnifyingGlass size={15} weight="bold" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Mini-pill expansion modal ──────────────────────────────────────────────────
function MiniExpandModal({
  open,
  initialActive,
  onClose,
}: {
  open: boolean;
  initialActive: ActiveSegment;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mini-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            key="mini-modal"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-16 z-[56] mx-auto md:inset-x-[10%]"
            style={{ maxWidth: 860 }}
          >
            <SearchPillExpanded
              initialActive={initialActive}
              className="w-full"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
  const [isWhereFocused, setIsWhereFocused] = useState(false);

  // Mini pill expansion state
  const [miniExpanded, setMiniExpanded] = useState(false);
  const [miniActiveSegment, setMiniActiveSegment] = useState<ActiveSegment>(null);

  useEffect(() => {
    setWhere(searchParams.get("q") ?? "");
    setWhen(searchParams.get("when") ?? "");
  }, [searchParams]);

  const isExpanded = mode === "expanded";
  const isMini = mode === "mini";
  const isMobile = mode === "mobile";

  const applySearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (where.trim()) params.set("q", where.trim());
    else params.delete("q");
    if (when.trim()) params.set("when", when.trim());
    else params.delete("when");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const handleSurpriseMe = () => {
    router.push(`/search?q=Surprise me with something perfect for my vibe&surprise=1`);
  };

  const handleMiniSegmentClick = (seg: ActiveSegment) => {
    if (seg === "lucky") {
      handleSurpriseMe();
    } else {
      setMiniActiveSegment(seg);
      setMiniExpanded(true);
    }
  };

  const totalProgress = smoothStep(Math.min(1, compactProgress * 0.6 + miniProgress * 0.4));
  const surpriseFade = Math.max(0, 1 - miniProgress * 1.35);
  const dynamicMaxWidth = `${Math.round(lerp(1020, 648, totalProgress))}px`;
  const dynamicMinHeight = `${Math.round(lerp(isExpanded ? 78 : 68, 56, totalProgress))}px`;
  const dynamicVerticalPadding = `${lerp(isExpanded ? 18 : 15, 10, totalProgress)}px`;
  const dynamicHorizontalPadding = `${lerp(isExpanded ? 36 : 30, 22, totalProgress)}px`;
  const dynamicButtonSize = `${Math.round(lerp(isExpanded ? 58 : 50, 42, totalProgress))}px`;
  const dynamicSearchSize = `${lerp(isMini ? 14 : 16, 14, totalProgress)}px`;
  const dynamicDividerHeight = `${Math.round(lerp(38, 30, totalProgress))}px`;
  const searchText = isMini ? "text-sm" : "text-base";

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

        <MiniExpandModal
          open={miniExpanded}
          initialActive={miniActiveSegment}
          onClose={() => {
            setMiniExpanded(false);
            setMiniActiveSegment(null);
          }}
        />
      </div>
    );
  }

  // ── Desktop: original expanded pill ──
  return (
    <div className={`w-full ${className}`.trim()}>
      <div
        className="mx-auto w-full rounded-[999px] border transition-[max-width,box-shadow,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          maxWidth: dynamicMaxWidth,
          backgroundColor: "var(--bg-card)",
          borderColor: `rgba(15,17,15, ${lerp(0.08, 0.12, totalProgress)})`,
          boxShadow: `0 ${Math.round(lerp(12, 10, totalProgress))}px ${Math.round(lerp(28, 24, totalProgress))}px rgba(15,17,15,${lerp(0.06, 0.09, totalProgress)})`,
        }}
      >
        <div
          className="flex items-center transition-[min-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ minHeight: dynamicMinHeight }}
        >
          <label
            className="min-w-0 flex-1 rounded-l-[999px] transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"
            style={{ padding: `${dynamicVerticalPadding} ${dynamicHorizontalPadding}` }}
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">Where</span>
            <div className="relative mt-1">
              <input
                className={`w-full bg-transparent text-[var(--text-secondary)] outline-none caret-[var(--brand)] placeholder:text-transparent ${searchText}`}
                onBlur={() => setIsWhereFocused(false)}
                onChange={(e) => setWhere(e.target.value)}
                onFocus={() => setIsWhereFocused(true)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                placeholder=""
                type="text"
                value={where}
              />
              {!where && !isWhereFocused ? (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <AnimatedSearchPlaceholder
                    className={searchText}
                    isVisible={!where && !isWhereFocused}
                    suggestions={WHERE_SUGGESTIONS}
                  />
                </div>
              ) : null}
            </div>
          </label>

          <div
            className="w-px bg-[var(--border-subtle)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ height: dynamicDividerHeight }}
          />

          <label
            className="min-w-0 flex-1 rounded-r-[999px] transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"
            style={{ padding: `${dynamicVerticalPadding} ${dynamicHorizontalPadding}` }}
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">When</span>
            <input
              className={`mt-1 w-full bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] ${searchText}`}
              onChange={(e) => setWhen(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
              placeholder="Add dates"
              type="text"
              value={when}
            />
          </label>

          <div className="flex items-center gap-3 pr-3">
            <div
              className="overflow-hidden transition-[max-width,opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                maxWidth: `${Math.round(lerp(152, 0, 1 - surpriseFade))}px`,
                opacity: surpriseFade,
                transform: `scale(${lerp(1, 0.9, 1 - surpriseFade)})`,
              }}
            >
              <button
                className="inline-flex min-w-max items-center gap-2 rounded-full border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-2 text-sm font-medium text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-dim)]"
                onClick={handleSurpriseMe}
                type="button"
              >
                <Sparkle size={14} weight="fill" />
                Surprise me
              </button>
            </div>

            <button
              aria-label="Search events"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] text-white transition-[height,width,background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--brand-hover)] active:scale-[0.96] active:bg-[#1f5f2d]"
              style={{ height: dynamicButtonSize, width: dynamicButtonSize }}
              onClick={applySearch}
              type="button"
            >
              <MagnifyingGlass size={Number.parseFloat(dynamicSearchSize)} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSearchHero;
