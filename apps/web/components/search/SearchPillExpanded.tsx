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
} from "@phosphor-icons/react";

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "music",      label: "Music",       emoji: "🎵" },
  { slug: "tech",       label: "Tech",        emoji: "💻" },
  { slug: "food",       label: "Food & Drink", emoji: "🍽" },
  { slug: "arts",       label: "Arts",        emoji: "🎨" },
  { slug: "sports",     label: "Sports",      emoji: "⚽" },
  { slug: "networking", label: "Networking",  emoji: "🤝" },
  { slug: "wellness",   label: "Wellness",    emoji: "🌿" },
  { slug: "nightlife",  label: "Nightlife",   emoji: "🌙" },
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

      {/* Range label */}
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

// ── Main component ─────────────────────────────────────────────────────────────

type Suggestion = { id: string; title: string; slug: string; type: "event" | "user"; subtitle?: string };

export function SearchPillExpanded({
  initialQuery = "",
  initialCategories = [] as string[],
  initialWhen = "",
  className = "",
  compact = false,
}: {
  initialQuery?: string;
  initialCategories?: string[];
  initialWhen?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const pillRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<ActiveSegment>(null);
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

  const selectDay = useCallback((d: number) => {
    setRangeStart((prev) => {
      if (!prev || (prev && rangeEnd)) return d;
      if (d > prev) {
        setRangeEnd(d);
        return prev;
      }
      return d;
    });
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeEnd(null);
    }
  }, [rangeStart, rangeEnd]);

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

  // Debounced typeahead — runs while user types in the "What" input
  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (q.trim().length < 2) { setSuggestions([]); return; }

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
    }, 240);
  }, []);

  // AI-powered "Surprise me" — routes to search page and lets the AI panel handle it
  const handleSurprise = async () => {
    setSurpriseLoading(true);
    setActive(null);
    try {
      const params = new URLSearchParams({ q: "Surprise me with something perfect based on my vibe" });
      setSurpriseDone(true);
      setTimeout(() => router.push(`/search?${params.toString()}`), 400);
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

  const pillH = compact ? "h-12" : "h-16";
  const segPx = compact ? "px-4" : "px-6";
  const showLabels = !compact;

  return (
    <div ref={pillRef} className={`relative w-full ${className}`}>
      {/* ── Pill ── */}
      <div
        className={`flex ${pillH} items-stretch overflow-hidden rounded-full border transition-all duration-300 ${
          active
            ? "border-[var(--border-default)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            : "border-[var(--border-subtle)] shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        } bg-[var(--bg-card)]`}
      >
        {/* What segment */}
        <button
          type="button"
          onClick={() => setActive(active === "what" ? null : "what")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors ${
            active === "what" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
        >
          {showLabels && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              What
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} truncate text-[13px] font-medium ${whatDisplay ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] font-normal"}`}>
            {whatDisplay ?? (compact ? "Search events, people…" : "Search or pick a vibe…")}
          </span>
        </button>

        {/* Divider */}
        <div className={`self-center w-px h-8 bg-[var(--border-subtle)] transition-opacity ${active === "what" ? "opacity-0" : "opacity-100"}`} />

        {/* When segment */}
        <button
          type="button"
          onClick={() => setActive(active === "when" ? null : "when")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors ${
            active === "when" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
        >
          {showLabels && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              When
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} truncate text-[13px] font-medium ${whenDisplay ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] font-normal"}`}>
            {whenDisplay ?? "Add dates"}
          </span>
        </button>

        {/* Divider */}
        <div className={`self-center w-px h-8 bg-[var(--border-subtle)] transition-opacity ${active === "when" ? "opacity-0" : "opacity-100"}`} />

        {/* Feeling Lucky segment */}
        <button
          type="button"
          onClick={() => setActive(active === "lucky" ? null : "lucky")}
          className={`relative flex min-w-0 flex-1 flex-col justify-center ${segPx} text-left transition-colors ${
            active === "lucky" ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-muted)/60]"
          }`}
        >
          {showLabels && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Feeling lucky
            </span>
          )}
          <span className={`${showLabels ? "mt-0.5" : ""} text-[13px] font-normal text-[var(--text-tertiary)]`}>
            Surprise me
          </span>
        </button>

        {/* Search button */}
        <div className="flex items-center pr-2">
          <button
            type="button"
            onClick={handleSearch}
            className={`flex ${compact ? "h-9" : "h-12"} items-center gap-2 rounded-full bg-[#5FBF2A] px-5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(95,191,42,0.35)] transition hover:bg-[#4da823] active:scale-[0.97]`}
          >
            <MagnifyingGlass size={15} weight="bold" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* ── Panels ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50"
          >
            {/* Three-column layout: panels align under their segment */}
            <div className="grid grid-cols-3 gap-3">
              {/* WHAT panel */}
              <div
                className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-opacity ${
                  active === "what" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {/* Free-text query input + typeahead */}
                <div className="mb-3">
                  <input
                    autoFocus={active === "what"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      fetchSuggestions(e.target.value);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                    placeholder="e.g. I'm bored, what can I do tonight?"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[#5FBF2A]/60 caret-[#5FBF2A] transition"
                  />
                  {/* Typeahead suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (s.type === "user") {
                              router.push(s.slug);
                            } else {
                              setQuery(s.title);
                              setSuggestions([]);
                              handleSearch();
                            }
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-muted)] transition"
                        >
                          <span className="text-[11px]">{s.type === "event" ? "🎟" : "👤"}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{s.title}</p>
                            {s.subtitle && <p className="text-[10px] text-[var(--text-tertiary)]">{s.subtitle}</p>}
                          </div>
                          <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
                            {s.type === "event" ? "Event" : "Person"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestionsLoading && query.trim().length >= 2 && suggestions.length === 0 && (
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)] px-1">Searching…</p>
                  )}
                </div>
                <p className="mb-2 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Or pick a vibe</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const sel = selectedCats.includes(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => toggleCat(cat.slug)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] transition ${
                          sel
                            ? "border-[#5FBF2A] bg-[#f0fae6] font-semibold text-[#3E9E1A]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-primary)] hover:border-[var(--border-default)]"
                        }`}
                      >
                        <span className="text-base">{cat.emoji}</span>
                        {cat.label}
                      </button>
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

              {/* WHEN panel */}
              <div
                className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-opacity ${
                  active === "when" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <p className="mb-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Pick your dates</p>
                {/* Quick chips */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {DATE_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setWhenChip(chip.value);
                        setRangeStart(null);
                        setRangeEnd(null);
                      }}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                        whenChip === chip.value
                          ? "border-[#5FBF2A] bg-[#f0fae6] text-[#3E9E1A]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[#5FBF2A] hover:text-[#3E9E1A]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <MiniCalendar
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onSelect={handleCalendarSelect}
                />
              </div>

              {/* FEELING LUCKY panel */}
              <div
                className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-opacity ${
                  active === "lucky" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <p className="mb-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">AI-powered pick</p>
                <div className="mb-4 flex items-start gap-3 rounded-xl bg-[var(--bg-muted)] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5FBF2A]">
                    <Sparkle size={14} weight="fill" className="text-white" />
                  </div>
                  <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    Based on your <span className="font-semibold text-[var(--text-primary)]">Pulse Score</span> and events you've attended, we'll pick something perfect for tonight.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={surpriseLoading || surpriseDone}
                  onClick={handleSurprise}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3E9E1A] to-[#5FBF2A] py-3 text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-[0.97] disabled:opacity-70"
                >
                  {surpriseDone ? (
                    "✓ Found your match!"
                  ) : surpriseLoading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Finding your match…
                    </>
                  ) : (
                    <><Sparkle size={14} weight="fill" /> Surprise me</>
                  )}
                </button>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Afrobeats", "Rooftop", "Under GHS 100", "Fri–Sun", "Osu area"].map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--brand-dim)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-left shadow-sm transition active:scale-[0.98] ${className}`}
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
      </button>

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
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => router.push(`/search?categories=${cat.slug}`)}
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)] transition active:scale-95"
                    >
                      {cat.emoji} {cat.label}
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
