"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  MapPin,
  Star,
  Timer,
  Eye,
  Lightning,
  Users,
} from "@phosphor-icons/react";
import { getEventImage, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type ExploreEntry = {
  event: EventItem;
  category: Category;
  organizer: Organizer;
};

type ExploreClientProps = {
  entries: ExploreEntry[];
};

type SlideType = "video" | "card";
type MobileSlide = { type: SlideType; entry: ExploreEntry };

function getBanner(event: EventItem): { label: string; tone: "green" | "amber" } | null {
  if (event.status === "live") return { label: "Happening now", tone: "green" };
  if (event.trending) return { label: "Selling fast", tone: "amber" };
  const rem = event.ticketTypes[0]?.remainingLabel ?? "";
  if (rem.toLowerCase().includes("left")) return { label: rem, tone: "amber" };
  return null;
}

/* ─── Reel Slide ─────────────────────────────────────────────────────────── */

function ReelSlide({
  entry,
  isActive,
  onSave,
  isSaved,
}: {
  entry: ExploreEntry;
  isActive: boolean;
  onSave: () => void;
  isSaved: boolean;
}) {
  const { event, category } = entry;

  return (
    <div className="group/reel relative h-full w-full overflow-hidden">
      <Image
        alt={event.title}
        className={`object-cover transition-transform duration-700 ${isActive ? "scale-100" : "scale-105"}`}
        fill
        priority={isActive}
        sizes="(min-width: 1024px) 60vw, 100vw"
        src={getEventImage(undefined, event.categorySlug)}
      />
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/94" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
      {/* Hover dark overlay */}
      <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover/reel:bg-black/32" />

      {/* Top: category + save */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <span className="rounded-full border border-white/14 bg-black/38 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          {event.eyebrow ?? category.name}
        </span>
        <button
          aria-label="Save"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/44 text-white backdrop-blur-sm transition hover:bg-black/62"
          onClick={onSave}
          type="button"
        >
          <Star size={20} weight={isSaved ? "fill" : "regular"} className={isSaved ? "text-amber-400" : ""} />
        </button>
      </div>

      {/* Bottom: full content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
          {event.eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-[2.2rem] italic leading-[0.95] tracking-[-0.025em] text-white">
          {event.title}
        </h2>
        <p className="mt-2 max-w-[40ch] text-sm leading-6 text-white/70 line-clamp-2">
          {event.shortDescription}
        </p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Timer size={13} />
            <span className="uppercase tracking-[0.08em]">{event.dateLabel} · {event.timeLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <MapPin size={13} />
            <span>{event.venue}, {event.city}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3 flex items-center gap-2">
          {event.trending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/16 px-3 py-1 text-xs font-semibold text-amber-300">
              <Lightning size={11} weight="fill" />
              Trending
            </span>
          ) : null}
          {event.ticketTypes[0] ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/34 px-3 py-1 text-xs text-white/62">
              <Users size={11} />
              {event.ticketTypes[0].remainingLabel}
            </span>
          ) : null}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-3">
          <button
            className="flex-1 rounded-full bg-[var(--brand)] py-3 text-sm font-semibold text-white shadow-[var(--brand-shadow)] transition hover:brightness-110"
            type="button"
          >
            Get Tickets
          </button>
          <span className="rounded-full border border-white/16 bg-black/44 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">
            {event.priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Card Slide (mobile interstitial) ────────────────────────────────────── */

function CardSlide({ entry }: { entry: ExploreEntry }) {
  const banner = getBanner(entry.event);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <div className="w-full max-w-sm rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface)] p-5 shadow-[var(--home-shadow)]">
        <div className="relative h-40 overflow-hidden rounded-[16px]">
          <Image
            alt={entry.event.title}
            className="object-cover"
            fill
            sizes="400px"
            src={getEventImage(undefined, entry.event.categorySlug)}
          />
          {banner ? (
            <div className="absolute left-3 top-3">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  banner.tone === "green"
                    ? "bg-[color:var(--status-live-bg)] text-[color:var(--status-live-text)]"
                    : "bg-amber-500/18 text-amber-400"
                }`}
              >
                {banner.label}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
            {entry.event.eyebrow}
          </p>
          <h3 className="mt-1 font-display text-2xl italic text-[var(--text-primary)]">{entry.event.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Timer size={12} />
            <span>{entry.event.dateLabel} · {entry.event.timeLabel}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            className="flex-1 rounded-full bg-[var(--brand)] py-2.5 text-sm font-semibold text-white"
            type="button"
          >
            Get Tickets
          </button>
          <span className="rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]">
            {entry.event.priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop: Split-Pane ─────────────────────────────────────────────────── */

function DesktopSplitPane({ entries }: { entries: ExploreEntry[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const displayEntry = hoveredId
    ? entries.find((e) => e.event.id === hoveredId) ?? entries[activeIndex]
    : entries[activeIndex];

  const prev = () => setActiveIndex((i) => (i - 1 + entries.length) % entries.length);
  const next = () => setActiveIndex((i) => (i + 1) % entries.length);

  const toggleSave = (id: string) =>
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
      {/* ── Left pane: event list ── */}
      <div className="no-scrollbar space-y-2 overflow-y-auto lg:max-h-[680px]">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
          Based on your interests
        </p>

        {entries.map((entry, i) => {
          const banner = getBanner(entry.event);
          const isHovered = hoveredId === entry.event.id;
          const isActive = !hoveredId && i === activeIndex;

          return (
            <div key={entry.event.id}>
              {banner ? (
                <div
                  className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    banner.tone === "green"
                      ? "bg-[color:var(--status-live-bg)] text-[color:var(--status-live-text)]"
                      : "bg-amber-500/14 text-amber-400"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {banner.label}
                </div>
              ) : null}

              <button
                className={`group w-full rounded-[20px] border p-3.5 text-left transition-all duration-200 ${
                  isHovered || isActive
                    ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)]"
                    : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)]"
                }`}
                onClick={() => setActiveIndex(i)}
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
                  <Eye
                    size={16}
                    className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition group-hover:opacity-100"
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Right pane: 9:16 reel ── */}
      <div className="relative overflow-hidden rounded-[28px] lg:h-[680px]">
        <AnimatePresence mode="wait">
          {displayEntry ? (
            <motion.div
              key={displayEntry.event.id}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ReelSlide
                entry={displayEntry}
                isActive={true}
                isSaved={savedIds.includes(displayEntry.event.id)}
                onSave={() => toggleSave(displayEntry.event.id)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
          <button
            aria-label="Previous"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/18 bg-black/42 text-white backdrop-blur-sm transition hover:bg-black/62"
            onClick={prev}
            type="button"
          >
            <ArrowUp size={20} />
          </button>
          <button
            aria-label="Next"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/18 bg-black/42 text-white backdrop-blur-sm transition hover:bg-black/62"
            onClick={next}
            type="button"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-1.5">
          {entries.map((e, i) => {
            const isCur = e.event.id === (displayEntry?.event.id ?? "");
            return (
              <button
                key={e.event.id}
                aria-label={`Go to ${e.event.title}`}
                className={`rounded-full transition-all duration-250 ${
                  isCur ? "h-2 w-6 bg-[var(--brand)]" : "h-2 w-2 bg-white/36"
                }`}
                onClick={() => setActiveIndex(i)}
                type="button"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile: Full-screen vertical snap scroll ────────────────────────────── */

function MobileReels({ entries }: { entries: ExploreEntry[] }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Mix in a card slide every 3 reel slides
  const slides: MobileSlide[] = entries.flatMap((entry, i) => {
    const slides: MobileSlide[] = [{ type: "video", entry }];
    if ((i + 1) % 3 === 0 && i < entries.length - 1) {
      slides.push({ type: "card", entry: entries[i + 1] ?? entry });
    }
    return slides;
  });

  const toggleSave = (id: string) =>
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="no-scrollbar h-[calc(100svh-72px)] snap-y snap-mandatory overflow-y-scroll">
      {slides.map((slide, i) => (
        <div key={`${slide.entry.event.id}-${i}`} className="relative h-[calc(100svh-72px)] w-full snap-start overflow-hidden">
          {slide.type === "video" ? (
            <ReelSlide
              entry={slide.entry}
              isActive={true}
              isSaved={savedIds.includes(slide.entry.event.id)}
              onSave={() => toggleSave(slide.entry.event.id)}
            />
          ) : (
            <CardSlide entry={slide.entry} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function ExploreClient({ entries }: ExploreClientProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-display text-3xl italic text-[var(--text-secondary)]">No events to explore.</p>
      </div>
    );
  }

  if (!isDesktop) {
    return <MobileReels entries={entries} />;
  }

  return (
    <div className="container-shell py-8">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">Explore</p>
        <h1 className="mt-1.5 font-display text-4xl italic text-[var(--text-primary)]">
          What's happening right now
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Hover a card to preview · Scroll up and down to discover
        </p>
      </div>
      <DesktopSplitPane entries={entries} />
    </div>
  );
}

export default ExploreClient;
