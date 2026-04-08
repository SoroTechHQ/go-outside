"use client";

import Image from "next/image";
import Link from "next/link";
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
import { getEventImage, type Category, type EventItem, type Organizer, type TicketType } from "@gooutside/demo-data";
import type { EventSignal } from "./HomeEventCard";

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
    <div className="rounded-[20px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{ticketType.name}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{ticketType.remainingLabel}</p>
        </div>
        <span className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
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
  return (
    <AnimatePresence>
      {event && organizer && signal ? (
        <>
          <motion.button
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-[color:var(--home-overlay)]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />

          <motion.aside
            animate={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
            className={`fixed z-[60] overflow-hidden border border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] shadow-[var(--home-shadow-strong)] ${
              isDesktop
                ? "inset-y-4 right-4 w-[440px] rounded-[32px]"
                : "inset-x-0 bottom-0 max-h-[88vh] rounded-t-[32px]"
            }`}
            exit={isDesktop ? { opacity: 0, x: 36 } : { opacity: 0, y: 36 }}
            initial={isDesktop ? { opacity: 0, x: 36 } : { opacity: 0, y: 36 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-full flex-col">
              <div className="relative h-[220px] shrink-0">
                <Image
                  alt={event.title}
                  className="object-cover"
                  fill
                  sizes={isDesktop ? "440px" : "100vw"}
                  src={getEventImage(undefined, event.categorySlug)}
                />
                <div className="absolute inset-0 bg-[image:var(--home-image-scrim)]" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[color:var(--home-chip-border)] bg-[color:var(--home-chip-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--home-chip-text)] backdrop-blur">
                      Peek panel
                    </span>
                    <span className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)] backdrop-blur">
                      {category.name}
                    </span>
                  </div>

                  <button
                    aria-label="Close preview"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--home-action-border)] bg-[color:var(--home-action-bg)] text-[color:var(--home-action-text)] backdrop-blur transition hover:bg-[color:var(--home-action-bg-hover)]"
                    onClick={onClose}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                    {event.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-4xl italic leading-none tracking-[-0.03em] text-[color:var(--hero-fg)]">
                    {event.title}
                  </h3>
                  <p className="mt-3 max-w-[36ch] text-sm leading-6 text-[color:var(--hero-fg-muted)]">{event.shortDescription}</p>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CalendarDots size={16} />
                      <span>
                        {event.dateLabel} · {event.timeLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <MapPin size={16} />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <UsersThree size={16} />
                      <span>{signal.ticker}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <BellSimple size={16} />
                      <span>{signal.urgency}</span>
                    </div>
                  </div>
                </div>

                <section>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                    Why it is moving
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{event.description}</p>
                </section>

                <section className="rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Friends going</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{signal.momentum}</p>
                    </div>
                    <div className="flex items-center">
                      {signal.friends.map((friend, index) => (
                        <span
                          key={friend.name}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--home-avatar-border)] bg-[color:var(--home-avatar-bg)] text-xs font-semibold text-[var(--text-primary)] ${
                            index === 0 ? "" : "-ml-2"
                          }`}
                          title={friend.name}
                        >
                          {friend.initials}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                    Ticket options
                  </p>
                  <div className="mt-3 space-y-3">
                    {event.ticketTypes.map((ticketType) => (
                      <TicketRow key={ticketType.name} ticketType={ticketType} />
                    ))}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{organizer.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{organizer.tag}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    {organizer.followersLabel} · {organizer.eventsLabel}
                  </p>
                </section>
              </div>

              <div className="border-t border-[color:var(--home-border)] p-5">
                <div className="flex gap-3">
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)]"
                    onClick={onSave}
                    type="button"
                  >
                    <HeartStraight size={18} weight={isSaved ? "fill" : "regular"} />
                    {isSaved ? "Saved for later" : "Save event"}
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]"
                    onClick={onDismiss}
                    type="button"
                  >
                    Pass
                  </button>
                </div>

                <div className="mt-3 flex gap-3">
                  <Link
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
                    href={`/events/${event.slug}`}
                  >
                    View details
                    <CaretRight size={16} />
                  </Link>
                  <Link
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-5 py-3 text-sm font-semibold text-[var(--brand)]"
                    href={`/events/${event.slug}`}
                  >
                    <Ticket size={16} />
                    Get ticket
                  </Link>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default EventPeekPanel;
