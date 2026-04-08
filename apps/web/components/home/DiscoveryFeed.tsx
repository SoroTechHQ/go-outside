"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowClockwise,
  ArrowUp,
  ArrowDown,
  Sparkle,
} from "@phosphor-icons/react";
import { getEventImage, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import EventPeekPanel from "./EventPeekPanel";
import HomeEventCard, { type EventSignal } from "./HomeEventCard";

type FeedEntry = {
  key: string;
  category: Category;
  event: EventItem;
  organizer: Organizer;
};

type DiscoveryFeedProps = {
  entries: FeedEntry[];
  onReset: () => void;
};

type LaneSection = {
  description: string;
  entries: FeedEntry[];
  id: string;
  title: string;
};

const friendGroups = [
  [
    { initials: "AM", name: "Ama" },
    { initials: "KO", name: "Kofi" },
    { initials: "ES", name: "Esi" },
  ],
  [
    { initials: "EK", name: "Ekow" },
    { initials: "NA", name: "Naa" },
    { initials: "YA", name: "Yaa" },
  ],
  [
    { initials: "NI", name: "Nii" },
    { initials: "AF", name: "Afua" },
    { initials: "JO", name: "Jojo" },
  ],
];

function toUniqueEntries(entries: FeedEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.event.id)) return false;
    seen.add(entry.event.id);
    return true;
  });
}

function rotateEntries(entries: FeedEntry[], offset: number) {
  if (entries.length === 0) return [];
  const safeOffset = offset % entries.length;
  return [...entries.slice(safeOffset), ...entries.slice(0, safeOffset)];
}

function getTimeContext(hour: number) {
  if (hour < 12) {
    return {
      laneTitle: "This morning in Accra",
      laneDescription: "Lighter workshops, brunch energy, and daytime events move to the top.",
      streak: "You have explored 8 events this week.",
      vibe: "Morning bias: calmer picks, faster decisions.",
    };
  }
  if (hour < 18) {
    return {
      laneTitle: "This afternoon around the city",
      laneDescription: "Networking, founders, and after-work options take priority before nightlife climbs.",
      streak: "You are first among your friends to spot 3 of today's top picks.",
      vibe: "Afternoon bias: product talks, food, and social planning.",
    };
  }
  return {
    laneTitle: "Tonight in Accra",
    laneDescription: "Nightlife, music, and high-social-pressure events rise above slower daytime listings.",
    streak: "You are in the top 10% of nightlife explorers in Accra.",
    vibe: "Night bias: high-energy, high-urgency events first.",
  };
}

function buildSignal(entry: FeedEntry, index: number): EventSignal {
  const friends = friendGroups[index % friendGroups.length] ?? friendGroups[0];
  const urgency = entry.event.ticketTypes[0]?.remainingLabel ?? entry.event.capacityLabel;
  const location =
    entry.event.locationLine.includes("Accra") || entry.event.locationLine.includes("Kwahu")
      ? `Near ${entry.event.locationLine}`
      : entry.event.locationLine;

  return {
    ticker: entry.event.trending
      ? `${friends[0]?.name} just saved this`
      : `${friends.length} people booked this in the last hour`,
    urgency,
    momentum: `${friends[1]?.name ?? "Kofi"} is already considering this with their group`,
    distance: location,
    friends,
  };
}

function takeLaneEntries(preferred: FeedEntry[], fallback: FeedEntry[], count = 4) {
  const merged = [...preferred, ...fallback];
  const seen = new Set<string>();
  const result: FeedEntry[] = [];
  for (const entry of merged) {
    if (seen.has(entry.event.id)) continue;
    seen.add(entry.event.id);
    result.push(entry);
    if (result.length === count) break;
  }
  return result;
}

function buildSections(entries: FeedEntry[], refreshCount: number, hour: number) {
  const rotated = rotateEntries(entries, refreshCount);
  const context = getTimeContext(hour);
  const nightlifeEntries = rotated.filter((e) => ["music", "networking", "food"].includes(e.event.categorySlug));
  const builderEntries = rotated.filter((e) => ["tech", "networking"].includes(e.event.categorySlug));
  const creativeEntries = rotated.filter((e) => ["music", "arts", "food"].includes(e.event.categorySlug));
  const nearbyEntries = rotated.filter((e) =>
    /(Osu|Labone|Airport|Accra)/i.test(`${e.event.locationLine} ${e.event.venue}`),
  );
  const socialEntries = rotated.filter((e) => e.event.saved || e.event.featured);
  const fastMovingEntries = rotated.filter((e) => e.event.trending || e.event.status === "live");

  const sections: LaneSection[] = [
    {
      id: "time-aware",
      title: context.laneTitle,
      description: context.laneDescription,
      entries: takeLaneEntries(hour >= 18 ? nightlifeEntries : builderEntries, rotated),
    },
    {
      id: "starting-soon",
      title: "Starting in the next 3 hours",
      description: "Compact, fast-moving picks that are easiest to decide on right now.",
      entries: takeLaneEntries(fastMovingEntries, rotated),
    },
    {
      id: "social",
      title: "Because Kofi is going",
      description: "Friend energy, repeat organizers, and socially magnetic rooms rise here.",
      entries: takeLaneEntries(socialEntries, rotated),
    },
    {
      id: "nearby",
      title: hour >= 18 ? "Near Osu tonight" : "Near your last event",
      description: "Distance and familiar neighborhoods keep this row easy to act on.",
      entries: takeLaneEntries(nearbyEntries, rotated),
    },
    {
      id: "creatives",
      title: "For creatives in Accra",
      description: "A tighter lane for design-forward, cultural, and hospitality-heavy picks.",
      entries: takeLaneEntries(creativeEntries, rotated),
    },
    {
      id: "builders",
      title: "For builders and founders",
      description: "Operator-heavy events, product rooms, and founder circles stay grouped.",
      entries: takeLaneEntries(builderEntries, rotated),
    },
  ];

  return sections.filter((section) => section.entries.length > 0);
}

// ── Split-Pane Explore ────────────────────────────────────────────────────────

type SplitPaneProps = {
  entries: FeedEntry[];
  signalById: Record<string, EventSignal>;
  onPreview: (id: string) => void;
};

function getBanner(event: EventItem): { label: string; color: "green" | "amber" | "red" } | null {
  if (event.status === "live") return { label: "Happening now", color: "green" };
  if (event.trending) return { label: "Selling fast", color: "amber" };
  if ((event.ticketTypes[0]?.remainingLabel ?? "").toLowerCase().includes("left"))
    return { label: event.ticketTypes[0]!.remainingLabel, color: "amber" };
  return null;
}

function SplitPaneExplore({ entries, signalById, onPreview }: SplitPaneProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visibleEntries = entries.slice(0, 8);
  const activeEntry = hoveredId
    ? visibleEntries.find((e) => e.event.id === hoveredId) ?? visibleEntries[activeIndex]
    : visibleEntries[activeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + visibleEntries.length) % visibleEntries.length);
  const next = () => setActiveIndex((i) => (i + 1) % visibleEntries.length);

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
      {/* Left 40%: event list with banners */}
      <div className="space-y-2 lg:max-h-[580px] lg:overflow-y-auto no-scrollbar">
        {visibleEntries.map((entry, i) => {
          const banner = getBanner(entry.event);
          const isHovered = hoveredId === entry.event.id;
          const isActive = !hoveredId && i === activeIndex;

          return (
            <div key={entry.key}>
              {banner ? (
                <div
                  className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    banner.color === "green"
                      ? "bg-[color:var(--status-live-bg)] text-[color:var(--status-live-text)]"
                      : "bg-amber-500/14 text-amber-400"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {banner.label}
                </div>
              ) : null}
              <button
                className={`group w-full rounded-[20px] border p-3 text-left transition-all duration-200 ${
                  isHovered || isActive
                    ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)]"
                    : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)]"
                }`}
                onClick={() => onPreview(entry.event.id)}
                onMouseEnter={() => setHoveredId(entry.event.id)}
                onMouseLeave={() => setHoveredId(null)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px]">
                    <Image
                      alt={entry.event.title}
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={getEventImage(undefined, entry.event.categorySlug)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base italic text-[var(--text-primary)]">
                      {entry.event.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                      {entry.event.dateLabel} · {entry.event.timeLabel}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--brand)]">
                      {entry.event.priceLabel}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Right 60%: Reels-style portrait preview */}
      <div className="group/preview relative overflow-hidden rounded-[24px] lg:h-[580px]" style={{ aspectRatio: "9 / 14" }}>
        <AnimatePresence mode="wait">
          {activeEntry ? (
            <motion.div
              key={activeEntry.event.id}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0, scale: 1.04 }}
              initial={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                alt={activeEntry.event.title}
                className="object-cover"
                fill
                sizes="640px"
                src={getEventImage(undefined, activeEntry.event.categorySlug)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/94" />
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/48 to-transparent" />
              {/* Hover dark overlay */}
              <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover/preview:bg-black/30" />

              {/* Top badge */}
              <div className="absolute left-4 top-4">
                <span className="rounded-full border border-white/14 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  {activeEntry.event.eyebrow ?? activeEntry.category.name}
                </span>
              </div>

              {/* Nav buttons */}
              <div className="absolute right-4 top-4 flex flex-col gap-2">
                <button
                  aria-label="Previous event"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  onClick={prev}
                  type="button"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  aria-label="Next event"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  onClick={next}
                  type="button"
                >
                  <ArrowDown size={18} />
                </button>
              </div>

              {/* Bottom content overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
                  {activeEntry.event.eyebrow}
                </p>
                <h3 className="mt-1.5 font-display text-3xl italic leading-tight tracking-[-0.02em] text-white">
                  {activeEntry.event.title}
                </h3>
                <p className="mt-2 text-sm text-white/65 line-clamp-2">
                  {activeEntry.event.shortDescription}
                </p>

                {/* Social proof */}
                <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                  <div className="flex items-center">
                    {(signalById[activeEntry.event.id]?.friends ?? []).slice(0, 2).map((f, i) => (
                      <span
                        key={f.name}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border border-black/40 bg-[color:var(--home-avatar-bg)] text-[9px] font-bold text-white ${i > 0 ? "-ml-1.5" : ""}`}
                      >
                        {f.initials}
                      </span>
                    ))}
                  </div>
                  <span>{signalById[activeEntry.event.id]?.ticker}</span>
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="flex-1 rounded-full bg-[var(--brand)] py-3 text-sm font-semibold text-white shadow-[var(--brand-shadow)] transition hover:brightness-110"
                    onClick={() => onPreview(activeEntry.event.id)}
                    type="button"
                  >
                    Get Tickets
                  </button>
                  <span className="rounded-full border border-white/16 bg-black/44 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                    {activeEntry.event.priceLabel}
                  </span>
                </div>

                {/* Dots */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {visibleEntries.map((e, i) => (
                    <button
                      key={e.event.id}
                      aria-label={`Go to ${e.event.title}`}
                      className={`rounded-full transition-all duration-200 ${
                        e.event.id === activeEntry.event.id
                          ? "h-2 w-6 bg-[var(--brand)]"
                          : "h-2 w-2 bg-white/36"
                      }`}
                      onClick={() => setActiveIndex(i)}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main DiscoveryFeed ────────────────────────────────────────────────────────

export function DiscoveryFeed({ entries, onReset }: DiscoveryFeedProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hour = useMemo(() => new Date().getHours(), []);
  const uniqueEntries = useMemo(() => toUniqueEntries(entries), [entries]);
  const activeEntries = useMemo(
    () => uniqueEntries.filter((entry) => !dismissedIds.includes(entry.event.id)),
    [dismissedIds, uniqueEntries],
  );
  const sections = useMemo(
    () => buildSections(activeEntries, refreshCount, hour),
    [activeEntries, hour, refreshCount],
  );

  const allEntryIds = useMemo(
    () =>
      sections
        .flatMap((s) => s.entries.map((e) => e.event.id))
        .filter((id, i, src) => src.indexOf(id) === i),
    [sections],
  );

  const signalById = useMemo(
    () => Object.fromEntries(activeEntries.map((entry, i) => [entry.event.id, buildSignal(entry, i)])),
    [activeEntries],
  );

  const previewEntry = useMemo(
    () => activeEntries.find((e) => e.event.id === previewEventId) ?? null,
    [activeEntries, previewEventId],
  );

  useEffect(() => {
    if (!allEntryIds.length) {
      setActiveId(null);
      setPreviewEventId(null);
      return;
    }
    if (!activeId || !allEntryIds.includes(activeId)) setActiveId(allEntryIds[0] ?? null);
    if (previewEventId && !allEntryIds.includes(previewEventId)) setPreviewEventId(null);
  }, [activeId, allEntryIds, previewEventId]);

  useEffect(() => {
    if (!isDesktop) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey || !allEntryIds.length) return;

      const currentIndex = activeId ? allEntryIds.indexOf(activeId) : -1;

      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        const nextId = allEntryIds[(currentIndex + 1 + allEntryIds.length) % allEntryIds.length] ?? allEntryIds[0];
        setActiveId(nextId);
        cardRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        return;
      }
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        const nextId =
          allEntryIds[(currentIndex - 1 + allEntryIds.length) % allEntryIds.length] ??
          allEntryIds[allEntryIds.length - 1];
        setActiveId(nextId);
        cardRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        return;
      }
      if (e.key === "Enter" && activeId) { e.preventDefault(); setPreviewEventId(activeId); return; }
      if (e.key.toLowerCase() === "s" && activeId) {
        e.preventDefault();
        setSavedIds((cur) => cur.includes(activeId) ? cur.filter((id) => id !== activeId) : [...cur, activeId]);
        return;
      }
      if (e.key === "Escape") setPreviewEventId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, allEntryIds, isDesktop]);

  if (entries.length === 0) {
    return (
      <div className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-10 text-center">
        <p className="font-display text-3xl italic text-[var(--text-primary)]">No events match that mix.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
          Clear the current filters and the feed will refill with the city's strongest signals.
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)]"
          onClick={onReset}
          type="button"
        >
          <ArrowClockwise size={16} />
          Reset feed
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Section 2: Horizontal Content Lanes ── */}
      <section className="py-2">
        <div className="space-y-10">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              {/* Section header */}
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
                    {section.id.replaceAll("-", " ")}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl italic text-[var(--text-primary)]">
                    {section.title}
                  </h3>
                </div>
                {sectionIndex === 0 ? (
                  <button
                    className="hidden shrink-0 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--home-highlight-border)] hover:text-[var(--text-primary)] lg:inline-flex"
                    onClick={() => setRefreshCount((v) => v + 1)}
                    type="button"
                  >
                    <ArrowClockwise size={15} className="mr-1.5" />
                    Refresh
                  </button>
                ) : null}
              </div>

              {/* Horizontal scroll row */}
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
                {section.entries.map((entry) => (
                  <div
                    key={`${section.id}-${entry.event.id}`}
                    ref={(node) => { cardRefs.current[entry.event.id] = node; }}
                    className={`shrink-0 snap-start ${isDesktop ? "" : "w-[85vw]"}`}
                    onMouseEnter={() => setActiveId(entry.event.id)}
                  >
                    <HomeEventCard
                      category={entry.category}
                      event={entry.event}
                      isActive={entry.event.id === activeId}
                      isSaved={savedIds.includes(entry.event.id) || entry.event.saved}
                      mode={isDesktop ? "desktop" : "mobile"}
                      onDismiss={() => {
                        setDismissedIds((cur) =>
                          cur.includes(entry.event.id) ? cur : [...cur, entry.event.id],
                        );
                        if (previewEventId === entry.event.id) setPreviewEventId(null);
                      }}
                      onPreview={() => setPreviewEventId(entry.event.id)}
                      onSave={() => {
                        setSavedIds((cur) =>
                          cur.includes(entry.event.id)
                            ? cur.filter((id) => id !== entry.event.id)
                            : [...cur, entry.event.id],
                        );
                      }}
                      organizer={entry.organizer}
                      signal={signalById[entry.event.id] as EventSignal}
                      variant="lane"
                    />
                  </div>
                ))}
                <div className="w-8 shrink-0" />
              </div>

              {/* Mid-feed refresh nudge */}
              {sectionIndex === 2 ? (
                <div className="mt-4 rounded-[24px] border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Smart refresh</p>
                      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                        You have seen three sections. Refresh for a new ordering and sharper tonight bias.
                      </p>
                    </div>
                    <button
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)]"
                      onClick={() => setRefreshCount((v) => v + 1)}
                      type="button"
                    >
                      <Sparkle size={15} />
                      Refresh feed
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Split-Pane Explore ── */}
      <section className="py-10">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">Explore</p>
          <h2 className="mt-1.5 font-display text-3xl italic text-[var(--text-primary)]">
            What's happening right now
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Hover a card to preview. Scroll up and down for more.
          </p>
        </div>
        <SplitPaneExplore
          entries={activeEntries.slice(0, 8)}
          signalById={signalById}
          onPreview={(id) => setPreviewEventId(id)}
        />
      </section>

      {/* Peek Panel */}
      <EventPeekPanel
        category={previewEntry?.category as Category}
        event={previewEntry?.event ?? null}
        isDesktop={isDesktop}
        isSaved={previewEntry ? savedIds.includes(previewEntry.event.id) || previewEntry.event.saved : false}
        onClose={() => setPreviewEventId(null)}
        onDismiss={() => {
          if (!previewEntry) return;
          setDismissedIds((cur) =>
            cur.includes(previewEntry.event.id) ? cur : [...cur, previewEntry.event.id],
          );
          setPreviewEventId(null);
        }}
        onSave={() => {
          if (!previewEntry) return;
          setSavedIds((cur) =>
            cur.includes(previewEntry.event.id)
              ? cur.filter((id) => id !== previewEntry.event.id)
              : [...cur, previewEntry.event.id],
          );
        }}
        organizer={previewEntry?.organizer ?? null}
        signal={previewEntry ? (signalById[previewEntry.event.id] as EventSignal) : null}
      />

      {/* Sticky Decision Bar */}
      {savedIds.length > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] px-5 py-3 shadow-[var(--home-shadow-strong)] backdrop-blur-md">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Saved: {savedIds.length} event{savedIds.length !== 1 ? "s" : ""}
          </span>
          <div className="h-4 w-px bg-[color:var(--home-border)]" />
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--home-highlight-border)] hover:text-[var(--text-primary)]"
            type="button"
          >
            Compare
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-1.5 text-sm font-semibold text-[var(--brand-contrast)] transition hover:brightness-110"
            type="button"
          >
            Plan weekend
          </button>
        </div>
      ) : null}
    </>
  );
}

export default DiscoveryFeed;
