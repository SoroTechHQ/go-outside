"use client";

import { useTransition } from "react";
import { refundTicket } from "../../app/tickets/actions";

export function RefundButton({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("Mark this ticket as refunded?")) {
          startTransition(() => refundTicket(ticketId));
        }
      }}
      className="inline-flex items-center rounded-lg border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-coral)] transition hover:bg-[rgba(251,113,133,0.15)] disabled:opacity-40"
    >
      {isPending ? "Refunding…" : "Refund"}
    </button>
  );
}
