"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { createPortal } from "react-dom";
import { CalendarBlank, Clock, X } from "@phosphor-icons/react";

import "react-datepicker/dist/react-datepicker.css";

function CalendarPortal(props: { children?: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(props.children ?? null, document.body);
}

/**
 * Converts a datetime-local string ("2025-06-14T19:00") ↔ JS Date.
 * React state elsewhere stores the ISO-like string that native inputs produce.
 */
function stringToDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateToString(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
};

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date…",
  minDate,
  maxDate,
  showTime = true,
  clearable = true,
  disabled = false,
  className = "",
}: Props) {
  const selected = stringToDate(value);
  const min = minDate ? stringToDate(minDate) : undefined;
  const max = maxDate ? stringToDate(maxDate) : undefined;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Calendar icon */}
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[var(--text-tertiary)]">
          {showTime ? <Clock size={15} /> : <CalendarBlank size={15} />}
        </span>

        <DatePicker
          selected={selected}
          onChange={(date: Date | null) => onChange(dateToString(date))}
          showTimeSelect={showTime}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={showTime ? "MMM d, yyyy · h:mm aa" : "MMM d, yyyy"}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={min ?? undefined}
          maxDate={max ?? undefined}
          popperPlacement="bottom-start"
          popperContainer={CalendarPortal}
          className="go-datepicker__input"
          calendarClassName="go-datepicker__calendar"
          wrapperClassName="go-datepicker__wrapper"
          isClearable={false}
        />

        {/* Clear button */}
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={11} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
