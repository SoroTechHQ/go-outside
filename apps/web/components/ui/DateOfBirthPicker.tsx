"use client";

import { useMemo } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

const selectCls = [
  "w-full appearance-none rounded-[12px] border px-4 py-3",
  "text-[14px] outline-none transition cursor-pointer",
  "bg-[var(--ob-input-bg)] border-[var(--ob-input-border)]",
  "text-[var(--ob-input-text)] placeholder-[var(--ob-input-placeholder)]",
  "focus:border-[var(--ob-input-focus-border)] focus:ring-1 focus:ring-[var(--ob-input-focus-ring)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
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

  // Parse current value
  const [yearStr, monthStr, dayStr] = value ? value.split("-") : ["", "", ""];
  const year  = yearStr  ? parseInt(yearStr,  10) : 0;
  const month = monthStr ? parseInt(monthStr, 10) : 0;  // 1-based
  const day   = dayStr   ? parseInt(dayStr,   10) : 0;

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = resolvedMaxYear; y >= resolvedMinYear; y--) arr.push(y);
    return arr;
  }, [resolvedMinYear, resolvedMaxYear]);

  const days = useMemo(() => {
    const count = daysInMonth(month, year);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [month, year]);

  function build(nextYear: number, nextMonth: number, nextDay: number) {
    if (!nextYear || !nextMonth || !nextDay) return "";
    const maxDay = daysInMonth(nextMonth, nextYear);
    const clampedDay = Math.min(nextDay, maxDay);
    return [
      String(nextYear),
      String(nextMonth).padStart(2, "0"),
      String(clampedDay).padStart(2, "0"),
    ].join("-");
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Month */}
      <div className="relative">
        <select
          className={selectCls}
          value={month || ""}
          onChange={(e) => onChange(build(year, Number(e.target.value), day))}
          aria-label="Month"
        >
          <option value="" disabled>Month</option>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>

      {/* Day */}
      <div className="relative">
        <select
          className={selectCls}
          value={day || ""}
          onChange={(e) => onChange(build(year, month, Number(e.target.value)))}
          aria-label="Day"
        >
          <option value="" disabled>Day</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div className="relative">
        <select
          className={selectCls}
          value={year || ""}
          onChange={(e) => onChange(build(Number(e.target.value), month, day))}
          aria-label="Year"
        >
          <option value="" disabled>Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
