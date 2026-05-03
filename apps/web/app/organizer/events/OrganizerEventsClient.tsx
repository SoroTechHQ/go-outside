"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowSquareOut,
  Copy,
  DotsThreeVertical,
  List,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SquaresFour,
  Ticket,
  Trash,
  EyeSlash,
  Eye,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import EventCardMini from "../_components/EventCardMini";
import { ConfirmModal } from "../_components/ConfirmModal";
import { MessageAttendeesModal } from "../_components/MessageAttendeesModal";
import type { OrganizerEventListItem } from "../_lib/dashboard";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

const STATUS_PILL: Record<string, string> = {
  Live: "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30",
  Upcoming: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  Past: "bg-zinc-500/15 text-zinc-500 border border-zinc-500/30",
  Draft: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  "Sold Out": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Cancelled: "bg-red-500/15 text-red-500 border border-red-500/30",
};

type StatusFilter = "All" | "Live" | "Past" | "Draft" | "Sold Out";

const FILTER_TABS: StatusFilter[] = ["All", "Live", "Past", "Draft", "Sold Out"];

// --- Kebab menu ---
function KebabMenu({
  event,
  onDuplicate,
  onMessage,
  onDelete,
  onStatusChange,
}: {
  event: OrganizerEventListItem;
  onDuplicate: (id: string) => void;
  onMessage: (id: string, name: string, count: number) => void;
  onDelete: (id: string, sold: number) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isPublished = event.statusTone === "live" || event.statusTone === "sold";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        aria-label="Event actions"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-1 shadow-xl">
          <MenuItem
            icon={PencilSimple}
            label="Edit event"
            href={`/organizer/events/new?edit=${event.id}`}
            onClick={() => setOpen(false)}
          />
          <MenuItem
            icon={ArrowSquareOut}
            label="Preview public page"
            href={`/events/${event.slug}`}
            newTab
            onClick={() => setOpen(false)}
          />
          <MenuItem
            icon={PaperPlaneTilt}
            label="Message attendees"
            onClick={() => { setOpen(false); onMessage(event.id, event.title, event.sold); }}
          />
          <MenuItem
            icon={Copy}
            label="Duplicate as draft"
            onClick={() => { setOpen(false); onDuplicate(event.id); }}
          />

          <div className="my-1 border-t border-[var(--border-subtle)]" />

          {isPublished ? (
            <MenuItem
              icon={EyeSlash}
              label="Unpublish"
              onClick={() => { setOpen(false); onStatusChange(event.id, "draft"); }}
            />
          ) : event.statusLabel === "Draft" ? (
            <MenuItem
              icon={Eye}
              label="Publish"
              onClick={() => { setOpen(false); onStatusChange(event.id, "published"); }}
            />
          ) : null}

          <MenuItem
            icon={Trash}
            label="Delete event"
            destructive
            onClick={() => { setOpen(false); onDelete(event.id, event.sold); }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  href,
  newTab,
  destructive,
  onClick,
}: {
  icon: typeof PencilSimple;
  label: string;
  href?: string;
  newTab?: boolean;
  destructive?: boolean;
  onClick?: () => void;
}) {
  const cls = `flex w-full items-center gap-3 px-3.5 py-2 text-[13px] transition hover:bg-[var(--bg-muted)] ${
    destructive ? "text-red-500 hover:text-red-600" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  }`;

  if (href) {
    return (
      <Link
        className={cls}
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        onClick={onClick}
      >
        <Icon size={15} />
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      <Icon size={15} />
      {label}
    </button>
  );
}

// --- Event list row ---
function EventListRow({
  event,
  onDuplicate,
  onMessage,
  onDelete,
  onStatusChange,
}: {
  event: OrganizerEventListItem;
  onDuplicate: (id: string) => void;
  onMessage: (id: string, name: string, count: number) => void;
  onDelete: (id: string, sold: number) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const pillClass = STATUS_PILL[event.statusLabel] ?? STATUS_PILL.Draft;

  const isDraft = event.statusLabel === "Draft";

  return (
    <div className={`relative flex items-center gap-4 overflow-hidden rounded-[16px] border bg-[var(--bg-card)] px-4 py-3.5 transition hover:shadow-[0_4px_20px_rgba(5,12,8,0.06)] ${
      isDraft
        ? "border-dashed border-amber-500/25 opacity-80 hover:border-amber-500/40 hover:opacity-100"
        : "border-[var(--border-subtle)] hover:border-[var(--brand)]/30"
    }`}>
      {isDraft && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-amber-500/50" />
      )}
      <Link href={`/organizer/events/${event.id}`} className="flex flex-1 items-center gap-4 min-w-0">
        {/* Date */}
        <div className="w-20 shrink-0">
          <p className={`text-[11px] font-semibold ${isDraft ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"}`}>
            {event.dateLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.12em]">{event.category}</p>
        </div>

        {/* Title + venue */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-[14px] font-semibold ${isDraft ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
              {event.title}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-[var(--text-tertiary)]">{event.venue}</p>
        </div>

        {/* Status pill */}
        <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium sm:inline-flex ${pillClass}`}>
          {event.statusLabel}
        </span>

        {/* Tickets — hide for drafts */}
        <div className="hidden w-24 shrink-0 text-right md:block">
          {isDraft ? (
            <p className="text-[12px] italic text-[var(--text-tertiary)]">—</p>
          ) : (
            <>
              <p className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
                {event.capacity ? `${event.sold}/${event.capacity}` : event.sold}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">tickets</p>
            </>
          )}
        </div>

        {/* Revenue — hide for drafts */}
        <div className="hidden w-24 shrink-0 text-right lg:block">
          {isDraft ? (
            <p className="text-[12px] italic text-[var(--text-tertiary)]">—</p>
          ) : (
            <>
              <p className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{formatMoney(event.revenue)}</p>
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">revenue</p>
            </>
          )}
        </div>
      </Link>

      <KebabMenu
        event={event}
        onDuplicate={onDuplicate}
        onMessage={onMessage}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

// --- Main component ---
export function OrganizerEventsClient({
  events: initialEvents,
  totalEvents,
}: {
  events: OrganizerEventListItem[];
  totalEvents: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [events, setEvents] = useState(initialEvents);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; sold: number } | null>(null);
  const [messageTarget, setMessageTarget] = useState<{ id: string; name: string; count: number } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesQuery =
        !query.trim() ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.venue.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || e.statusLabel === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [events, query, statusFilter]);

  // Status counts for tabs
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: events.length };
    for (const e of events) {
      map[e.statusLabel] = (map[e.statusLabel] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/organizer/events/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    }
  }, [router]);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    setIsActionLoading(true);
    try {
      await fetch(`/api/organizer/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const newStatusLabel: OrganizerEventListItem["statusLabel"] =
            status === "published" ? "Live" : "Draft";
          return {
            ...e,
            statusLabel: newStatusLabel,
            statusTone: status === "published" ? "live" : "draft",
          } as OrganizerEventListItem;
        }),
      );
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        alert(data.message ?? data.error ?? "Failed to delete.");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setIsActionLoading(false);
      setDeleteTarget(null);
    }
  }, []);

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

      {/* Status filter tabs */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab] ?? 0;
          if (tab !== "All" && count === 0) return null;
          const active = statusFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-[var(--brand)] text-black"
                  : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-black/20 text-black" : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + view toggle */}
      <div className="mt-4 flex items-center gap-3">
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
          {query || statusFilter !== "All" ? (
            <>
              <MagnifyingGlass size={28} className="text-[var(--text-tertiary)]" weight="thin" />
              <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No events found</p>
              <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
                Try a different search term or filter.
              </p>
              <button
                type="button"
                onClick={() => { setQuery(""); setStatusFilter("All"); }}
                className="mt-4 text-[13px] font-semibold text-[var(--brand)]"
              >
                Clear filters
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
            {[
              { label: "Date", className: "w-20 shrink-0" },
              { label: "Event", className: "min-w-0 flex-1" },
              { label: "Status", className: "hidden w-20 shrink-0 text-right sm:block" },
              { label: "Tickets", className: "hidden w-24 shrink-0 text-right md:block" },
              { label: "Revenue", className: "hidden w-24 shrink-0 text-right lg:block" },
            ].map(({ label, className }) => (
              <div
                key={label}
                className={`${className} text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]`}
              >
                {label}
              </div>
            ))}
            <div className="w-8 shrink-0" />
          </div>

          {filtered.map((event) => (
            <EventListRow
              key={event.id}
              event={event}
              onDuplicate={handleDuplicate}
              onMessage={(id, name, count) => setMessageTarget({ id, name, count })}
              onDelete={(id, sold) => setDeleteTarget({ id, sold })}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.sold ? "Cannot delete this event" : "Delete this event?"}
        description={
          deleteTarget?.sold
            ? `This event has ${deleteTarget.sold} sold ticket${deleteTarget.sold !== 1 ? "s" : ""}. Unpublish or cancel it instead.`
            : "This action cannot be undone. The event page will be removed immediately."
        }
        confirmLabel={deleteTarget?.sold ? "Got it" : "Delete event"}
        cancelLabel={deleteTarget?.sold ? "Close" : "Cancel"}
        variant={deleteTarget?.sold ? "default" : "destructive"}
        isLoading={isActionLoading}
        onConfirm={deleteTarget?.sold ? () => setDeleteTarget(null) : () => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Message attendees */}
      <MessageAttendeesModal
        isOpen={Boolean(messageTarget)}
        onClose={() => setMessageTarget(null)}
        eventId={messageTarget?.id ?? ""}
        eventName={messageTarget?.name ?? ""}
        attendeeCount={messageTarget?.count ?? 0}
      />
    </div>
  );
}
