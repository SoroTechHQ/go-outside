"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowClockwise,
  MapPin,
  UserCircle,
  Users,
  Dot,
} from "@phosphor-icons/react";

type Attendee = {
  userId:    string;
  lat:       number;
  lng:       number;
  accuracy:  number | null;
  updatedAt: string;
  firstName: string | null;
  lastName:  string | null;
  avatarUrl: string | null;
  username:  string | null;
  email:     string | null;
};

type Event = {
  id:    string;
  title: string;
};

export function LiveAttendeesClient({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? "");
  const [attendees, setAttendees]             = useState<Attendee[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [lastUpdated, setLastUpdated]         = useState<Date | null>(null);

  const fetchAttendees = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/live?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json() as { total: number; attendees: Attendee[] };
        setAttendees(data.attendees);
        setLastUpdated(new Date());
      }
    } catch {/* silent */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAttendees(selectedEventId);
    const t = setInterval(() => fetchAttendees(selectedEventId), 15_000);
    return () => clearInterval(t);
  }, [selectedEventId, fetchAttendees]);

  const msSince = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) : null;

  return (
    <div className="space-y-6">
      {/* Event selector */}
      {events.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {events.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setSelectedEventId(ev.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedEventId === ev.id
                  ? "bg-[var(--brand)] text-white"
                  : "border border-[var(--home-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--home-border)] bg-[var(--bg-card)] px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Pulse dot */}
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--brand)]" />
          </div>
          <div>
            <p className="text-[1.6rem] font-bold text-[var(--text-primary)] tabular-nums">{attendees.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">people at venue right now</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          {msSince !== null && <span>Updated {msSince}s ago</span>}
          <button
            type="button"
            onClick={() => fetchAttendees(selectedEventId)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--home-border)] transition hover:bg-[var(--bg-surface)]"
          >
            <ArrowClockwise size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Attendee list */}
      {attendees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--home-border)] py-16">
          <Users size={40} className="text-[var(--text-tertiary)]" weight="thin" />
          <p className="mt-4 font-semibold text-[var(--text-secondary)]">No one broadcasting location yet</p>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Live map opens 3 hours before the event starts</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--home-border)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--home-border)] bg-[var(--bg-surface)]">
              <tr>
                <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Attendee</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Coordinates</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Last seen</th>
                <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--home-border)] bg-[var(--bg-card)]">
              {attendees.map((a) => {
                const name = [a.firstName, a.lastName].filter(Boolean).join(" ") || "Anonymous";
                const secsAgo = Math.floor((Date.now() - new Date(a.updatedAt).getTime()) / 1000);
                return (
                  <tr key={a.userId} className="transition hover:bg-[var(--bg-surface)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)]">
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[var(--brand)]">{name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{name}</p>
                          {a.username && <p className="text-xs text-[var(--text-tertiary)]">@{a.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--brand)] hover:underline"
                      >
                        <MapPin size={12} weight="fill" />
                        {a.lat.toFixed(5)}, {a.lng.toFixed(5)}
                      </a>
                      {a.accuracy && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">±{Math.round(a.accuracy)}m</p>}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/user/${a.userId}`}
                        className="rounded-lg border border-[var(--home-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      >
                        View profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
