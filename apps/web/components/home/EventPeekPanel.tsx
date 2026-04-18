"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellSimple,
  CalendarDots,
  CaretRight,
  HeartStraight,
  MapPin,
  Ticket,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import {
  getEventImage,
  type Category,
  type EventItem,
  type Organizer,
  type TicketType,
} from "@gooutside/demo-data";
import { useAppShell } from "../layout/AppShellContext";
import type { EventSignal } from "./HomeEventCard";

const PANEL_WIDTH = 440;

type EventPeekPanelProps = {
  category: Category;
  event: EventItem | null;
  isDesktop: boolean;
  isSaved: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onSave: () => void;
  organizer: Organizer | null;
  signal: EventSignal | null;
};

function TicketRow({ ticketType }: { ticketType: TicketType }) {
  return (
    <div className="border-b border-[color:var(--home-border)] py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{ticketType.name}</p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{ticketType.remainingLabel}</p>
        </div>
        <span className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-sm font-semibold text-[var(--brand)]">
          {ticketType.priceLabel}
        </span>
      </div>
    </div>
  );
}

export function EventPeekPanel({
  category,
  event,
  isDesktop,
  isSaved,
  onClose,
  onDismiss,
  onSave,
  organizer,
  signal,
}: EventPeekPanelProps) {
  const { setPeekPanelWidth } = useAppShell();
  const isOpen = Boolean(event && organizer && signal);

  // Push page content when panel opens on desktop
  useEffect(() => {
    if (isDesktop && isOpen) {
      setPeekPanelWidth(PANEL_WIDTH);
    } else {
      setPeekPanelWidth(0);
    }
    return () => setPeekPanelWidth(0);
  }, [isDesktop, isOpen, setPeekPanelWidth]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && event && organizer && signal ? (
        <>
          {/* Mobile backdrop only — desktop has no overlay (content pushes instead) */}
          {!isDesktop ? (
            <motion.button
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-[color:var(--home-overlay)]"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={onClose}
              type="button"
            />
          ) : null}

          <motion.aside
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            className={
              isDesktop
                ? // Desktop: flush right edge, full height, no border radius, pushes content
                  "fixed inset-y-0 right-0 z-[60] flex flex-col border-l border-[color:var(--border-subtle)] bg-[color:var(--bg-elevated)] shadow-[-12px_0_40px_rgba(0,0,0,0.18)]"
                : // Mobile: bottom sheet with top radius only
                  "fixed inset-x-0 bottom-0 z-[60] flex max-h-[90vh] flex-col overflow-hidden rounded-t-[28px] border-t border-[color:var(--border-subtle)] bg-[color:var(--bg-elevated)] shadow-[0_-8px_32px_rgba(0,0,0,0.24)]"
            }
            exit={isDesktop ? { x: PANEL_WIDTH } : { y: "100%" }}
            initial={isDesktop ? { x: PANEL_WIDTH } : { y: "100%" }}
            style={isDesktop ? { width: PANEL_WIDTH } : undefined}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header image */}
            <div className="relative h-[200px] shrink-0">
              <Image
                alt={event.title}
                className="object-cover"
                fill
                sizes={`${PANEL_WIDTH}px`}
                src={getEventImage(undefined, event.categorySlug)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/82" />

              {/* Top bar */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <span className="rounded-full border border-white/14 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  {category.name}
                </span>
                <button
                  aria-label="Close panel"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-black/44 text-white backdrop-blur-sm transition hover:bg-black/64"
                  onClick={onClose}
                  type="button"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Title over image */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
                  {event.eyebrow}
                </p>
                <h2 className="mt-1 font-display text-3xl italic leading-tight tracking-[-0.02em] text-white">
                  {event.title}
                </h2>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Description */}
              <div className="border-b border-[color:var(--border-subtle)] p-5">
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{event.shortDescription}</p>
              </div>

              {/* Date + Location */}
              <div className="grid grid-cols-2 border-b border-[color:var(--border-subtle)]">
                <div className="border-r border-[color:var(--border-subtle)] p-5">
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                    <CalendarDots size={15} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">When</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {event.dateLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{event.timeLabel}</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                    <MapPin size={15} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Where</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{event.venue}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{event.city}</p>
                </div>
              </div>

              {/* Social proof */}
              <div className="border-b border-[color:var(--border-subtle)] p-5">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                  <UsersThree size={15} />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Friends going</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center">
                    {signal.friends.map((friend, i) => (
                      <span
                        key={friend.name}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[color:var(--bg-elevated)] bg-[color:var(--home-avatar-bg)] text-xs font-bold text-[var(--text-primary)] ${i > 0 ? "-ml-2.5" : ""}`}
                        title={friend.name}
                      >
                        {friend.initials}
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {signal.friends.map((f) => f.name).join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{signal.ticker}</p>
                  </div>
                </div>
              </div>

              {/* Urgency */}
              {signal.urgency ? (
                <div className="border-b border-[color:var(--border-subtle)] p-5">
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                    <BellSimple size={15} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Availability</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-amber-400">{signal.urgency}</p>
                </div>
              ) : null}

              {/* Ticket options */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                  <Ticket size={15} />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Ticket options</span>
                </div>
                <div className="mt-3">
                  {event.ticketTypes.map((ticketType) => (
                    <TicketRow key={ticketType.name} ticketType={ticketType} />
                  ))}
                </div>
              </div>

              {/* Organizer */}
              <div className="border-t border-[color:var(--border-subtle)] bg-[color:var(--bg-muted)] p-5">
                <Link
                  className="inline-block text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand)]"
                  href={`/organizers/${organizer.id}`}
                >
                  {organizer.name}
                </Link>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{organizer.tag}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  {organizer.followersLabel} · {organizer.eventsLabel}
                </p>
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] transition hover:opacity-80"
                  href={`/organizers/${organizer.id}`}
                >
                  View host profile
                  <CaretRight size={12} />
                </Link>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="shrink-0 border-t border-[color:var(--border-subtle)] p-4">
              <div className="flex gap-3">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)] transition hover:brightness-110 active:scale-[0.98]"
                  onClick={onSave}
                  type="button"
                >
                  <HeartStraight size={17} weight={isSaved ? "fill" : "regular"} />
                  {isSaved ? "Saved" : "Save event"}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-muted)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  onClick={onDismiss}
                  type="button"
                >
                  Pass
                </button>
              </div>
              <Link
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-[color:var(--border-subtle)] py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[color:var(--bg-muted)]"
                href={`/events/${event.slug}`}
              >
                Full event page
                <CaretRight size={15} />
              </Link>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default EventPeekPanel;
