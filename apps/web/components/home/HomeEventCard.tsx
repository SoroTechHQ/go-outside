"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CalendarDots,
  Eye,
  HeartStraight,
  MapPin,
  TrendUp,
  X,
} from "@phosphor-icons/react";
import { getEventImage, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";

type FriendAvatar = {
  initials: string;
  name: string;
};

export type EventSignal = {
  ticker: string;
  urgency: string;
  momentum: string;
  distance: string;
  friends: FriendAvatar[];
};

type HomeEventCardProps = {
  category: Category;
  event: EventItem;
  isActive?: boolean;
  isSaved?: boolean;
  mode: "desktop" | "mobile";
  onDismiss: () => void;
  onPreview: () => void;
  onSave: () => void;
  organizer: Organizer;
  signal: EventSignal;
};

const dragThreshold = 96;

function ActionButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--home-action-border)] bg-[color:var(--home-action-bg)] text-[color:var(--home-action-text)] backdrop-blur transition hover:bg-[color:var(--home-action-bg-hover)]"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

export function HomeEventCard({
  category,
  event,
  isActive = false,
  isSaved = false,
  mode,
  onDismiss,
  onPreview,
  onSave,
  organizer,
  signal,
}: HomeEventCardProps) {
  let longPressTimer: number | undefined;

  const rootClassName =
    "group relative h-full overflow-hidden rounded-[28px] border bg-[color:var(--home-surface)] shadow-[var(--home-shadow)] transition duration-300";
  const activeClassName = isActive
    ? "border-[color:var(--home-highlight-border)] shadow-[var(--home-active-shadow)]"
    : "border-[color:var(--home-border)] hover:border-[color:var(--home-highlight-border)] hover:-translate-y-0.5";

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={`${rootClassName} ${activeClassName} ${mode === "desktop" ? "w-[340px] xl:w-[360px]" : "w-full"}`}
      drag={mode === "mobile" ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (mode !== "mobile") {
          return;
        }

        if (info.offset.x > dragThreshold) {
          onSave();
        } else if (info.offset.x < -dragThreshold) {
          onDismiss();
        }
      }}
      onPointerDown={() => {
        if (mode !== "mobile") {
          return;
        }

        longPressTimer = window.setTimeout(() => {
          onPreview();
        }, 420);
      }}
      onPointerLeave={() => {
        if (longPressTimer) {
          window.clearTimeout(longPressTimer);
        }
      }}
      onPointerUp={() => {
        if (longPressTimer) {
          window.clearTimeout(longPressTimer);
        }
      }}
      whileTap={{ scale: 0.986 }}
    >
      {mode === "mobile" ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-[linear-gradient(90deg,var(--home-highlight-bg),transparent)]">
            <div className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Save
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-28 items-center justify-center bg-[linear-gradient(270deg,var(--danger-dim),transparent)]">
            <div className="rounded-full border border-[color:var(--danger-border)] bg-[color:var(--danger-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pink)]">
              Pass
            </div>
          </div>
        </>
      ) : null}

      <button
        className="relative flex h-full w-full flex-col text-left"
        onClick={onPreview}
        type="button"
      >
        <div className="relative h-[228px] overflow-hidden">
          <Image
            alt={event.title}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            fill
            sizes={mode === "desktop" ? "360px" : "100vw"}
            src={getEventImage(undefined, event.categorySlug)}
          />
          <div className="absolute inset-0 bg-[image:var(--home-image-scrim)]" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color:var(--home-chip-border)] bg-[color:var(--home-chip-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--home-chip-text)] backdrop-blur">
                {event.trending ? "Trending" : event.status}
              </span>
              <span className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)] backdrop-blur">
                {category.name}
              </span>
            </div>

            {mode === "desktop" ? (
              <div className="flex items-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                <ActionButton label="Save event" onClick={onSave}>
                  <HeartStraight size={18} weight={isSaved ? "fill" : "regular"} />
                </ActionButton>
                <ActionButton label="Not interested" onClick={onDismiss}>
                  <X size={18} />
                </ActionButton>
                <ActionButton label="Quick preview" onClick={onPreview}>
                  <Eye size={18} />
                </ActionButton>
              </div>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--home-chip-border)] bg-[color:var(--home-chip-surface)] text-[color:var(--home-chip-text)] backdrop-blur">
                <HeartStraight size={18} weight={isSaved ? "fill" : "regular"} />
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-chip-border)] bg-[color:var(--home-chip-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--home-chip-text)] backdrop-blur">
              <TrendUp size={12} weight="bold" />
              {signal.ticker}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              {event.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-[2rem] italic leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]">
              {event.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
              {event.priceLabel}
            </span>
            <span className="rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              {signal.urgency}
            </span>
          </div>

          <p className={`text-sm leading-6 text-[var(--text-secondary)] ${mode === "mobile" ? "line-clamp-2" : "line-clamp-3"}`}>
            {event.shortDescription}
          </p>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2.5">
              <CalendarDots size={16} />
              <span>
                {event.dateLabel} · {event.timeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} />
              <span>{signal.distance}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[color:var(--home-border)] pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{organizer.name}</p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">{signal.momentum}</p>
            </div>

            <div className="flex shrink-0 items-center">
              {signal.friends.slice(0, 3).map((friend, index) => (
                <span
                  key={friend.name}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--home-avatar-border)] bg-[color:var(--home-avatar-bg)] text-[11px] font-semibold text-[var(--text-primary)] ${
                    index === 0 ? "" : "-ml-2"
                  }`}
                  title={friend.name}
                >
                  {friend.initials}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>
    </motion.article>
  );
}

export default HomeEventCard;
