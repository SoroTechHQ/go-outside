"use client";

import { useTransition } from "react";
import { dismissQueueItem, closeReport } from "../../app/moderation/actions";
import { AdminBtn } from "../AdminBtn";

export function DismissQueueItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <AdminBtn
      variant="ghost"
      isPending={isPending}
      pendingLabel="Dismissing…"
      onClick={() => startTransition(() => dismissQueueItem(id))}
    >
      Dismiss
    </AdminBtn>
  );
}

export function CloseReportButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <AdminBtn
      variant="warning"
      isPending={isPending}
      pendingLabel="Closing…"
      onClick={() => startTransition(() => closeReport(id))}
    >
      Close report
    </AdminBtn>
  );
}
