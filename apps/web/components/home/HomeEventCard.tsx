"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Eye,
  MapPin,
  Star,
  Timer,
  X,
} from "@phosphor-icons/react";
import { getEventImage, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";
import { useViewportTrack } from "../../hooks/useViewportTrack";

export type EventSignal = {
  ticker: string;
  urgency: string;
  momentum: string;
  distance: string;
  friends: { initials: string; name: string }[];
};

type HomeEventCardProps = {
  category: Category;
  event: EventItem;
  isActive?: boolean;
  isSaved?: boolean;
  variant?: "featured" | "grid" | "lane";
  mode: "desktop" | "mobile";
  onDismiss: () => void;
  onPreview: () => void;
  onSave: () => void;
  organizer: Organizer;
  signal: EventSignal;
};

const SYNOPSIS_LANE = 120;
const SYNOPSIS_GRID = 80;
const dragThreshold = 96;

export function HomeEventCard({
  category,
  event,
  isActive = false,
  isSaved = false,
  variant = "lane",
  mode,
  onDismiss,
  onPreview,
  onSave,
  signal,
}: HomeEventCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  useViewportTrack(cardRef, { eventId: event.id, source: "feed" });

  let longPressTimer: number | undefined;

  const isFeatured = variant === "featured";
  const isGrid = variant === "grid";
  const isLane = variant === "lane";

  const sizeClasses = isFeatured
    ? "h-full min-h-[480px] lg:min-h-[520px]"
    : isGrid
      ? "h-[310px]"
      : mode === "desktop"
        ? "w-[340px] xl:w-[360px] h-[430px]"
        : "w-full h-[430px]";

  const synopsisMax = isGrid ? SYNOPSIS_GRID : SYNOPSIS_LANE;
  const synopsisText = event.shortDescription;
  const synopsisTruncated = synopsisText.length > synopsisMax;
  const synopsisDisplay = synopsisTruncated
    ? synopsisText.slice(0, synopsisMax).trimEnd()
    : synopsisText;

  return (
    <motion.article
      ref={cardRef}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={`group relative overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 ${sizeClasses} ${
        isActive
          ? "shadow-[0_0_0_2px_var(--brand),0_0_0_5px_rgba(var(--brand-rgb),0.12)]"
          : "hover:-translate-y-0.5"
      }`}
      drag={isLane && mode === "mobile" ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (!isLane || mode !== "mobile") return;
        if (info.offset.x > dragThreshold) onSave();
        else if (info.offset.x < -dragThreshold) onDismiss();
      }}
      onPointerDown={() => {
        if (mode !== "mobile") return;
        longPressTimer = window.setTimeout(() => onPreview(), 420);
      }}
      onPointerLeave={() => { if (longPressTimer) window.clearTimeout(longPressTimer); }}
      onPointerUp={() => { if (longPressTimer) window.clearTimeout(longPressTimer); }}
      whileTap={{ scale: 0.986 }}
      initial={{ opacity: 0, scale: 0.98 }}
    >
      {/* Mobile swipe hints */}
      {isLane && mode === "mobile" ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-24 items-center justify-center bg-[linear-gradient(90deg,var(--home-highlight-bg),transparent)]">
            <span className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Save
            </span>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-28 items-center justify-center bg-[linear-gradient(270deg,var(--danger-dim),transparent)]">
            <span className="rounded-full border border-[color:var(--danger-border)] bg-[color:var(--danger-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pink)]">
              Pass
            </span>
          </div>
        </>
      ) : null}

      {/* Full-bleed image */}
      <Image
        alt={event.title}
        className="object-cover transition duration-500 group-hover:scale-[1.06]"
        fill
        sizes={isFeatured ? "640px" : isGrid ? "280px" : "360px"}
        src={event.bannerUrl || getEventImage(undefined, event.categorySlug)}
      />

      {/* Base gradient — strong enough to keep always-visible text readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/94" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/58 to-transparent" />
      {/* Dark hover overlay */}
      <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/52" />

      {/* ── Top row: context pill + action buttons ── */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        <span className="rounded-full border border-white/14 bg-black/44 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          {event.eyebrow ?? category.name}
        </span>

        <div
          className={`flex items-center gap-2 transition-all duration-200 ${
            isFeatured ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            aria-label="Save event"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-black/52 text-white backdrop-blur-sm transition hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            type="button"
          >
            <Star size={18} weight={isSaved ? "fill" : "regular"} className={isSaved ? "text-amber-400" : ""} />
          </button>
          <button
            aria-label="Quick preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-black/52 text-white backdrop-blur-sm transition hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            type="button"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Invisible full-area click target */}
      <button
        aria-label={`Preview ${event.title}`}
        className="absolute inset-0 z-[5] w-full"
        onClick={onPreview}
        type="button"
      />

      {/* ── Bottom content ── */}
      {isFeatured ? (
        /* ─── Featured card: all content always visible ─── */
        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
            {event.eyebrow}
          </p>
          <h3 className="mt-1.5 font-display text-[2.2rem] italic leading-[0.95] tracking-[-0.025em] text-white">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/72 line-clamp-2">
            {event.shortDescription}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-white/65">
              <Timer size={14} />
              <span>{event.dateLabel} · {event.timeLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/65">
              <MapPin size={14} />
              <span>{signal.distance}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/18 bg-black/44 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {event.priceLabel}
            </span>
            {signal.urgency ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/16 px-3 py-1 text-xs font-semibold text-amber-300">
                <Star size={11} weight="fill" />
                {signal.urgency}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex shrink-0 items-center">
                {signal.friends.slice(0, 2).map((friend, i) => (
                  <span
                    key={friend.name}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-black/52 bg-[color:var(--home-avatar-bg)] text-[10px] font-bold text-white ${i > 0 ? "-ml-2" : ""}`}
                    title={friend.name}
                  >
                    {friend.initials}
                  </span>
                ))}
              </div>
              <p className="truncate text-xs text-white/65">
                {signal.friends[0]?.name}{signal.friends[1] ? ` & ${signal.friends[1].name}` : ""} saved this
              </p>
            </div>
            <button
              className="shrink-0 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--brand-shadow)] transition hover:brightness-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              type="button"
            >
              Get Tickets
            </button>
          </div>
        </div>
      ) : (
        /* ─── Grid / Lane: always-visible info + synopsis slides from bottom on hover ─── */
        <div className="absolute inset-x-0 bottom-0 z-10">
          {/* Synopsis — HOVER ONLY, slides up from below */}
          <div className="translate-y-full opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 px-4 pb-2">
            <p className="text-[13px] leading-[1.6] text-white/82">
              {synopsisDisplay}
              {synopsisTruncated ? (
                <>
                  {"… "}
                  <button
                    className="font-bold text-white transition hover:text-white/85"
                    onClick={(e) => { e.stopPropagation(); onPreview(); }}
                    type="button"
                  >
                    See more
                  </button>
                </>
              ) : null}
            </p>
          </div>

          {/* Always-visible indicators */}
          <div className="p-4">
            {/* Title */}
            <h3
              className={`font-display italic leading-tight tracking-[-0.02em] text-white ${
                isGrid ? "text-[1.15rem] line-clamp-1" : "text-[1.45rem] line-clamp-2"
              }`}
            >
              {event.title}
            </h3>

            {/* Date + Location */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[12px] text-white/70">
                <Timer size={12} className="shrink-0" />
                <span className="truncate">{event.dateLabel} · {event.timeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-white/70">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{signal.distance}</span>
              </div>
            </div>

            {/* Price + Tickets left */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-white/18 bg-black/46 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {event.priceLabel}
              </span>
              {signal.urgency ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/38 bg-amber-500/14 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  <Star size={10} weight="fill" />
                  {signal.urgency}
                </span>
              ) : null}
            </div>

            {/* Friend avatars — always visible */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex shrink-0 items-center">
                {signal.friends.slice(0, 2).map((friend, i) => (
                  <span
                    key={friend.name}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border border-black/50 bg-[color:var(--home-avatar-bg)] text-[9px] font-bold text-white ${i > 0 ? "-ml-1.5" : ""}`}
                    title={friend.name}
                  >
                    {friend.initials}
                  </span>
                ))}
              </div>
              <span className="truncate text-[11px] text-white/60">
                {signal.friends[0]?.name}
                {signal.friends[1] ? ` & ${signal.friends[1].name}` : ""} saved this
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss button — hover only, non-featured */}
      {!isFeatured ? (
        <button
          aria-label="Not interested"
          className="absolute right-3 top-[3.75rem] z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/16 bg-black/50 text-white/55 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:text-white"
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          type="button"
        >
          <X size={14} />
        </button>
      ) : null}
    </motion.article>
  );
}

export default HomeEventCard;
