"use client";

import { useTransition } from "react";
import { dismissQueueItem, closeReport } from "../../app/moderation/actions";

export function DismissQueueItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(() => dismissQueueItem(id));
      }}
      className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-40"
    >
      {isPending ? "Dismissing…" : "Dismiss"}
    </button>
  );
}

export function CloseReportButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(() => closeReport(id));
      }}
      className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-40"
    >
      {isPending ? "Closing…" : "Close"}
    </button>
  );
}
