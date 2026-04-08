"use client";

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
  /**
   * featured – large editorial card with full content (left side of hero grid)
   * grid     – small 2×2 discovery card, collapses to image+title+signal, hover reveals more
   * lane     – horizontal-scroll card, same collapse/reveal but wider
   */
  variant?: "featured" | "grid" | "lane";
  mode: "desktop" | "mobile";
  onDismiss: () => void;
  onPreview: () => void;
  onSave: () => void;
  organizer: Organizer;
  signal: EventSignal;
};

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
  let longPressTimer: number | undefined;

  const isFeatured = variant === "featured";
  const isGrid = variant === "grid";
  const isLane = variant === "lane";

  // Single signal for collapsed cards
  const singleSignal =
    event.priceValue === 0
      ? "Free"
      : signal.urgency.toLowerCase().includes("left") ||
          signal.urgency.toLowerCase().includes("fast") ||
          signal.urgency.toLowerCase().includes("selling")
        ? signal.urgency
        : signal.friends.length > 0
          ? `${signal.friends.length} friends going`
          : event.priceLabel;

  const isSellFast =
    signal.urgency.toLowerCase().includes("left") ||
    signal.urgency.toLowerCase().includes("fast") ||
    signal.urgency.toLowerCase().includes("selling");

  const sizeClasses = isFeatured
    ? "h-full min-h-[480px] lg:min-h-[520px]"
    : isGrid
      ? "h-[260px]"
      : mode === "desktop"
        ? "w-[340px] xl:w-[360px] h-[400px]"
        : "w-full h-[400px]";

  return (
    <motion.article
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
        src={getEventImage(undefined, event.categorySlug)}
      />

      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-transparent to-black/88" />
      {/* Top gradient for badge readability */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/52 to-transparent" />
      {/* Hover dark overlay — improves text readability when content is revealed */}
      <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/38" />

      {/* ── Top row: context pill + action buttons ── */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        <span className="rounded-full border border-white/14 bg-black/36 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          {event.eyebrow ?? category.name}
        </span>

        {/* Action buttons: always on featured, hover-only on others */}
        <div
          className={`flex items-center gap-2 transition-all duration-200 ${
            isFeatured ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            aria-label="Save event"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/42 text-white backdrop-blur-sm transition hover:bg-black/62"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            type="button"
          >
            <Star size={18} weight={isSaved ? "fill" : "regular"} className={isSaved ? "text-amber-400" : ""} />
          </button>
          <button
            aria-label="Quick preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/42 text-white backdrop-blur-sm transition hover:bg-black/62"
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
      <div className="absolute inset-x-0 bottom-0 z-10 p-5">
        {isFeatured ? (
          /* ─── Featured card: always shows full content (like reference screenshot) ─── */
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
              {event.eyebrow}
            </p>
            <h3 className="mt-1.5 font-display text-[2.1rem] italic leading-[0.96] tracking-[-0.025em] text-white">
              {event.title}
            </h3>
            <p className="mt-2 max-w-[42ch] text-sm leading-6 text-white/70 line-clamp-2">
              {event.shortDescription}
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-white/62">
                <Timer size={13} />
                <span className="uppercase tracking-[0.08em]">{event.dateLabel} · {event.timeLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/62">
                <MapPin size={13} />
                <span>{signal.distance}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {signal.urgency ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/16 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Star size={11} weight="fill" />
                  {signal.urgency}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/32 px-3 py-1 text-xs text-white/62">
                <span className="h-1.5 w-1.5 rounded-full bg-white/48" />
                {(signal.friends.length * 38 + 80).toString()}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
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
                <p className="truncate text-xs text-white/62">
                  {signal.friends[0]?.name}{signal.friends[1] ? ` & ${signal.friends[1].name}` : ""} saved this event
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--brand-shadow)] transition hover:brightness-110 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onPreview(); }}
                  type="button"
                >
                  Get Tickets
                </button>
                <span className="rounded-full border border-white/16 bg-black/44 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  {event.priceLabel}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* ─── Grid / Lane card: collapsed by default, hover reveals more ─── */
          <>
            {/* Hover reveal: slides up from hidden position */}
            <div className="translate-y-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 mb-3">
              {/* Description */}
              <p className="mb-3 text-xs leading-5 text-white/72 line-clamp-2">
                {event.shortDescription}
              </p>
              {/* Time + location */}
              <div className="mb-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-white/58">
                  <Timer size={11} />
                  <span>{event.dateLabel} · {event.timeLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/58">
                  <MapPin size={11} />
                  <span>{signal.distance}</span>
                </div>
              </div>
              {/* Social proof */}
              <div className="mb-3 flex items-center gap-1.5">
                <div className="flex items-center">
                  {signal.friends.slice(0, 2).map((friend, i) => (
                    <span
                      key={friend.name}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border border-black/50 bg-[color:var(--home-avatar-bg)] text-[8px] font-bold text-white ${i > 0 ? "-ml-1.5" : ""}`}
                    >
                      {friend.initials}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-white/55">
                  {signal.friends[0]?.name}{signal.friends[1] ? ` & ${signal.friends[1].name}` : ""} saved this
                </span>
              </div>
              {/* CTA row */}
              <div className="flex items-center gap-2">
                <button
                  className="flex-1 rounded-full bg-[var(--brand)] py-2 text-xs font-semibold text-white transition hover:brightness-110"
                  onClick={(e) => { e.stopPropagation(); onPreview(); }}
                  type="button"
                >
                  Get Tickets
                </button>
                <span className="rounded-full border border-white/16 bg-black/44 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  {event.priceLabel}
                </span>
              </div>
            </div>

            {/* Always-visible: title + signal */}
            <h3
              className={`font-display italic leading-tight tracking-[-0.02em] text-white ${
                isGrid ? "text-base line-clamp-2" : "text-[1.35rem] line-clamp-2"
              }`}
            >
              {event.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/50">{event.dateLabel}</span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  event.priceValue === 0
                    ? "border border-[var(--brand)]/28 bg-[var(--brand)]/14 text-[var(--brand)]"
                    : isSellFast
                      ? "border border-amber-500/34 bg-amber-500/14 text-amber-300"
                      : "border border-white/14 bg-black/28 text-white/68"
                }`}
              >
                {singleSignal}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Dismiss button (hover-only, non-featured) */}
      {!isFeatured ? (
        <button
          aria-label="Not interested"
          className="absolute right-3 top-[3.75rem] z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/16 bg-black/36 text-white/52 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:text-white"
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
