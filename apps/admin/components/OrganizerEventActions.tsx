"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getEventAttendees } from "../app/organizer/events/actions";

type Ticket = {
  id: string;
  status: string | null;
  purchase_price: number | null;
  checked_in_at: string | null;
  created_at: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  ticket_type: { name: string } | null;
};

export function OrganizerEventActions({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [attendees, setAttendees] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAttendees() {
    setOpen(true);
    if (attendees.length === 0) {
      startTransition(async () => {
        const result = await getEventAttendees(eventId);
        if (result.error) {
          setError(result.error);
        } else {
          setAttendees(result.data as Ticket[]);
        }
      });
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const checkedIn = attendees.filter((t) => t.checked_in_at).length;

  return (
    <>
      <div className="flex gap-2">
        <Link
          href={`/organizer/events/${eventId}/edit`}
          className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={openAttendees}
          className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
        >
          Attendees
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="relative mx-4 max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-cyan)]">Attendees</p>
                <h3 className="mt-1 font-display text-base font-semibold text-[var(--text-primary)]">{eventTitle}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Stats row */}
            {!isPending && attendees.length > 0 && (
              <div className="flex gap-4 border-b border-[var(--border-subtle)] px-6 py-3">
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Total tickets</p>
                  <p className="font-semibold text-[var(--text-primary)]">{attendees.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Checked in</p>
                  <p className="font-semibold text-[var(--brand)]">{checkedIn}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Remaining</p>
                  <p className="font-semibold text-[var(--text-primary)]">{attendees.length - checkedIn}</p>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
              {isPending && (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Loading attendees…</div>
              )}
              {error && (
                <div className="px-6 py-4 text-sm text-[var(--accent-coral)]">{error}</div>
              )}
              {!isPending && !error && attendees.length === 0 && (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">No tickets sold yet.</div>
              )}
              {!isPending && attendees.length > 0 && (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {attendees.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {t.attendee_name ?? t.attendee_email ?? "Unknown"}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {t.ticket_type?.name ?? "General"} · {t.created_at ? formatDate(t.created_at) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.purchase_price != null && (
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            GHS {t.purchase_price.toLocaleString()}
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            t.checked_in_at
                              ? "bg-[var(--status-live-bg)] text-[var(--status-live-text)]"
                              : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                          }`}
                        >
                          {t.checked_in_at ? "Checked in" : "Not checked in"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border-subtle)] px-6 py-3">
              <Link
                href={`/tickets?event=${eventId}`}
                className="text-xs font-semibold text-[var(--accent-cyan)] hover:underline"
              >
                View all in Tickets →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
