"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight, Kanban, Plus, Ticket } from "@phosphor-icons/react";
import { QuickAddModal } from "./QuickAddModal";
import type { CalendarEvent } from "./page";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLUMNS = [
  { key: "draft",     label: "Draft",     accent: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { key: "published", label: "Live",      accent: "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/20" },
  { key: "past",      label: "Past",      accent: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  { key: "archived",  label: "Archived",  accent: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
] as const;

function eventStatus(e: CalendarEvent): string {
  if (e.status === "archived") return "archived";
  if (e.status !== "published") return "draft";
  if (e.startDatetime && new Date(e.startDatetime) < new Date()) return "past";
  return "published";
}

const STATUS_CHIP: Record<string, string> = {
  published: "bg-[var(--brand)]/15 text-[var(--brand)] hover:bg-[var(--brand)]/25",
  draft:     "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
  past:      "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25",
  archived:  "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25",
};

function SoldBar({ sold, total }: { sold: number; total: number | null }) {
  if (!total) return null;
  const pct = Math.min(100, Math.round((sold / total) * 100));
  return (
    <div className="mt-2 space-y-0.5">
      <div className="h-1 rounded-full bg-[var(--bg-muted)]">
        <div className="h-1 rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)]">{sold}/{total} sold</p>
    </div>
  );
}

function CalendarView({ events, year, month, onDayClick }: { events: CalendarEvent[]; year: number; month: number; onDayClick: (date: Date) => void }) {
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

  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] ${
              i >= 5 ? "text-[var(--brand)]/60" : "text-[var(--text-tertiary)]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border-subtle)]">
        {cells.map((_, idx) => {
          const day = idx - startDow + 1;
          const valid = day >= 1 && day <= totalDays;
          const dayEvents = valid ? (eventsByDay.get(day) ?? []) : [];
          const isToday =
            valid &&
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;
          const isWeekend = idx % 7 >= 5;

          return (
            <div
              key={idx}
              className={`group/cell min-h-[100px] p-2 ${
                !valid
                  ? "bg-[var(--bg-muted)]/30"
                  : isWeekend
                  ? "bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] cursor-pointer"
                  : "bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              }`}
              onClick={() => valid && onDayClick(new Date(year, month, day))}
            >
              {valid && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium text-[var(--text-tertiary)]/0 transition group-hover/cell:bg-[var(--brand)]/15 group-hover/cell:text-[var(--brand)]">
                      +
                    </span>
                    {isToday ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-black">
                        {day}
                      </span>
                    ) : (
                      <span className={`text-[12px] font-medium ${isWeekend ? "text-[var(--brand)]/50" : "text-[var(--text-tertiary)]"}`}>
                        {day}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const st = eventStatus(e);
                      return (
                        <Link
                          key={e.id}
                          href={`/organizer/events/${e.id}`}
                          className={`block truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium transition ${STATUS_CHIP[st] ?? STATUS_CHIP.draft}`}
                          title={e.title}
                        >
                          {e.title}
                        </Link>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="pl-1 text-[9px] font-medium text-[var(--text-tertiary)]">
                        +{dayEvents.length - 3} more
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
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          >
            {/* Column header */}
            <div className={`flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 ${col.accent} bg-opacity-50`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                {col.label}
              </p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tabular-nums">
                {colEvents.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-3">
              {colEvents.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
                  <Ticket size={18} className="text-[var(--text-tertiary)]" weight="thin" />
                  <p className="text-[11px] text-[var(--text-tertiary)]">No events</p>
                </div>
              ) : (
                colEvents.map((e) => (
                  <Link
                    key={e.id}
                    className="group block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 transition hover:border-[var(--brand)]/25 hover:shadow-[0_4px_16px_rgba(5,12,8,0.08)]"
                    href={`/organizer/events/${e.id}`}
                  >
                    <p className="text-[12px] font-semibold leading-snug text-[var(--text-primary)] transition group-hover:text-[var(--brand)]">
                      {e.title}
                    </p>
                    {e.startDatetime && (
                      <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                        {new Date(e.startDatetime).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(e.startDatetime).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}
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
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString("en-GH", { month: "long", year: "numeric" });
  const eventsThisMonth = events.filter((e) => {
    if (!e.startDatetime) return false;
    const d = new Date(e.startDatetime);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="space-y-5 p-5 md:p-7">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Workspace</p>
          <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">Content Calendar</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {eventsThisMonth.length} event{eventsThisMonth.length !== 1 ? "s" : ""} in {new Date(year, month).toLocaleDateString("en-GH", { month: "long" })}
          </p>
        </div>
        <Link
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97]"
          href="/organizer/events/new"
        >
          <Plus size={14} weight="bold" />
          New Event
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <CaretLeft size={13} weight="bold" />
          </button>
          <p className="min-w-[150px] text-center text-[14px] font-semibold text-[var(--text-primary)]">
            {monthName}
          </p>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <CaretRight size={13} weight="bold" />
          </button>
          {!isCurrentMonth && (
            <button
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              type="button"
              onClick={goToday}
            >
              Today
            </button>
          )}
        </div>

        {/* Status legend + view toggle */}
        <div className="flex items-center gap-3">
          {view === "calendar" && (
            <div className="hidden items-center gap-3 sm:flex">
              {STATUS_COLUMNS.map((col) => (
                <span key={col.key} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${col.accent}`}>
                  {col.label}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
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
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
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
      </div>

      {view === "calendar" ? (
        <CalendarView events={events} month={month} year={year} onDayClick={setQuickAddDate} />
      ) : (
        <KanbanView events={events} />
      )}

      <QuickAddModal date={quickAddDate} onClose={() => setQuickAddDate(null)} />
    </div>
  );
}
