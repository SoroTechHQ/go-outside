"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowSquareOut,
  CalendarBlank,
  CalendarCheck,
  ChatTeardrop,
  CheckCircle,
  CurrencyCircleDollar,
  Ticket,
  X,
  XCircle,
} from "@phosphor-icons/react";

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

type Props = {
  attendee: Attendee | null;
  onClose: () => void;
  onCheckInToggle: (ticketId: string, checkedIn: boolean, checkedInAt: string | null) => void;
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

function formatDateTime(s: string) {
  return new Date(s).toLocaleString("en-GH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatMoney(n: number) {
  if (n === 0) return "Free";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-3 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] mt-0.5">{label}</span>
      <span className="text-right text-[13px] font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export function AttendeeDrawer({ attendee, onClose, onCheckInToggle }: Props) {
  const [checkingIn, setCheckingIn] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const isOpen = attendee !== null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  async function toggleCheckIn() {
    if (!attendee) return;
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/organizer/attendees/${attendee.id}/check-in`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json() as { checkedIn: boolean; checkedInAt: string | null };
      onCheckInToggle(attendee.id, data.checkedIn, data.checkedInAt);
    } finally {
      setCheckingIn(false);
    }
  }

  const initials = attendee
    ? attendee.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "";

  const meta = attendee ? (STATUS_META[attendee.status] ?? STATUS_META.confirmed!) : null;
  const isCheckedIn = attendee?.status === "checked_in";

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={attendee ? `${attendee.name} — attendee details` : "Attendee details"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-[var(--bg-card)] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {attendee && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Attendee profile</p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile section */}
              <div className="flex flex-col items-center px-6 pb-5 pt-7">
                {attendee.avatarUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--border-subtle)]">
                    <Image src={attendee.avatarUrl} alt={attendee.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand)]/12 text-[var(--brand)] text-[28px] font-black">
                    {initials || "?"}
                  </div>
                )}
                <h2 className="mt-4 text-[18px] font-bold text-[var(--text-primary)]">{attendee.name}</h2>
                {attendee.username && (
                  <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">@{attendee.username}</p>
                )}
                <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">{attendee.email}</p>

                {/* Status pill */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${meta?.cls ?? ""}`}>
                    {isCheckedIn
                      ? <CheckCircle size={13} weight="fill" />
                      : attendee.status === "cancelled"
                      ? <XCircle size={13} weight="fill" />
                      : null}
                    {meta?.label ?? attendee.status}
                    {isCheckedIn && attendee.checkedInAt && (
                      <span className="font-normal opacity-75">· {formatDateTime(attendee.checkedInAt)}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-[var(--border-subtle)] px-5 py-2">
                <Row
                  label="Event"
                  value={
                    <span className="max-w-[200px] truncate block text-right">{attendee.eventTitle}</span>
                  }
                />
                {attendee.eventDate && (
                  <Row
                    label="Event date"
                    value={
                      <span className="flex items-center gap-1.5">
                        <CalendarBlank size={13} className="text-[var(--brand)]" />
                        {formatDate(attendee.eventDate)}
                      </span>
                    }
                  />
                )}
                <Row
                  label="Ticket tier"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Ticket size={13} className="text-[var(--brand)]" />
                      {attendee.ticketTier}
                    </span>
                  }
                />
                <Row
                  label="Paid"
                  value={
                    <span className="flex items-center gap-1.5">
                      <CurrencyCircleDollar size={13} className="text-[var(--brand)]" />
                      {formatMoney(attendee.purchasePrice)}
                    </span>
                  }
                />
                <Row label="Purchased" value={formatDate(attendee.purchasedAt)} />
                {isCheckedIn && attendee.checkedInAt && (
                  <Row
                    label="Checked in"
                    value={
                      <span className="flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-blue-500" />
                        {formatDateTime(attendee.checkedInAt)}
                      </span>
                    }
                  />
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 px-5 py-4">
                {/* Check-in toggle */}
                <button
                  type="button"
                  onClick={toggleCheckIn}
                  disabled={checkingIn || ["cancelled", "refunded"].includes(attendee.status)}
                  className={`flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[14px] font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
                    isCheckedIn
                      ? "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-red-500/30 hover:text-red-500"
                      : "bg-[var(--brand)] text-black hover:bg-[#4fa824]"
                  }`}
                >
                  {isCheckedIn
                    ? <XCircle size={16} weight="fill" />
                    : <CheckCircle size={16} weight="fill" />}
                  {checkingIn
                    ? "Updating…"
                    : isCheckedIn
                    ? "Undo check-in"
                    : "Mark as checked in"}
                </button>

                {/* Secondary actions row */}
                <div className="grid grid-cols-2 gap-2.5">
                  {attendee.username && (
                    <a
                      href={`/go/${attendee.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2.5 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                      View profile
                    </a>
                  )}
                  <a
                    href="/dashboard/messages"
                    className="flex items-center justify-center gap-1.5 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2.5 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
                  >
                    <ChatTeardrop size={13} weight="fill" />
                    Message
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
