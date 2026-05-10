"use client";

import { useTransition } from "react";
import { refundTicket } from "../../app/tickets/actions";
import { AdminBtn } from "../AdminBtn";

export function RefundButton({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <AdminBtn
      variant="danger"
      isPending={isPending}
      pendingLabel="Refunding…"
      onClick={() => {
        if (confirm("Mark this ticket as refunded?")) {
          startTransition(() => refundTicket(ticketId));
        }
      }}
    >
      Refund
    </AdminBtn>
  );
}
