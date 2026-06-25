"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  useTransform,
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
  Pause,
  Play,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { FeedEventItem } from "../../lib/app-contracts";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useEventSave } from "../../hooks/useEventSave";
import { GetTicketModal } from "../tickets/GetTicketModal";
import type { TicketTier } from "../cart/CartContext";

const STORY_MS = 8000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function fmtTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function toTicketTiers(event: FeedEventItem): TicketTier[] {
  return (event.ticketTypes ?? []).map((tt) => ({
    id: tt.id,
    name: tt.name,
    price: tt.price,
    priceType: tt.priceType,
  }));
}

function mapsUrl(event: FeedEventItem) {
  const q = encodeURIComponent(
    [event.venue, event.locationLine, event.city].filter(Boolean).join(", "),
  );
  return `https://maps.google.com/?q=${q}`;
}

// ── Progress strips (inside card, card-width) ─────────────────────────────────

function ProgressStrips({ total, current, progress }: { total: number; current: number; progress: number }) {
  return (
    <div className="flex gap-[3px] px-3 pt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/30">
          {i < current && <div className="absolute inset-0 bg-white" />}
          {i === current && (
            <div className="absolute inset-y-0 left-0 bg-white transition-none" style={{ width: `${progress}%` }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Event detail content (shared mobile + desktop) ────────────────────────────

function EventDetail({
  event,
  onGetTickets,
}: {
  event: FeedEventItem;
  onGetTickets: () => void;
}) {
  const { isSaved, toggleSave } = useEventSave(event.id);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-block rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-white/45">
              {event.eyebrow}
            </span>
            <h2 className="text-[1.3rem] font-bold leading-tight tracking-[-0.025em] text-white">
              {event.title}
            </h2>
          </div>
          <button
            onClick={toggleSave}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/12 active:scale-95"
          >
            <BookmarkSimple
              size={14}
              weight={isSaved ? "fill" : "regular"}
              className={isSaved ? "text-[#bbf451]" : "text-white/55"}
            />
          </button>
        </div>

        {/* Short desc */}
        {event.shortDescription && (
          <p className="text-[0.8rem] leading-relaxed text-white/45">{event.shortDescription}</p>
        )}

        {/* Date / time / location */}
        <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-[#1e1e1e] px-4 py-3.5">
          {event.startDatetime && (
            <div className="flex items-center gap-2.5">
              <CalendarBlank size={13} className="shrink-0 text-white/30" />
              <span className="text-[0.77rem] text-white/60">{fmtDate(event.startDatetime)}</span>
            </div>
          )}
          {event.startDatetime && (
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="shrink-0 text-white/30" />
              <span className="text-[0.77rem] text-white/60">
                {fmtTime(event.startDatetime)}
                {event.endDatetime && ` — ${fmtTime(event.endDatetime)}`}
              </span>
            </div>
          )}
          {(event.venue || event.locationLine) && (
            <div className="flex items-start gap-2.5">
              <MapPin size={13} className="mt-0.5 shrink-0 text-white/30" />
              <span className="text-[0.77rem] leading-relaxed text-white/60">
                {[event.venue, event.locationLine].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Google Maps link */}
        {(event.venue || event.locationLine) && (
          <a
            href={mapsUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-[#1e1e1e] px-4 py-3 transition hover:bg-white/[0.05]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2A2622]">
              <MapPin size={14} weight="fill" className="text-[#bbf451]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8rem] font-semibold text-white">
                {event.venue || "View on map"}
              </p>
              <p className="text-[0.7rem] text-white/40">{event.city} · Open in Google Maps</p>
            </div>
            <ArrowSquareOut size={13} className="shrink-0 text-white/25" />
          </a>
        )}

        {/* Price + scarcity */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#2A2622] px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/30">Tickets from</p>
              <p className="mt-0.5 text-[1.15rem] font-bold tracking-[-0.02em] text-white">
                {event.priceLabel || "Free"}
              </p>
            </div>
            {event.scarcity && event.scarcity.state !== "normal" && (
              <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] ${
                event.scarcity.state === "sold_out"
                  ? "bg-red-500/20 text-red-400"
                  : event.scarcity.state === "critical"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-yellow-500/15 text-yellow-400"
              }`}>
                {event.scarcity.label}
              </span>
            )}
          </div>
          {event.capacityLabel && (
            <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-white/30">
              <Users size={11} />{event.capacityLabel}
            </div>
          )}
        </div>

        {/* Full description */}
        {event.description && event.description !== event.shortDescription && (
          <div>
            <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/25">About</p>
            <p className="text-[0.8rem] leading-relaxed text-white/50">{event.description}</p>
          </div>
        )}

        {/* Ticket types */}
        {event.ticketTypes && event.ticketTypes.length > 0 && (
          <div>
            <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/25">Ticket options</p>
            <div className="space-y-1.5">
              {event.ticketTypes.map((tt, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
                  <div>
                    <p className="text-[0.78rem] font-semibold text-white">{tt.name}</p>
                    <p className="text-[0.67rem] text-white/35">{tt.remainingLabel}</p>
                  </div>
                  <span className="text-[0.8rem] font-bold text-[#bbf451]">{tt.priceLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold text-white/35">
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* City / category */}
        <div className="flex items-center gap-2 text-[0.7rem] text-white/25">
          <Lightning size={11} />
          <span>{event.city} · {event.categorySlug}</span>
        </div>
      </div>

      {/* Pinned actions */}
      <div className="shrink-0 space-y-2 border-t border-white/[0.07] bg-[#252526] p-4">
        <button
          onClick={onGetTickets}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#bbf451] py-3.5 text-[0.88rem] font-bold text-black shadow-[0_4px_20px_rgba(187,244,81,0.18)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Ticket size={15} weight="fill" />
          Get Tickets
        </button>
        <Link
          href={`/events/${event.slug}`}
          className="flex w-full items-center justify-center rounded-full border border-white/[0.1] py-3 text-[0.8rem] font-semibold text-white/50 transition hover:bg-white/[0.05] active:scale-[0.98]"
        >
          See more info
        </Link>
      </div>
    </div>
  );
}

// ── Story card image ──────────────────────────────────────────────────────────

function StoryImage({
  event,
  isPeek = false,
  onClick,
  showStrips,
  total,
  current,
  progress,
}: {
  event: FeedEventItem;
  isPeek?: boolean;
  onClick?: () => void;
  showStrips?: boolean;
  total?: number;
  current?: number;
  progress?: number;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={`relative h-full w-full overflow-hidden rounded-[20px] ${isPeek ? "cursor-pointer" : ""}`}
      animate={{ opacity: isPeek ? 0.38 : 1, scale: isPeek ? 0.85 : 1, filter: isPeek ? "blur(2.5px)" : "blur(0px)" }}
      whileHover={isPeek ? { opacity: 0.52, scale: 0.87 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {event.bannerUrl ? (
        <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" priority={!isPeek} />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />

      {/* Progress strips — inside card at very top */}
      {showStrips && total !== undefined && current !== undefined && progress !== undefined && (
        <div className="absolute inset-x-0 top-0 z-10">
          <ProgressStrips total={total} current={current} progress={progress} />
        </div>
      )}
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
  const [isPaused, setIsPaused] = useState(false);
  const [ticketEvent, setTicketEvent] = useState<FeedEventItem | null>(null);
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const event = events[current]!;
  const prevEvent = current > 0 ? events[current - 1] : null;
  const nextEvent = current < events.length - 1 ? events[current + 1] : null;

  const goNext = useCallback(() => {
    if (current < events.length - 1) { setCurrent((c) => c + 1); setProgress(0); }
    else onClose();
  }, [current, events.length, onClose]);

  const goPrev = useCallback(() => {
    if (current > 0) { setCurrent((c) => c - 1); setProgress(0); }
  }, [current]);

  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  // Auto-advance (respects pause)
  useEffect(() => {
    setProgress(0);
    const tick = 60;
    const step = (tick / STORY_MS) * 100;
    timerRef.current = setInterval(() => {
      if (isPaused || drawerExpanded) return;
      setProgress((p) => {
        if (p >= 100) { goNext(); return 0; }
        return Math.min(p + step, 100);
      });
    }, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, isPaused, drawerExpanded, goNext]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") { e.preventDefault(); togglePause(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, goNext, goPrev, togglePause]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Hold-to-pause (pointer events)
  const startHold = useCallback(() => {
    holdRef.current = setTimeout(() => setIsPaused(true), 200);
  }, []);
  const endHold = useCallback(() => {
    if (holdRef.current) clearTimeout(holdRef.current);
    setIsPaused(false);
  }, []);

  // Ticket modal data
  const ticketModalEvent = useMemo(() => {
    if (!ticketEvent) return null;
    return {
      id: ticketEvent.id,
      title: ticketEvent.title,
      date: ticketEvent.startDatetime ? fmtDate(ticketEvent.startDatetime) : ticketEvent.dateLabel,
      time: ticketEvent.startDatetime ? fmtTime(ticketEvent.startDatetime) : ticketEvent.timeLabel,
      venue: ticketEvent.venue,
      city: ticketEvent.city,
      imageUrl: ticketEvent.bannerUrl ?? undefined,
      organizer: ticketEvent.organizerId,
      ticketTypes: toTicketTiers(ticketEvent),
    };
  }, [ticketEvent]);

  // Swipe-down drag (mobile)
  const dragY = useMotionValue(0);
  const overlayOpacity = useTransform(dragY, [0, 220], [1, 0]);

  const handleMobileDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      } else {
        dragY.set(0);
      }
    },
    [dragY, onClose],
  );

  // Drawer drag
  const drawerDragY = useMotionValue(0);
  const drawerControls = useDragControls();

  const handleDrawerDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (info.offset.y < -60 || info.velocity.y < -400) {
        setDrawerExpanded(true);
      } else if (info.offset.y > 60 || info.velocity.y > 400) {
        setDrawerExpanded(false);
      }
      drawerDragY.set(0);
    },
    [drawerDragY],
  );

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60] flex overflow-hidden"
        style={{ background: "#1A1A1A", opacity: isDesktop ? 1 : overlayOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {/* ── Shared top-right controls ── */}
        <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
          >
            {isPaused
              ? <Play size={15} weight="fill" />
              : <Pause size={15} weight="fill" />}
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {isDesktop ? (
          /* ── Desktop ───────────────────────────────────────────── */
          <>
            {/* Logo top-left */}
            <div className="absolute left-5 top-[18px] z-40">
              <Image src="/logo-full.png" alt="GoOutside" width={88} height={26} className="object-contain brightness-0 invert opacity-80" />
            </div>

            <div className="flex h-full w-full items-center justify-center gap-5 px-20 pt-14 pb-8">
              {/* Story column */}
              <div className="relative flex h-full flex-1 items-center justify-center">
                {/* Peek left */}
                {prevEvent && (
                  <div className="absolute left-0 w-[13%]">
                    <StoryImage event={prevEvent} isPeek onClick={goPrev} />
                  </div>
                )}

                {/* Active card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`s-${current}`}
                    className="relative z-10"
                    style={{ aspectRatio: "9/16", height: "calc(100vh - 88px)", maxWidth: "calc((100vh - 88px) * 9/16)" }}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    onPointerDown={startHold}
                    onPointerUp={endHold}
                    onPointerLeave={endHold}
                  >
                    <StoryImage
                      event={event}
                      showStrips
                      total={events.length}
                      current={current}
                      progress={progress}
                    />
                    {/* Invisible tap zones */}
                    <button onClick={goPrev} disabled={!prevEvent} className="absolute left-0 top-0 z-20 h-full w-1/3 opacity-0" />
                    <button onClick={goNext} className="absolute right-0 top-0 z-20 h-full w-1/3 opacity-0" />
                  </motion.div>
                </AnimatePresence>

                {/* Peek right */}
                {nextEvent && (
                  <div className="absolute right-0 w-[13%]">
                    <StoryImage event={nextEvent} isPeek onClick={goNext} />
                  </div>
                )}

                {/* Nav arrows — outside peek zone with breathing room */}
                {prevEvent && (
                  <button onClick={goPrev} className="absolute left-[15%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition hover:bg-white/15">
                    <ArrowLeft size={16} weight="bold" />
                  </button>
                )}
                {nextEvent && (
                  <button onClick={goNext} className="absolute right-[15%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition hover:bg-white/15">
                    <ArrowRight size={16} weight="bold" />
                  </button>
                )}
              </div>

              {/* Event detail card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`c-${current}`}
                  className="h-full w-[42%] max-w-[460px] shrink-0 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#252526] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <EventDetail event={event} onGetTickets={() => setTicketEvent(event)} />
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* ── Mobile ─────────────────────────────────────────────── */
          <div className="relative flex h-full w-full flex-col">
            {/* Story image — draggable down to dismiss */}
            <motion.div
              className="relative flex-1"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              style={{ y: dragY }}
              onDragEnd={handleMobileDragEnd}
              onPointerDown={!drawerExpanded ? startHold : undefined}
              onPointerUp={!drawerExpanded ? endHold : undefined}
              onPointerLeave={!drawerExpanded ? endHold : undefined}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`ms-${current}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" priority />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/35" />
                </motion.div>
              </AnimatePresence>

              {/* Progress strips — inside story, below the close/pause row */}
              <div className="absolute inset-x-0 top-16 z-10 px-4">
                <div className="flex gap-[3px]">
                  {Array.from({ length: events.length }).map((_, i) => (
                    <div key={i} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/30">
                      {i < current && <div className="absolute inset-0 bg-white" />}
                      {i === current && (
                        <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress}%` }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tap zones */}
              <button onClick={goPrev} disabled={!prevEvent} className="absolute left-0 top-0 z-20 h-full w-1/3" />
              <button onClick={goNext} className="absolute right-0 top-0 z-20 h-full w-1/3" />
            </motion.div>

            {/* Bottom drawer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30"
            >
              <motion.div
                className="relative overflow-hidden rounded-t-[26px] border-t border-white/[0.08] bg-[#252526]"
                drag="y"
                dragControls={drawerControls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.1, bottom: 0.08 }}
                onDragEnd={handleDrawerDragEnd}
                style={{ y: drawerDragY }}
                animate={drawerExpanded ? { height: "78vh" } : { height: "auto" }}
                transition={{ type: "spring", stiffness: 360, damping: 36 }}
              >
                {/* Drag handle — centred */}
                <div
                  className="flex cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing"
                  onPointerDown={(e) => drawerControls.start(e)}
                >
                  <div className="h-[3px] w-10 rounded-full bg-white/20" />
                </div>
                {/* Logo row */}
                <div className="px-5 pb-2">
                  <Image src="/logo-full.png" alt="GoOutside" width={72} height={22} className="object-contain brightness-0 invert opacity-60" />
                </div>

                {!drawerExpanded ? (
                  /* Collapsed peek */
                  <div className="px-5 pb-5 pt-1">
                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/30">{event.eyebrow}</p>
                    <h3 className="mt-0.5 line-clamp-1 text-[1.05rem] font-bold text-white">{event.title}</h3>
                    {event.priceLabel && (
                      <p className="mt-0.5 text-[0.77rem] font-semibold text-[#bbf451]">From {event.priceLabel}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-[0.68rem] font-semibold text-white/30">
                      <ArrowUp size={11} weight="bold" />
                      <span>Drag up to learn more</span>
                    </div>
                  </div>
                ) : (
                  /* Expanded full detail */
                  <div
                    className="overflow-hidden"
                    style={{ height: "calc(78vh - 60px)" }}
                  >
                    <EventDetail event={event} onGetTickets={() => setTicketEvent(event)} />
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Ticket modal */}
      <AnimatePresence>
        {ticketModalEvent && (
          <GetTicketModal
            event={ticketModalEvent}
            onClose={() => setTicketEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
