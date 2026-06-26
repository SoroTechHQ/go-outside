"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwise,
  CheckCircle,
  DownloadSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  Ticket,
  UsersThree,
  XCircle,
} from "@phosphor-icons/react";
import { MessageAttendeesModal } from "../_components/MessageAttendeesModal";
import { AttendeeDrawer } from "./AttendeeDrawer";

type Attendee = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  username: string | null;
  status: string;
  checkedInAt: string | null;
  purchasedAt: string;
  ticketTier: string;
  purchasePrice: number;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string | null;
};

type EventFilter = {
  id: string;
  title: string;
  date: string | null;
};

type Props = {
  attendees: Attendee[];
  stats: { total: number; checkedIn: number; confirmed: number; cancelled: number; revenue: number };
  events: EventFilter[];
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  confirmed:  { label: "Confirmed",  cls: "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20" },
  checked_in: { label: "Checked In", cls: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
  cancelled:  { label: "Cancelled",  cls: "bg-red-500/10 text-red-500 border border-red-500/20" },
  refunded:   { label: "Refunded",   cls: "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]" },
  pending:    { label: "Pending",    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(s: string | null) {
  if (!s) return "No date";
  return new Date(s).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

function formatMoney(n: number) {
  if (n === 0) return "Free";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/12 text-[var(--brand)]"
      style={{ width: size, height: size, fontSize: size * 0.34 + "px", fontWeight: 700 }}
    >
      {initials || "?"}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: typeof UsersThree; iconColor: string;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{label}</p>
          <p className="mt-1.5 text-[24px] font-black tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: `color-mix(in srgb, ${iconColor} 12%, transparent)` }}>
          <Icon size={18} weight="duotone" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

export function AttendeesClient({ attendees: initialAttendees, stats, events }: Props) {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [messageModal, setMessageModal] = useState(false);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);

  // Local overrides for optimistic check-in state (status + checkedInAt)
  const [checkInOverrides, setCheckInOverrides] = useState<Record<string, { status: string; checkedInAt: string | null }>>({});

  const STATUS_TABS = ["all", "confirmed", "checked_in", "cancelled"] as const;
  const STATUS_TAB_LABELS: Record<string, string> = {
    all: "All", confirmed: "Confirmed", checked_in: "Checked In", cancelled: "Cancelled",
  };

  // Merge server data with local overrides
  const attendees = useMemo(() =>
    initialAttendees.map((a) => {
      const override = checkInOverrides[a.id];
      if (!override) return a;
      return { ...a, status: override.status, checkedInAt: override.checkedInAt };
    }),
    [initialAttendees, checkInOverrides]
  );

  const filtered = useMemo(() => {
    let list = attendees;
    if (eventFilter !== "all") list = list.filter((a) => a.eventId === eventFilter);
    if (statusFilter !== "all") {
      if (statusFilter === "cancelled") {
        list = list.filter((a) => ["cancelled", "refunded"].includes(a.status));
      } else {
        list = list.filter((a) => a.status === statusFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.eventTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [attendees, eventFilter, statusFilter, search]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === eventFilter),
    [events, eventFilter]
  );

  const selectedEventAttendeeCount = useMemo(
    () => eventFilter === "all"
      ? stats.total
      : initialAttendees.filter((a) => a.eventId === eventFilter).length,
    [initialAttendees, eventFilter, stats.total]
  );

  const checkInRate = stats.total > 0
    ? Math.round((stats.checkedIn / stats.total) * 100)
    : 0;

  // The drawer attendee — always derived from latest merged list
  const drawerAttendee = useMemo(
    () => attendees.find((a) => a.id === selectedAttendeeId) ?? null,
    [attendees, selectedAttendeeId]
  );

  function handleCheckInToggle(ticketId: string, checkedIn: boolean, checkedInAt: string | null) {
    setCheckInOverrides((prev) => ({
      ...prev,
      [ticketId]: {
        status: checkedIn ? "checked_in" : "confirmed",
        checkedInAt,
      },
    }));
    // Refresh server data in the background so stats update
    router.refresh();
  }

  const exportCSV = useCallback(() => {
    const headers = ["Name", "Email", "Event", "Event Date", "Ticket Tier", "Status", "Purchased", "Amount (GHS)"];
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.eventTitle,
      formatShortDate(a.eventDate),
      a.ticketTier,
      STATUS_META[a.status]?.label ?? a.status,
      formatDate(a.purchasedAt),
      a.purchasePrice,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendees-${eventFilter === "all" ? "all-events" : (selectedEvent?.title ?? "event").replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, eventFilter, selectedEvent]);

  return (
    <>
      <div className="min-h-full px-5 py-6 md:px-8">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <UsersThree size={22} weight="duotone" className="text-[var(--brand)]" />
              <h1 className="text-[22px] font-black tracking-[-0.3px] text-[var(--text-primary)]">Attendees</h1>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
              {stats.total} {stats.total === 1 ? "person" : "people"} across {events.length} {events.length === 1 ? "event" : "events"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMessageModal(true)}
              disabled={eventFilter === "all"}
              title={eventFilter === "all" ? "Select a specific event to message attendees" : undefined}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PaperPlaneTilt size={13} weight="fill" /> Message
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
            >
              <DownloadSimple size={13} weight="bold" /> Export
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={UsersThree} iconColor="var(--brand)" />
          <StatCard label="Checked In" value={stats.checkedIn} sub={`${checkInRate}% check-in rate`} icon={CheckCircle} iconColor="#3b82f6" />
          <StatCard label="Confirmed" value={stats.confirmed} sub="Not yet checked in" icon={Ticket} iconColor="var(--brand)" />
          <StatCard label="Revenue" value={formatMoney(stats.revenue)} icon={ArrowsClockwise} iconColor="#8b5cf6" />
        </div>

        {/* Filters */}
        <div className="mb-5 space-y-3">
          {events.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEventFilter("all")}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  eventFilter === "all"
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
                }`}
              >
                All events
              </button>
              {events.slice(0, 5).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setEventFilter(ev.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                    eventFilter === ev.id
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
                  }`}
                >
                  {ev.title}
                  {ev.date && (
                    <span className="ml-1.5 opacity-60">{formatShortDate(ev.date)}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2.5 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 sm:w-[280px]"
              />
            </div>
            <div className="flex items-center gap-1 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-[9px] px-3 py-1.5 text-[12px] font-semibold transition ${
                    statusFilter === tab
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {STATUS_TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendee list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--bg-elevated)]">
              <UsersThree size={26} weight="duotone" className="text-[var(--text-tertiary)]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
              {stats.total === 0 ? "No attendees yet" : "No results"}
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              {stats.total === 0
                ? "Ticket holders will appear here once people purchase tickets."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-[var(--text-tertiary)]">
              Showing {filtered.length} of {attendees.length} · Click a row to view profile
            </p>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-[16px] border border-[var(--border-subtle)] md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    {["Attendee", "Event", "Ticket", "Status", "Purchased"].map((col) => (
                      <th key={col} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filtered.map((a) => {
                    const meta = STATUS_META[a.status] ?? STATUS_META.confirmed!;
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAttendeeId(a.id)}
                        className="cursor-pointer bg-[var(--bg-card)] transition hover:bg-[var(--bg-elevated)]"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={a.name} avatarUrl={a.avatarUrl} size={34} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{a.name}</p>
                              <p className="truncate text-[11px] text-[var(--text-tertiary)]">{a.email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="max-w-[180px] truncate text-[13px] text-[var(--text-primary)]">{a.eventTitle}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)]">{formatShortDate(a.eventDate)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                            {a.ticketTier}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}>
                            {a.status === "checked_in"
                              ? <CheckCircle size={11} weight="fill" />
                              : a.status === "cancelled"
                              ? <XCircle size={11} weight="fill" />
                              : null}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-[var(--text-tertiary)]">
                          {formatDate(a.purchasedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((a) => {
                const meta = STATUS_META[a.status] ?? STATUS_META.confirmed!;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAttendeeId(a.id)}
                    className="flex w-full items-start gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-left transition active:scale-[0.98]"
                  >
                    <Avatar name={a.name} avatarUrl={a.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{a.name}</p>
                          <p className="truncate text-[11px] text-[var(--text-tertiary)]">{a.email || "—"}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                          {a.status === "checked_in" ? <CheckCircle size={10} weight="fill" /> : null}
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1">
                          <Ticket size={10} weight="fill" className="text-[var(--brand)]" />
                          {a.ticketTier}
                        </span>
                        <span className="truncate max-w-[120px]">{a.eventTitle}</span>
                        <span>{formatShortDate(a.eventDate)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Message modal */}
        {selectedEvent && (
          <MessageAttendeesModal
            isOpen={messageModal}
            onClose={() => setMessageModal(false)}
            eventId={selectedEvent.id}
            eventName={selectedEvent.title}
            attendeeCount={selectedEventAttendeeCount}
          />
        )}
      </div>

      {/* Attendee drawer — outside the scroll container so it overlays correctly */}
      <AttendeeDrawer
        attendee={drawerAttendee}
        onClose={() => setSelectedAttendeeId(null)}
        onCheckInToggle={handleCheckInToggle}
      />
    </>
  );
}
