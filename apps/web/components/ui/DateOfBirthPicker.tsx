"use client";

import { useState, useEffect, useMemo } from "react";
import { CaretDown } from "@phosphor-icons/react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

const wrapCls = "relative w-full";
const selectCls = [
  "w-full rounded-[12px] border px-4 py-3 pr-9",
  "text-[14px] outline-none transition cursor-pointer",
  "bg-[var(--ob-input-bg)] border-[var(--ob-input-border)]",
  "text-[var(--ob-input-text)]",
  "focus:border-[var(--ob-input-focus-border)] focus:ring-1 focus:ring-[var(--ob-input-focus-ring)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  // suppress native appearance so we can use our own caret
  "[appearance:none] [-webkit-appearance:none] [-moz-appearance:none]",
].join(" ");

type Props = {
  value: string;          // YYYY-MM-DD or empty string
  onChange: (v: string) => void;
  minYear?: number;
  maxYear?: number;
};

export function DateOfBirthPicker({ value, onChange, minYear, maxYear }: Props) {
  const now = new Date();
  const resolvedMinYear = minYear ?? now.getFullYear() - 120;
  const resolvedMaxYear = maxYear ?? now.getFullYear() - 13;

  // Internal state — tracks partial selections independently
  const [month, setMonth] = useState(0);  // 1-based, 0 = unset
  const [day,   setDay]   = useState(0);
  const [year,  setYear]  = useState(0);

  // Sync inward when the parent passes a full date (e.g. draft recovery)
  useEffect(() => {
    if (!value) return;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0]!, 10);
      const m = parseInt(parts[1]!, 10);
      const d = parseInt(parts[2]!, 10);
      if (y) setYear(y);
      if (m) setMonth(m);
      if (d) setDay(d);
    }
  }, [value]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = resolvedMaxYear; y >= resolvedMinYear; y--) arr.push(y);
    return arr;
  }, [resolvedMinYear, resolvedMaxYear]);

  const days = useMemo(() => {
    const count = daysInMonth(month, year);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [month, year]);

  function emit(nextYear: number, nextMonth: number, nextDay: number) {
    if (!nextYear || !nextMonth || !nextDay) {
      onChange("");
      return;
    }
    const maxDay = daysInMonth(nextMonth, nextYear);
    const clampedDay = Math.min(nextDay, maxDay);
    onChange([
      String(nextYear),
      String(nextMonth).padStart(2, "0"),
      String(clampedDay).padStart(2, "0"),
    ].join("-"));
    // Keep day in sync if it was clamped
    if (clampedDay !== nextDay) setDay(clampedDay);
  }

  function handleMonth(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = Number(e.target.value);
    setMonth(m);
    emit(year, m, day);
  }

  function handleDay(e: React.ChangeEvent<HTMLSelectElement>) {
    const d = Number(e.target.value);
    setDay(d);
    emit(year, month, d);
  }

  function handleYear(e: React.ChangeEvent<HTMLSelectElement>) {
    const y = Number(e.target.value);
    setYear(y);
    emit(y, month, day);
  }

  const caretCls =
    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ob-text-faint)]";

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Month */}
      <div className={wrapCls}>
        <select
          className={selectCls}
          value={month || ""}
          onChange={handleMonth}
          aria-label="Month"
        >
          <option value="" disabled>Month</option>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className={caretCls} />
      </div>

      {/* Day */}
      <div className={wrapCls}>
        <select
          className={selectCls}
          value={day || ""}
          onChange={handleDay}
          aria-label="Day"
        >
          <option value="" disabled>Day</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className={caretCls} />
      </div>

      {/* Year */}
      <div className={wrapCls}>
        <select
          className={selectCls}
          value={year || ""}
          onChange={handleYear}
          aria-label="Year"
        >
          <option value="" disabled>Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className={caretCls} />
      </div>
    </div>
  );
}
