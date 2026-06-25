"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
} from "framer-motion";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Ticket,
  BookmarkSimple,
  CalendarBlank,
  MapPin,
  Clock,
  ArrowUp,
  Tag,
  Users,
  Lightning,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { FeedEventItem } from "../../lib/app-contracts";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useEventSave } from "../../hooks/useEventSave";

const STORY_DURATION_MS = 8000;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Progress bars (contained within card width) ───────────────────────────────

function ProgressStrips({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: number;
}) {
  return (
    <div className="flex gap-[3px] px-3 pt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/30"
        >
          {i < current && <div className="absolute inset-0 bg-white" />}
          {i === current && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-white"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Full event detail card (right panel) ─────────────────────────────────────

function StoryEventCard({ event }: { event: FeedEventItem }) {
  const { isSaved, toggleSave } = useEventSave(event.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#252526] shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-5 p-6">

          {/* Category + save */}
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              {event.eyebrow}
            </span>
            <button
              onClick={toggleSave}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/12 active:scale-95"
            >
              <BookmarkSimple
                size={14}
                weight={isSaved ? "fill" : "regular"}
                className={isSaved ? "text-[#bbf451]" : "text-white/55"}
              />
            </button>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-[1.45rem] font-bold leading-tight tracking-[-0.03em] text-white">
              {event.title}
            </h2>
            {event.shortDescription && (
              <p className="mt-2 text-[0.8rem] leading-relaxed text-white/45">
                {event.shortDescription}
              </p>
            )}
          </div>

          {/* Date / time / location */}
          <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-[#1e1e1e] px-4 py-3.5">
            {event.startDatetime && (
              <div className="flex items-center gap-2.5">
                <CalendarBlank size={13} className="shrink-0 text-white/30" />
                <span className="text-[0.78rem] text-white/60">
                  {formatDate(event.startDatetime)}
                </span>
              </div>
            )}
            {event.startDatetime && (
              <div className="flex items-center gap-2.5">
                <Clock size={13} className="shrink-0 text-white/30" />
                <span className="text-[0.78rem] text-white/60">
                  {formatTime(event.startDatetime)}
                  {event.endDatetime && ` — ${formatTime(event.endDatetime)}`}
                </span>
              </div>
            )}
            {(event.venue || event.locationLine) && (
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="mt-0.5 shrink-0 text-white/30" />
                <span className="text-[0.78rem] leading-relaxed text-white/60">
                  {[event.venue, event.locationLine].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Scarcity + price */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#2A2622] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/35">
                  Tickets from
                </p>
                <p className="mt-0.5 text-[1.2rem] font-bold tracking-[-0.02em] text-white">
                  {event.priceLabel || "Free"}
                </p>
              </div>
              {event.scarcity && event.scarcity.state !== "normal" && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    event.scarcity.state === "sold_out"
                      ? "bg-red-500/20 text-red-400"
                      : event.scarcity.state === "critical"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {event.scarcity.label}
                </span>
              )}
            </div>
            {event.capacityLabel && (
              <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-white/35">
                <Users size={11} />
                {event.capacityLabel}
              </div>
            )}
          </div>

          {/* Full description */}
          {event.description && (
            <div>
              <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/25">
                About this event
              </p>
              <p className="text-[0.82rem] leading-relaxed text-white/55">
                {event.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/40"
                >
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Ticket types */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <div>
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/25">
                Ticket options
              </p>
              <div className="space-y-2">
                {event.ticketTypes.slice(0, 3).map((tt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[0.8rem] font-semibold text-white">
                        {tt.name}
                      </p>
                      <p className="text-[0.68rem] text-white/40">{tt.remainingLabel}</p>
                    </div>
                    <span className="text-[0.82rem] font-bold text-[#bbf451]">
                      {tt.priceLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vibes / category */}
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30">
            <Lightning size={11} />
            <span>
              {event.city} · {event.categorySlug}
            </span>
          </div>
        </div>
      </div>

      {/* Pinned CTA buttons */}
      <div className="shrink-0 space-y-2 border-t border-white/[0.07] bg-[#252526] p-4">
        <Link
          href={`/events/${event.slug}`}
          className="flex items-center justify-center gap-2 rounded-full bg-[#bbf451] py-3.5 text-[0.88rem] font-bold text-black shadow-[0_4px_24px_rgba(187,244,81,0.22)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Ticket size={15} weight="fill" />
          Get Tickets
        </Link>
        <Link
          href={`/events/${event.slug}`}
          className="flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-transparent py-3 text-[0.8rem] font-semibold text-white/55 transition hover:bg-white/[0.06] active:scale-[0.98]"
        >
          View full event
        </Link>
      </div>
    </div>
  );
}

// ── Story card (the 9:16 visual) ─────────────────────────────────────────────

function StoryCard({
  event,
  isPeek = false,
  onClick,
  total,
  current,
  progress,
}: {
  event: FeedEventItem;
  isPeek?: boolean;
  onClick?: () => void;
  total?: number;
  current?: number;
  progress?: number;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-[20px] ${isPeek ? "cursor-pointer" : ""}`}
      style={{ aspectRatio: "9/16" }}
      animate={{
        opacity: isPeek ? 0.4 : 1,
        scale: isPeek ? 0.86 : 1,
        filter: isPeek ? "blur(2px)" : "blur(0px)",
      }}
      whileHover={isPeek ? { opacity: 0.55, scale: 0.88 } : undefined}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Banner */}
      {event.bannerUrl ? (
        <Image
          src={event.bannerUrl}
          alt={event.title}
          fill
          className="object-cover"
          priority={!isPeek}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
      )}

      {/* Gradient scrim — bottom only so it doesn't interfere with progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      {/* Top scrim for progress bar legibility */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />

      {/* Progress strips — inside the card, at top */}
      {!isPeek && total !== undefined && current !== undefined && progress !== undefined && (
        <div className="absolute inset-x-0 top-0 z-10">
          <ProgressStrips total={total} current={current} progress={progress} />
        </div>
      )}
    </motion.div>
  );
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────────

function MobileSheet({ event }: { event: FeedEventItem }) {
  const [expanded, setExpanded] = useState(false);
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y < -60 || info.velocity.y < -400) {
        setExpanded(true);
      } else if (info.offset.y > 60 || info.velocity.y > 400) {
        setExpanded(false);
      }
      dragY.set(0);
    },
    [dragY],
  );

  const { isSaved, toggleSave } = useEventSave(event.id);

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-20"
      animate={expanded ? { y: 0 } : { y: 0 }}
    >
      <motion.div
        className="relative rounded-t-[24px] border-t border-white/[0.08] bg-[#252526]"
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.12, bottom: 0.08 }}
        onDragEnd={handleDragEnd}
        style={{ y: dragY }}
        animate={expanded ? { height: "80vh" } : { height: "auto" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
      >
        {/* Handle */}
        <div
          className="flex cursor-grab items-center justify-center pb-3 pt-4 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="h-[3px] w-10 rounded-full bg-white/20" />
        </div>

        {!expanded ? (
          <div className="px-5 pb-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/30">
              {event.eyebrow}
            </p>
            <h3 className="mt-1 line-clamp-1 text-[1.05rem] font-bold text-white">
              {event.title}
            </h3>
            {event.priceLabel && (
              <p className="mt-0.5 text-[0.78rem] font-semibold text-[#bbf451]">
                From {event.priceLabel}
              </p>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-semibold text-white/30">
              <ArrowUp size={11} weight="bold" />
              <span>Drag up to learn more about this event</span>
            </div>
          </div>
        ) : (
          <div
            className="overflow-y-auto px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: "calc(80vh - 56px)" }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/30">
                  {event.eyebrow}
                </p>
                <h3 className="mt-0.5 text-[1.2rem] font-bold leading-tight text-white">
                  {event.title}
                </h3>
              </div>
              <button
                onClick={toggleSave}
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
              >
                <BookmarkSimple
                  size={14}
                  weight={isSaved ? "fill" : "regular"}
                  className={isSaved ? "text-[#bbf451]" : "text-white/55"}
                />
              </button>
            </div>

            {event.shortDescription && (
              <p className="mb-4 text-[0.83rem] leading-relaxed text-white/50">
                {event.shortDescription}
              </p>
            )}

            <div className="mb-4 space-y-2 rounded-2xl border border-white/[0.06] bg-[#1e1e1e] px-4 py-3.5">
              {event.startDatetime && (
                <div className="flex items-center gap-2.5 text-[0.78rem] text-white/60">
                  <CalendarBlank size={13} className="text-white/30" />
                  {formatDate(event.startDatetime)}
                </div>
              )}
              {event.startDatetime && (
                <div className="flex items-center gap-2.5 text-[0.78rem] text-white/60">
                  <Clock size={13} className="text-white/30" />
                  {formatTime(event.startDatetime)}
                </div>
              )}
              {(event.venue || event.locationLine) && (
                <div className="flex items-start gap-2.5 text-[0.78rem] text-white/60">
                  <MapPin size={13} className="mt-0.5 text-white/30" />
                  {event.venue || event.locationLine}
                </div>
              )}
            </div>

            {event.priceLabel && (
              <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#2A2622] px-4 py-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/30">
                  Tickets from
                </p>
                <p className="mt-0.5 text-[1.1rem] font-bold text-white">
                  {event.priceLabel}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/events/${event.slug}`}
                className="flex items-center justify-center gap-2 rounded-full bg-[#bbf451] py-3.5 text-[0.88rem] font-bold text-black shadow-[0_4px_20px_rgba(187,244,81,0.18)] active:scale-[0.98]"
              >
                <Ticket size={15} weight="fill" />
                Get Tickets
              </Link>
              <Link
                href={`/events/${event.slug}`}
                className="flex items-center justify-center rounded-full border border-white/10 py-3 text-[0.82rem] font-semibold text-white/55"
              >
                View full event
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main StoryViewer ──────────────────────────────────────────────────────────

export type StoryViewerProps = {
  events: FeedEventItem[];
  initialIndex: number;
  onClose: () => void;
};

export function StoryViewer({ events, initialIndex, onClose }: StoryViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const event = events[current];
  const prevEvent = current > 0 ? events[current - 1] : null;
  const nextEvent = current < events.length - 1 ? events[current + 1] : null;

  const goNext = useCallback(() => {
    if (current < events.length - 1) {
      setCurrent((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [current, events.length, onClose]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setProgress(0);
    }
  }, [current]);

  // Auto-advance
  useEffect(() => {
    setProgress(0);
    const tick = 80;
    const step = (tick / STORY_DURATION_MS) * 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return Math.min(p + step, 100);
      });
    }, tick);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, goNext]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!event) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex overflow-hidden"
      style={{ background: "#1A1A1A" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo — top left */}
      <div className="absolute left-5 top-5 z-30">
        <Image
          src="/logo-full.png"
          alt="GoOutside"
          width={96}
          height={28}
          className="object-contain brightness-0 invert"
        />
      </div>

      {/* Close — top right */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
      >
        <X size={16} weight="bold" />
      </button>

      {isDesktop ? (
        /* ── Desktop ── */
        <div className="flex h-full w-full items-center justify-center gap-6 px-16 py-8">
          {/* Story column */}
          <div className="relative flex h-full flex-1 items-center justify-center">
            {/* Peek left */}
            {prevEvent && (
              <div className="absolute left-0 z-0 w-[18%]">
                <StoryCard event={prevEvent} isPeek onClick={goPrev} />
              </div>
            )}

            {/* Active card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`story-${current}`}
                className="relative z-10 h-full"
                style={{ aspectRatio: "9/16", maxHeight: "calc(100vh - 64px)" }}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <StoryCard
                  event={event}
                  total={events.length}
                  current={current}
                  progress={progress}
                />

                {/* Tap zones */}
                <button
                  onClick={goPrev}
                  disabled={!prevEvent}
                  className="absolute left-0 top-0 h-full w-1/3 opacity-0"
                  aria-label="Previous story"
                />
                <button
                  onClick={goNext}
                  className="absolute right-0 top-0 h-full w-1/3 opacity-0"
                  aria-label="Next story"
                />
              </motion.div>
            </AnimatePresence>

            {/* Peek right */}
            {nextEvent && (
              <div className="absolute right-0 z-0 w-[18%]">
                <StoryCard event={nextEvent} isPeek onClick={goNext} />
              </div>
            )}

            {/* Arrow buttons (outside peek zone) */}
            {prevEvent && (
              <button
                onClick={goPrev}
                className="absolute left-[20%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}
            {nextEvent && (
              <button
                onClick={goNext}
                className="absolute right-[20%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                <ArrowRight size={16} weight="bold" />
              </button>
            )}
          </div>

          {/* Event detail card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${current}`}
              className="h-full w-[42%] max-w-[460px] shrink-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <StoryEventCard event={event} />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* ── Mobile ── */
        <div className="relative flex h-full w-full flex-col">
          {/* Story fills screen */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mob-story-${current}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {event.bannerUrl ? (
                  <Image
                    src={event.bannerUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30" />

                {/* Progress strips — inside card at top */}
                <div className="absolute inset-x-0 top-0 z-10 pt-10">
                  <ProgressStrips
                    total={events.length}
                    current={current}
                    progress={progress}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tap zones */}
            <button
              onClick={goPrev}
              disabled={!prevEvent}
              className="absolute left-0 top-0 z-20 h-full w-1/3"
              aria-label="Previous"
            />
            <button
              onClick={goNext}
              className="absolute right-0 top-0 z-20 h-full w-1/3"
              aria-label="Next"
            />
          </div>

          {/* Bottom sheet */}
          <MobileSheet event={event} />
        </div>
      )}
    </motion.div>
  );
}
