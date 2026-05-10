"use client";

import { useRef, useState, useTransition } from "react";
import { checkInTicket } from "../app/organizer/events/[id]/checkin/actions";

type RecentScan = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  checked_in_at: string | null;
};

export function CheckinClient({
  eventId,
  totalTickets,
  checkedInCount,
  initialScans,
}: {
  eventId: string;
  totalTickets: number;
  checkedInCount: number;
  initialScans: RecentScan[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; name?: string } | null>(null);
  const [checkedIn, setCheckedIn] = useState(checkedInCount);
  const [scans, setScans] = useState<RecentScan[]>(initialScans);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ref = inputRef.current?.value?.trim() ?? "";
    if (!ref) return;

    startTransition(async () => {
      const res = await checkInTicket(eventId, ref);
      setResult(res);
      if (res.success) {
        setCheckedIn((c) => c + 1);
        setScans((prev) => [
          {
            id: ref,
            attendee_name: res.name ?? null,
            attendee_email: null,
            checked_in_at: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
        if (inputRef.current) inputRef.current.value = "";
        setTimeout(() => setResult(null), 3000);
      }
    });
  }

  const pct = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

  function relTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: scanner + manual entry */}
      <div className="space-y-5">
        {/* QR scanner placeholder */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-[24px] border-2 border-[var(--brand)]/30 bg-[#0e1410]">
            <div className="absolute left-3 top-3 h-5 w-5 rounded-tl-[6px] border-l-2 border-t-2 border-[var(--neon)]" />
            <div className="absolute right-3 top-3 h-5 w-5 rounded-tr-[6px] border-r-2 border-t-2 border-[var(--neon)]" />
            <div className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-[6px] border-b-2 border-l-2 border-[var(--neon)]" />
            <div className="absolute bottom-3 right-3 h-5 w-5 rounded-br-[6px] border-b-2 border-r-2 border-[var(--neon)]" />
            <p className="px-8 text-center text-sm text-[var(--text-tertiary)]">
              Point camera at attendee QR code
              <br />
              <span className="text-[11px]">(camera access requires HTTPS)</span>
            </p>
          </div>
        </div>

        {/* Manual entry */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Manual entry
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Enter a ticket ID or attendee email address
          </p>

          {result?.success && (
            <div className="mt-3 rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
              ✓ {result.name} checked in successfully
            </div>
          )}
          {result?.error && (
            <div className="mt-3 rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[var(--accent-coral)]">
              {result.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ticket ID or email address"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[#0e1410] transition-opacity disabled:opacity-50"
            >
              {isPending ? "Checking in…" : "Check In"}
            </button>
          </form>
        </div>
      </div>

      {/* Right: progress + recent scans */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Check-in progress
          </p>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--text-primary)]">
            {checkedIn} / {totalTickets}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">attendees checked in</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--neon)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">{pct}% of ticket holders arrived</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Recent check-ins</h3>
          <div className="mt-4 space-y-3">
            {scans.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No check-ins yet.</p>
            ) : (
              scans.map((scan) => (
                <div
                  key={`${scan.id}-${scan.checked_in_at}`}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {scan.attendee_name ?? scan.attendee_email ?? "Attendee"}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {scan.checked_in_at ? relTime(scan.checked_in_at) : "just now"}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-[var(--status-live-border)] bg-[var(--status-live-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-live-text)]">
                    Checked in
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
