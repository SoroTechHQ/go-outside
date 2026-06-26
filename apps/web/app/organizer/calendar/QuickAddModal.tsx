"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarBlank, X } from "@phosphor-icons/react";

type Props = {
  date: Date | null;
  onClose: () => void;
};

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-GH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`;
}

export function QuickAddModal({ date, onClose }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  if (!date) return null;

  function goToWizard() {
    const dt = toDatetimeLocal(date!);
    router.push(`/organizer/events/new?startDate=${encodeURIComponent(dt)}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_24px_64px_rgba(5,12,8,0.2)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CalendarBlank size={16} className="text-[var(--brand)]" weight="fill" />
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              {formatDisplayDate(date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Create a new event starting on this date. You&apos;ll be able to set the time, location, tickets, and more in the next steps.
          </p>

          <div className="mt-5 flex gap-2">
            <button
              onClick={goToWizard}
              className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97]"
              type="button"
            >
              Create event
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
