import type { ReactNode } from "react";
import { cn } from "../lib/cn";

const toneClasses = {
  live: "border-[var(--status-live-border)] bg-[var(--status-live-bg)] text-[var(--status-live-text)]",
  pending: "border-[rgba(255,180,50,0.18)] bg-[rgba(255,180,50,0.12)] text-[var(--status-pending-text)]",
  review: "border-[rgba(232,93,138,0.2)] bg-[rgba(232,93,138,0.12)] text-[var(--status-review-text)]",
  free: "border-[rgba(74,122,232,0.2)] bg-[rgba(74,122,232,0.12)] text-[var(--blue)]",
  paid: "border-[rgba(232,93,138,0.2)] bg-[rgba(232,93,138,0.12)] text-[var(--pink)]",
  draft: "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof toneClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
