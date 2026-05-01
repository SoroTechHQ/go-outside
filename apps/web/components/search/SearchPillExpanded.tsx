"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Sparkle,
  X,
  Ticket,
  Cpu,
  ForkKnife,
  Palette,
  Trophy,
  UsersThree,
  Leaf,
  Moon,
  MusicNotes,
  CalendarBlank,
  UserCircle,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

// ── Constants ──────────────────────────────────────────────────────────────────

type Category = { slug: string; label: string; icon: React.ReactNode };

const CATEGORIES: Category[] = [
  { slug: "music",      label: "Music",        icon: <MusicNotes size={16} weight="duotone" /> },
  { slug: "tech",       label: "Tech",         icon: <Cpu size={16} weight="duotone" /> },
  { slug: "food-drink", label: "Food & Drink", icon: <ForkKnife size={16} weight="duotone" /> },
  { slug: "arts",       label: "Arts",         icon: <Palette size={16} weight="duotone" /> },
  { slug: "sports",     label: "Sports",       icon: <Trophy size={16} weight="duotone" /> },
  { slug: "networking", label: "Networking",   icon: <UsersThree size={16} weight="duotone" /> },
  { slug: "wellness",   label: "Wellness",     icon: <Leaf size={16} weight="duotone" /> },
  { slug: "nightlife",  label: "Nightlife",    icon: <Moon size={16} weight="duotone" /> },
];

const DATE_CHIPS = [
  { label: "This weekend",  value: "weekend" },
  { label: "Next week",     value: "next-week" },
  { label: "This month",    value: "month" },
  { label: "Any time",      value: "" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOWS = ["S","M","T","W","T","F","S"];

// ── Mini calendar ──────────────────────────────────────────────────────────────

function MiniCalendar({
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  rangeStart: number | null;
  rangeEnd: number | null;
  onSelect: (day: number) => void;
}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (dir: 1 | -1) => {
    const next = new Date(year, month + dir, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  const isToday = (d: number) =>
    today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const isPast = (d: number) =>
    new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d: number) => d === rangeStart || d === rangeEnd;
  const inRange = (d: number) =>
    rangeStart !== null && rangeEnd !== null && d > rangeStart && d < rangeEnd;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
        >
          <CaretLeft size={13} weight="bold" />
        </button>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
        >
          <CaretRight size={13} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {DOWS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            disabled={isPast(d)}
            onClick={() => onSelect(d)}
            className={[
              "rounded-lg py-1.5 text-center text-[12px] transition",
              isPast(d) ? "cursor-default text-[var(--text-tertiary)] opacity-40" : "hover:bg-[var(--bg-muted)]",
              isToday(d) ? "font-bold text-[#5FBF2A]" : "text-[var(--text-primary)]",
              isSelected(d) ? "!bg-[#5FBF2A] !text-white font-bold" : "",
              inRange(d) ? "!bg-[#f0fae6] !text-[#3E9E1A]" : "",
            ].filter(Boolean).join(" ")}
          >
            {d}
          </button>
        ))}
      </div>

      {rangeStart && rangeEnd && (
        <p className="mt-2 text-center text-[11px] font-semibold text-[#3E9E1A]">
          {MONTHS_SHORT[month]} {rangeStart} – {rangeEnd}
        </p>
      )}
    </div>
  );
}

// ── Panel types ────────────────────────────────────────────────────────────────

type ActiveSegment = "what" | "when" | "lucky" | null;

// ── Suggestion type ────────────────────────────────────────────────────────────

type Suggestion = { id: string; title: string; slug: string; type: "event" | "user"; subtitle?: string };

// ── Main component ─────────────────────────────────────────────────────────────

export function SearchPillExpanded({
  initialQuery = "",
  initialCategories = [] as string[],
  initialWhen = "",
  initialActive = null as ActiveSegment,
  className = "",
  compact = false,
}: {
  initialQuery?: string;
  initialCategories?: string[];
  initialWhen?: string;
  initialActive?: ActiveSegment;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const pillRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<ActiveSegment>(initialActive);
  const [selectedCats, setSelectedCats] = useState<string[]>(initialCategories);
  const [whenChip, setWhenChip] = useState(initialWhen);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [surpriseDone, setSurpriseDone] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialActive when it changes (e.g. from mini-pill click)
  useEffect(() => {
    if (initialActive) setActive(initialActive);
  }, [initialActive]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggleCat = useCallback((slug: string) => {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleCalendarSelect = (d: number) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d);
      setRangeEnd(null);
    } else if (d > rangeStart) {
      setRangeEnd(d);
    } else {
      setRangeStart(d);
      setRangeEnd(null);
    }
  };

  // Debounced typeahead
  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (q.trim().length < 1) { setSuggestions([]); return; }

    suggestDebounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all&limit=6`);
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
      } catch { /* ignore */ } finally {
        setSuggestionsLoading(false);
      }
    }, 180);
  }, []);

  // AI "Surprise me"
  const handleSurprise = async () => {
    setSurpriseLoading(true);
    setActive(null);
    try {
      setSurpriseDone(true);
      setTimeout(() => {
        router.push(`/search?q=Surprise me with something perfect for my vibe&surprise=1`);
      }, 350);
    } catch {
      setSurpriseDone(false);
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleSearch = () => {
    setActive(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCats.length > 0) params.set("categories", selectedCats.join(","));
    if (whenChip) params.set("when", whenChip);
    else if (rangeStart && rangeEnd) {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), rangeStart).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), now.getMonth(), rangeEnd).toISOString().slice(0, 10);
      params.set("when", `${from}:${to}`);
    }
    router.push(`/search?${params.toString()}`);
  };

  // Display values in pill segments
  const whatDisplay = query.trim()
    ? query.trim()
    : selectedCats.length > 0
      ? selectedCats.map((s) => CATEGORIES.find((c) => c.slug === s)?.label ?? s).join(", ")
      : null;

  const whenDisplay = whenChip
    ? DATE_CHIPS.find((c) => c.value === whenChip)?.label ?? whenChip
    : (rangeStart && rangeEnd ? `${MONTHS_SHORT[new Date().getMonth()]} ${rangeStart}–${rangeEnd}` : null);

  const pillH = compact ? "h-12" : "h-[68px]";
  const segPx = compact ? "px-4" : "px-6";
  const showLabels = !compact;

  return (
    <div ref={pillRef} className={`relative w-full ${className}`}>
      {/* ── Pill ── */}
      <motion.div
        className={`flex ${pillH} items-stretch overflow-visible rounded-full border transition-all duration-300 ${
          active
            ? "border-[var(--border-default)] shadow-[0_8px_40px_rgba(0,0,0,0.14)]"
            : "border-[var(--border-subtle)] shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
        } bg-[var(--bg-card)]`}
        whileHover={
          !active
            ? { scale: 1.015, boxShadow: "0 6px 28px rgba(0,0,0,0.12)" }
            : {}
        }
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* What segment */}
        <motion.button
          type="button"
          onClick={() => setActive(active === "what" ? null : "what")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors rounded-full ${
            active === "what" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {showLabels && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <Ticket size={11} weight="bold" />
              What
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} truncate text-[13px] font-medium ${whatDisplay ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] font-normal"}`}>
            {whatDisplay ?? (compact ? "Search events, people…" : "Search or pick a vibe…")}
          </span>
        </motion.button>

        {/* Divider */}
        <div className={`self-center w-px h-8 bg-[var(--border-subtle)] transition-opacity ${active === "what" ? "opacity-0" : "opacity-100"}`} />

        {/* When segment */}
        <motion.button
          type="button"
          onClick={() => setActive(active === "when" ? null : "when")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors rounded-full ${
            active === "when" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {showLabels && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <CalendarBlank size={11} weight="bold" />
              When
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} truncate text-[13px] font-medium ${whenDisplay ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] font-normal"}`}>
            {whenDisplay ?? "Add dates"}
          </span>
        </motion.button>

        {/* Divider */}
        <div className={`self-center w-px h-8 bg-[var(--border-subtle)] transition-opacity ${active === "when" ? "opacity-0" : "opacity-100"}`} />

        {/* Surprise Me segment */}
        <motion.button
          type="button"
          onClick={() => setActive(active === "lucky" ? null : "lucky")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors rounded-full ${
            active === "lucky" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {showLabels && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              <Sparkle size={11} weight="fill" />
              Feeling lucky
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} text-[13px] font-normal text-[var(--text-tertiary)]`}>
            Surprise me
          </span>
        </motion.button>

        {/* Search button */}
        <div className="flex items-center pr-2">
          <motion.button
            type="button"
            onClick={handleSearch}
            className={`flex ${compact ? "h-9" : "h-12"} items-center gap-2 rounded-full bg-[#5FBF2A] px-5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(95,191,42,0.35)] transition hover:bg-[#4da823] active:scale-[0.97]`}
            whileTap={{ scale: 0.95 }}
          >
            <MagnifyingGlass size={15} weight="bold" />
            <span className="hidden sm:inline">Search</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Panels ── */}
      <AnimatePresence>
        {active && (
          <>
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setActive(null)}
            />

            <motion.div
              key={active}
              initial={{ opacity: 0, y: -6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+10px)] z-50"
            >
              {/* Single panel — full width, tabs for segments */}
              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_16px_48px_rgba(0,0,0,0.18)] overflow-hidden">

                {/* WHAT panel */}
                {active === "what" && (
                  <div className="p-5">
                    {/* Search input */}
                    <div className="relative mb-4">
                      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                        <MagnifyingGlass size={15} className="text-[var(--text-tertiary)]" />
                      </div>
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                        placeholder="What kind of event? e.g. live music, rooftop, afrobeats…"
                        className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-3 pl-10 pr-4 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[#5FBF2A]/60 caret-[#5FBF2A] transition"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => { setQuery(""); setSuggestions([]); }}
                          className="absolute inset-y-0 right-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Typeahead suggestions */}
                    <AnimatePresence mode="wait">
                      {suggestions.length > 0 && (
                        <motion.div
                          key="suggestions"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className="mb-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                        >
                          {suggestions.map((s, i) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (s.type === "user") {
                                  router.push(s.slug);
                                  setActive(null);
                                } else {
                                  setQuery(s.title);
                                  setSuggestions([]);
                                  handleSearch();
                                }
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-muted)] transition ${i > 0 ? "border-t border-[var(--border-subtle)]" : ""}`}
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.type === "event" ? "bg-[#f0fae6] text-[#5FBF2A]" : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"}`}>
                                {s.type === "event" ? <Ticket size={14} weight="duotone" /> : <UserCircle size={14} weight="duotone" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{s.title}</p>
                                {s.subtitle && <p className="text-[11px] text-[var(--text-tertiary)]">{s.subtitle}</p>}
                              </div>
                              <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                                {s.type === "event" ? "Event" : "Person"}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                      {suggestionsLoading && query.trim().length >= 1 && suggestions.length === 0 && (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mb-4 flex items-center gap-2 px-1 text-[12px] text-[var(--text-tertiary)]"
                        >
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#5FBF2A]/30 border-t-[#5FBF2A]" />
                          Searching…
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Category grid */}
                    <p className="mb-3 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                      {query ? "Or browse by vibe" : "Browse by vibe"}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORIES.map((cat) => {
                        const sel = selectedCats.includes(cat.slug);
                        return (
                          <motion.button
                            key={cat.slug}
                            type="button"
                            onClick={() => toggleCat(cat.slug)}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center text-[12px] transition ${
                              sel
                                ? "border-[#5FBF2A] bg-[#f0fae6] font-semibold text-[#3E9E1A]"
                                : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-card)]"
                            }`}
                          >
                            <span className={sel ? "text-[#3E9E1A]" : "text-[var(--text-secondary)]"}>{cat.icon}</span>
                            {cat.label}
                          </motion.button>
                        );
                      })}
                    </div>
                    {selectedCats.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCats([])}
                        className="mt-3 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                      >
                        <X size={10} /> Clear selection
                      </button>
                    )}
                  </div>
                )}

                {/* WHEN panel */}
                {active === "when" && (
                  <div className="p-5">
                    <p className="mb-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Pick your dates</p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {DATE_CHIPS.map((chip) => (
                        <motion.button
                          key={chip.label}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setWhenChip(chip.value);
                            setRangeStart(null);
                            setRangeEnd(null);
                          }}
                          className={`rounded-full border px-4 py-1.5 text-[12px] font-medium transition ${
                            whenChip === chip.value
                              ? "border-[#5FBF2A] bg-[#f0fae6] text-[#3E9E1A]"
                              : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[#5FBF2A] hover:text-[#3E9E1A]"
                          }`}
                        >
                          {chip.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Two-month calendar side by side */}
                    <div className="grid grid-cols-2 gap-6">
                      <MiniCalendar
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onSelect={handleCalendarSelect}
                      />
                      <MiniCalendar
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onSelect={handleCalendarSelect}
                      />
                    </div>
                  </div>
                )}

                {/* FEELING LUCKY panel */}
                {active === "lucky" && (
                  <div className="p-5">
                    {/* Gradient hero strip */}
                    <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4a25] to-[#2d7a3a] p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                          <Sparkle size={18} weight="fill" className="text-[#B0E454]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-white">AI-Powered Pick</p>
                          <p className="mt-0.5 text-[11px] text-white/70">
                            Based on your Pulse Score, vibe, and what's hot in Accra right now
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {["Your vibe", "Trending in Accra", "Matches your history", "Best time fit"].map((tag) => (
                          <span key={tag} className="rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] font-medium text-white/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      disabled={surpriseLoading || surpriseDone}
                      onClick={handleSurprise}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3E9E1A] to-[#5FBF2A] py-4 text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(95,191,42,0.3)] transition hover:opacity-90 active:scale-[0.97] disabled:opacity-70"
                    >
                      {surpriseDone ? (
                        <><span className="text-lg">✓</span> Found your match!</>
                      ) : surpriseLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Finding your perfect match…
                        </>
                      ) : (
                        <><Sparkle size={16} weight="fill" /> Surprise me tonight</>
                      )}
                    </motion.button>

                    <p className="mt-3 text-center text-[11px] text-[var(--text-tertiary)]">
                      Our AI reads your past events, saved spots, and current pulse tier to pick for you
                    </p>
                  </div>
                )}

                {/* Footer with search CTA */}
                <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-muted)/60] px-5 py-3">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
                    {active === "what" && selectedCats.length > 0 && (
                      <span>{selectedCats.length} vibe{selectedCats.length > 1 ? "s" : ""} selected</span>
                    )}
                    {active === "when" && whenDisplay && (
                      <span className="flex items-center gap-1">
                        <CalendarBlank size={12} />
                        {whenDisplay}
                      </span>
                    )}
                    {active === "what" && query && (
                      <span className="flex items-center gap-1">
                        <ClockCounterClockwise size={12} />
                        "{query}"
                      </span>
                    )}
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleSearch}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 rounded-full bg-[#5FBF2A] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(95,191,42,0.3)] transition hover:bg-[#4da823]"
                  >
                    <MagnifyingGlass size={14} weight="bold" />
                    Search events
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile compact version ─────────────────────────────────────────────────────

export function SearchPillMobile({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
    setOpen(false);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-sm transition active:scale-[0.98] ${className}`}
        whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5FBF2A] text-white">
          <MagnifyingGlass size={15} weight="bold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Search events…</p>
          <p className="text-[11px] text-[var(--text-tertiary)]">Accra · All dates</p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
          <Sparkle size={12} weight="fill" />
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-0 z-[61] rounded-b-3xl bg-[var(--bg-card)] shadow-2xl"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0fae6] text-[#5FBF2A]">
                  <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") setOpen(false); }}
                  placeholder="Search events, people, vibes…"
                  className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] caret-[#5FBF2A]"
                />
                <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-semibold text-[var(--text-secondary)]">
                  Cancel
                </button>
              </div>
              <div className="px-4 pb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Browse by vibe</p>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => router.push(`/search?categories=${cat.slug}`)}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-3 text-[11px] text-[var(--text-secondary)] transition active:scale-95"
                    >
                      <span className="text-[var(--text-secondary)]">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default SearchPillExpanded;
