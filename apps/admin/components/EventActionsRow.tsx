"use client";

import { useTransition } from "react";
import { publishEvent, toggleFeature } from "../app/events/actions";
import { AdminBtn, AdminLinkBtn } from "./AdminBtn";

type EventActionsRowProps = {
  id: string;
  slug: string;
  status: string;
  isFeatured: boolean;
};

export function EventActionsRow({ id, slug, status, isFeatured }: EventActionsRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "draft" && (
        <AdminBtn
          variant="primary"
          isPending={isPending}
          pendingLabel="Publishing…"
          onClick={() => startTransition(() => publishEvent(id))}
        >
          Publish
        </AdminBtn>
      )}
      <AdminBtn
        variant={isFeatured ? "info" : "ghost"}
        isPending={isPending}
        onClick={() => startTransition(() => toggleFeature(id, isFeatured))}
      >
        {isFeatured ? "★ Featured" : "Feature"}
      </AdminBtn>
      <AdminLinkBtn
        variant="ghost"
        href={`http://localhost:3000/events/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View ↗
      </AdminLinkBtn>
    </div>
  );
}
