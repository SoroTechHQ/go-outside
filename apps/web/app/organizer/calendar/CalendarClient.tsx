"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight, Kanban, Plus } from "@phosphor-icons/react";
import type { CalendarEvent } from "./page";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLUMNS = [
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
  { key: "past", label: "Past" },
  { key: "archived", label: "Archived" },
] as const;

function eventStatus(e: CalendarEvent): string {
  if (e.status === "archived") return "archived";
  if (e.status !== "published") return "draft";
  if (e.startDatetime && new Date(e.startDatetime) < new Date()) return "past";
  return "published";
}

function statusChip(status: string) {
  const map: Record<string, string> = {
    published: "bg-[var(--brand)]/12 text-[var(--brand)]",
    draft: "bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
    past: "bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
    archived: "bg-rose-500/10 text-rose-400",
  };
  return map[status] ?? "bg-[var(--bg-muted)] text-[var(--text-tertiary)]";
}

function SoldBar({ sold, total }: { sold: number; total: number | null }) {
  if (!total) return null;
  const pct = Math.min(100, Math.round((sold / total) * 100));
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full bg-[var(--bg-muted)]">
        <div className="h-1 rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{pct}% sold</p>
    </div>
  );
}

function CalendarView({ events, year, month }: { events: CalendarEvent[]; year: number; month: number }) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDay.getDate();
  const cells = Array.from({ length: Math.ceil((startDow + totalDays) / 7) * 7 });

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const e of events) {
    if (!e.startDatetime) continue;
    const d = new Date(e.startDatetime);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(e);
    }
  }

  return (
    <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((_, idx) => {
          const day = idx - startDow + 1;
          const valid = day >= 1 && day <= totalDays;
          const dayEvents = valid ? (eventsByDay.get(day) ?? []) : [];
          const today = new Date();
          const isToday =
            valid &&
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          return (
            <div
              key={idx}
              className={`min-h-[80px] rounded-[14px] p-1.5 ${valid ? "bg-[var(--bg-elevated)]" : ""}`}
            >
              {valid && (
                <>
                  <p
                    className={`text-right text-[11px] font-semibold ${
                      isToday
                        ? "text-[var(--brand)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {isToday ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-black">
                        {day}
                      </span>
                    ) : (
                      day
                    )}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <Link
                        key={e.id}
                        className="block truncate rounded-[8px] bg-[var(--brand)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand)] hover:bg-[var(--brand)]/25 transition"
                        href={`/organizer/events/${e.id}`}
                        title={e.title}
                      >
                        {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px] text-[var(--text-tertiary)] pl-1.5">
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanView({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATUS_COLUMNS.map((col) => {
        const colEvents = events.filter((e) => eventStatus(e) === col.key);
        return (
          <div
            key={col.key}
            className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(5,12,8,0.08)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                {col.label}
              </p>
              <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                {colEvents.length}
              </span>
            </div>
            <div className="space-y-2 p-3">
              {colEvents.length === 0 ? (
                <p className="py-4 text-center text-[12px] text-[var(--text-tertiary)]">Empty</p>
              ) : (
                colEvents.map((e) => (
                  <Link
                    key={e.id}
                    className="block rounded-[14px] bg-[var(--bg-elevated)] p-3 transition hover:bg-[var(--bg-muted)]"
                    href={`/organizer/events/${e.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">
                        {e.title}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusChip(eventStatus(e))}`}>
                        {col.label}
                      </span>
                    </div>
                    {e.startDatetime && (
                      <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {new Date(e.startDatetime).toLocaleDateString("en-GH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    <SoldBar sold={e.ticketsSold} total={e.totalCapacity} />
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<"calendar" | "kanban">("calendar");

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthName = new Date(year, month, 1).toLocaleDateString("en-GH", { month: "long", year: "numeric" });

  return (
    <div className="p-5 md:p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Workspace
          </p>
          <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
            Content Calendar
          </h1>
        </div>
        <Link
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824]"
          href="/organizer/events/new"
        >
          <Plus size={14} weight="bold" />
          New Event
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            type="button"
            onClick={prevMonth}
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <p className="min-w-[160px] text-center text-[15px] font-semibold text-[var(--text-primary)]">
            {monthName}
          </p>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            type="button"
            onClick={nextMonth}
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
          <button
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              view === "calendar"
                ? "bg-[var(--brand)] text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            type="button"
            onClick={() => setView("calendar")}
          >
            <CalendarBlank size={13} />
            Calendar
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              view === "kanban"
                ? "bg-[var(--brand)] text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            type="button"
            onClick={() => setView("kanban")}
          >
            <Kanban size={13} />
            Kanban
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <CalendarView events={events} month={month} year={year} />
      ) : (
        <KanbanView events={events} />
      )}
    </div>
  );
}
