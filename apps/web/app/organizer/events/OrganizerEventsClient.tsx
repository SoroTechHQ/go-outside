"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowSquareOut,
  List,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  Ticket,
} from "@phosphor-icons/react";
import EventCardMini from "../_components/EventCardMini";
import type { OrganizerEventListItem } from "../_lib/dashboard";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

const STATUS_CLASSNAME: Record<string, string> = {
  live: "bg-[var(--brand)]/12 text-[var(--brand)]",
  draft: "bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
  sold: "bg-amber-500/12 text-amber-500",
};

function EventListRow({ event }: { event: OrganizerEventListItem }) {
  const statusClass = STATUS_CLASSNAME[event.statusTone] ?? STATUS_CLASSNAME.draft;
  return (
    <Link
      href={`/organizer/events/${event.id}`}
      className="flex items-center gap-4 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--brand)]/30 hover:shadow-[0_4px_20px_rgba(5,12,8,0.06)]"
    >
      {/* Date */}
      <div className="w-20 shrink-0">
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">{event.dateLabel}</p>
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.12em]">{event.category}</p>
      </div>

      {/* Title + venue */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{event.title}</p>
        <p className="mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">{event.venue}</p>
      </div>

      {/* Status */}
      <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${statusClass}`}>
        {event.statusLabel}
      </span>

      {/* Tickets */}
      <div className="hidden w-24 shrink-0 text-right md:block">
        <p className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
          {event.capacity ? `${event.sold}/${event.capacity}` : event.sold}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">tickets</p>
      </div>

      {/* Revenue */}
      <div className="hidden w-24 shrink-0 text-right lg:block">
        <p className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{formatMoney(event.revenue)}</p>
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">revenue</p>
      </div>

      <ArrowSquareOut size={14} className="shrink-0 text-[var(--text-tertiary)]" />
    </Link>
  );
}

export function OrganizerEventsClient({
  events,
  totalEvents,
}: {
  events: OrganizerEventListItem[];
  totalEvents: number;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div className="p-5 md:p-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Workspace</p>
          <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">My Events</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {totalEvents} event{totalEvents !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97]"
          href="/organizer/events/new"
        >
          <Plus size={15} weight="bold" />
          New Event
        </Link>
      </div>

      {/* Search + view toggle */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            placeholder="Search events by name, venue, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
          />
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              view === "list" ? "bg-[var(--brand)] text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              view === "grid" ? "bg-[var(--brand)] text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <SquaresFour size={15} />
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-16 text-center shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          {query ? (
            <>
              <MagnifyingGlass size={28} className="text-[var(--text-tertiary)]" weight="thin" />
              <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No events found</p>
              <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
                Try a different search term or clear the filter.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-[13px] font-semibold text-[var(--brand)]"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10">
                <Ticket size={24} className="text-[var(--brand)]" />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No events yet</p>
              <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
                Create your first event and start selling tickets on GoOutside.
              </p>
              <Link
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-[#4fa824]"
                href="/organizer/events/new"
              >
                <Plus size={15} weight="bold" />
                Create your first event
              </Link>
            </>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((event) => (
            <Link key={event.id} className="block" href={`/organizer/events/${event.id}`}>
              <EventCardMini {...event} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {/* List header */}
          <div className="hidden items-center gap-4 px-4 py-1 sm:flex">
            <div className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Date</div>
            <div className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Event</div>
            <div className="hidden w-20 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)] sm:block">Status</div>
            <div className="hidden w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)] md:block">Tickets</div>
            <div className="hidden w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)] lg:block">Revenue</div>
            <div className="w-4 shrink-0" />
          </div>
          {filtered.map((event) => (
            <EventListRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
