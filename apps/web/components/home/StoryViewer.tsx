"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls } from "framer-motion";
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
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { FeedEventItem } from "../../lib/app-contracts";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useEventSave } from "../../hooks/useEventSave";

const STORY_DURATION = 7000;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Progress bar strip ────────────────────────────────────────────────────────

function ProgressBar({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: number;
}) {
  return (
    <div className="flex gap-1 px-4 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="relative h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/25">
          {i < current && (
            <div className="absolute inset-0 bg-white" />
          )}
          {i === current && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-white"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Floating event card (dark, right panel on desktop) ───────────────────────

function EventInfoCard({
  event,
  onGetTickets,
}: {
  event: FeedEventItem;
  onGetTickets: () => void;
}) {
  const { isSaved, toggleSave } = useEventSave(event.id);

  return (
    <div className="flex h-full flex-col gap-5 rounded-[28px] border border-white/[0.07] bg-[#252526] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
      {/* Category pill */}
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
          {event.eyebrow}
        </span>
        <button
          onClick={toggleSave}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/10 active:scale-95"
        >
          <BookmarkSimple
            size={15}
            weight={isSaved ? "fill" : "regular"}
            className={isSaved ? "text-[#bbf451]" : "text-white/60"}
          />
        </button>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-white">
          {event.title}
        </h2>
        {event.shortDescription && (
          <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-white/50">
            {event.shortDescription}
          </p>
        )}
      </div>

      {/* Meta rows */}
      <div className="space-y-2.5">
        {event.startDatetime && (
          <div className="flex items-center gap-2.5 text-[0.8rem] text-white/60">
            <CalendarBlank size={14} className="shrink-0 text-white/30" />
            <span>{formatDate(event.startDatetime)}</span>
          </div>
        )}
        {event.startDatetime && (
          <div className="flex items-center gap-2.5 text-[0.8rem] text-white/60">
            <Clock size={14} className="shrink-0 text-white/30" />
            <span>{formatTime(event.startDatetime)}</span>
          </div>
        )}
        {(event.venue || event.locationLine) && (
          <div className="flex items-start gap-2.5 text-[0.8rem] text-white/60">
            <MapPin size={14} className="mt-0.5 shrink-0 text-white/30" />
            <span className="line-clamp-2">{event.venue || event.locationLine}</span>
          </div>
        )}
      </div>

      {/* Price */}
      {event.priceLabel && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#2A2622] px-4 py-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/35">
            Tickets from
          </p>
          <p className="mt-0.5 text-[1.15rem] font-bold tracking-[-0.02em] text-white">
            {event.priceLabel}
          </p>
          {event.scarcity?.ticketsRemaining != null && (
            <p className="mt-0.5 text-[0.7rem] font-semibold text-[#f97316]">
              {event.scarcity.ticketsRemaining} left
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto flex flex-col gap-2.5">
        <Link
          href={`/events/${event.slug}`}
          onClick={onGetTickets}
          className="flex items-center justify-center gap-2 rounded-full bg-[#bbf451] py-3.5 text-[0.88rem] font-bold text-black shadow-[0_4px_20px_rgba(187,244,81,0.25)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Ticket size={15} weight="fill" />
          Get Tickets
        </Link>
        <Link
          href={`/events/${event.slug}`}
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-3 text-[0.82rem] font-semibold text-white/70 transition hover:bg-white/10 active:scale-[0.98]"
        >
          View full event
        </Link>
      </div>
    </div>
  );
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────────

function MobileEventSheet({ event }: { event: FeedEventItem }) {
  const [expanded, setExpanded] = useState(false);
  const { isSaved, toggleSave } = useEventSave(event.id);
  const dragY = useMotionValue(0);
  const dragControls = useDragControls();

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y < -60 || info.velocity.y < -300) {
        setExpanded(true);
        dragY.set(0);
      } else if (info.offset.y > 60 || info.velocity.y > 300) {
        setExpanded(false);
        dragY.set(0);
      } else {
        dragY.set(0);
      }
    },
    [dragY],
  );

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-10"
      animate={{ y: expanded ? 0 : 0 }}
    >
      <motion.div
        className="relative rounded-t-[28px] border-t border-white/[0.08] bg-[#252526]"
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: expanded ? 0 : 0 }}
        dragElastic={{ top: 0.15, bottom: 0.1 }}
        onDragEnd={handleDragEnd}
        style={{ y: dragY }}
        animate={expanded ? { height: "82vh" } : { height: "auto" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        {/* Drag handle */}
        <div
          className="flex cursor-grab items-center justify-center pb-3 pt-4 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="h-[3px] w-10 rounded-full bg-white/20" />
        </div>

        {!expanded ? (
          /* Collapsed: title + hint */
          <div className="px-5 pb-5">
            <p className="line-clamp-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
              {event.eyebrow}
            </p>
            <h3 className="mt-1 text-[1.05rem] font-bold leading-tight text-white">{event.title}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[0.72rem] font-semibold text-white/35">
              <ArrowUp size={11} weight="bold" />
              <span>Drag up to learn more about this event</span>
            </div>
          </div>
        ) : (
          /* Expanded: full event detail */
          <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: "calc(82vh - 52px)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                  {event.eyebrow}
                </p>
                <h3 className="mt-0.5 text-[1.2rem] font-bold leading-tight text-white">
                  {event.title}
                </h3>
              </div>
              <button
                onClick={toggleSave}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
              >
                <BookmarkSimple
                  size={15}
                  weight={isSaved ? "fill" : "regular"}
                  className={isSaved ? "text-[#bbf451]" : "text-white/60"}
                />
              </button>
            </div>

            {event.shortDescription && (
              <p className="mt-3 text-[0.85rem] leading-relaxed text-white/50">
                {event.shortDescription}
              </p>
            )}

            <div className="mt-4 space-y-2.5">
              {event.startDatetime && (
                <div className="flex items-center gap-2.5 text-[0.82rem] text-white/60">
                  <CalendarBlank size={14} className="text-white/30" />
                  {formatDate(event.startDatetime)} · {formatTime(event.startDatetime)}
                </div>
              )}
              {(event.venue || event.locationLine) && (
                <div className="flex items-start gap-2.5 text-[0.82rem] text-white/60">
                  <MapPin size={14} className="mt-0.5 text-white/30" />
                  {event.venue || event.locationLine}
                </div>
              )}
            </div>

            {event.priceLabel && (
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#2A2622] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Tickets from
                </p>
                <p className="mt-0.5 text-[1.1rem] font-bold text-white">{event.priceLabel}</p>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href={`/events/${event.slug}`}
                className="flex items-center justify-center gap-2 rounded-full bg-[#bbf451] py-3.5 text-[0.88rem] font-bold text-black shadow-[0_4px_20px_rgba(187,244,81,0.2)] transition hover:brightness-110 active:scale-[0.98]"
              >
                <Ticket size={15} weight="fill" />
                Get Tickets
              </Link>
              <Link
                href={`/events/${event.slug}`}
                className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.05] py-3 text-[0.82rem] font-semibold text-white/70"
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

// ── Story image card ──────────────────────────────────────────────────────────

function StoryCard({
  event,
  isPeek = false,
  peekSide,
  onClick,
}: {
  event: FeedEventItem;
  isPeek?: boolean;
  peekSide?: "left" | "right";
  onClick?: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={`relative overflow-hidden rounded-[22px] ${isPeek ? "cursor-pointer" : ""}`}
      style={{
        aspectRatio: "9/16",
        opacity: isPeek ? 0.45 : 1,
        filter: isPeek ? "blur(1.5px)" : "none",
        scale: isPeek ? 0.88 : 1,
      }}
      whileHover={isPeek ? { opacity: 0.6, scale: 0.9 } : undefined}
      transition={{ duration: 0.2 }}
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
      {/* Bottom scrim */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />

      {!isPeek && (
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/55">
            {event.eyebrow}
          </p>
          <p className="mt-1 text-[1.05rem] font-bold leading-tight text-white">{event.title}</p>
          {event.startDatetime && (
            <p className="mt-1 text-[0.72rem] text-white/60">{formatDate(event.startDatetime)}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main StoryViewer ──────────────────────────────────────────────────────────

type StoryViewerProps = {
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
    const interval = 100;
    const step = (interval / STORY_DURATION) * 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + step;
      });
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, goNext, goPrev]);

  if (!event) return null;

  const prevEvent = current > 0 ? events[current - 1] : null;
  const nextEvent = current < events.length - 1 ? events[current + 1] : null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
        style={{ background: "#1A1A1A" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
        >
          <X size={17} weight="bold" />
        </button>

        {isDesktop ? (
          /* ── Desktop layout ─────────────────────────────────────── */
          <div className="flex h-full items-center justify-center gap-8 px-8">
            {/* Left: story carousel */}
            <div className="relative flex h-full flex-1 items-center justify-center">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 z-10">
                <ProgressBar total={events.length} current={current} progress={progress} />
              </div>

              {/* Peek left */}
              {prevEvent && (
                <div className="absolute left-0 z-0 w-[22%]">
                  <StoryCard event={prevEvent} isPeek peekSide="left" onClick={goPrev} />
                </div>
              )}

              {/* Main card */}
              <motion.div
                key={current}
                className="relative z-10 w-[46%]"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StoryCard event={event} />

                {/* Tap zones */}
                <button
                  onClick={goPrev}
                  className="absolute left-0 top-0 h-full w-1/3 cursor-pointer opacity-0"
                  aria-label="Previous"
                />
                <button
                  onClick={goNext}
                  className="absolute right-0 top-0 h-full w-1/3 cursor-pointer opacity-0"
                  aria-label="Next"
                />
              </motion.div>

              {/* Peek right */}
              {nextEvent && (
                <div className="absolute right-0 z-0 w-[22%]">
                  <StoryCard event={nextEvent} isPeek peekSide="right" onClick={goNext} />
                </div>
              )}

              {/* Nav arrows */}
              {prevEvent && (
                <button
                  onClick={goPrev}
                  className="absolute left-[24%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <ArrowLeft size={17} weight="bold" />
                </button>
              )}
              {nextEvent && (
                <button
                  onClick={goNext}
                  className="absolute right-[24%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <ArrowRight size={17} weight="bold" />
                </button>
              )}
            </div>

            {/* Right: floating event card */}
            <motion.div
              key={`card-${current}`}
              className="w-[320px] shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <EventInfoCard
                event={event}
                onGetTickets={() => {}}
              />
            </motion.div>
          </div>
        ) : (
          /* ── Mobile layout ──────────────────────────────────────── */
          <div className="relative flex h-full flex-col">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 z-20">
              <ProgressBar total={events.length} current={current} progress={progress} />
            </div>

            {/* Story image fills screen */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" priority />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </motion.div>
              </AnimatePresence>

              {/* Tap zones */}
              <button
                onClick={goPrev}
                className="absolute left-0 top-0 h-full w-1/3 z-10"
                aria-label="Previous"
              />
              <button
                onClick={goNext}
                className="absolute right-0 top-0 h-full w-1/3 z-10"
                aria-label="Next"
              />
            </div>

            {/* Bottom sheet */}
            <MobileEventSheet event={event} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
