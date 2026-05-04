"use client";

import { useTransition } from "react";
import Link from "next/link";
import { publishEvent, toggleFeature } from "../app/events/actions";
import { MiniPill } from "./dashboard-primitives";

type EventActionsRowProps = {
  id: string;
  slug: string;
  status: string;
  isFeatured: boolean;
};

export function EventActionsRow({ id, slug, status, isFeatured }: EventActionsRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => publishEvent(id))}
          className="inline-flex items-center rounded-full border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)] transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isPending ? "Publishing…" : "Publish"}
        </button>
      )}
      <button
        disabled={isPending}
        onClick={() => startTransition(() => toggleFeature(id, isFeatured))}
        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-80 disabled:opacity-50 ${
          isFeatured
            ? "border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.1)] text-[var(--accent-cyan)]"
            : "border-[rgba(255,255,255,0.08)] bg-transparent text-[var(--text-tertiary)]"
        }`}
      >
        {isFeatured ? "Featured" : "Feature"}
      </button>
      <Link
        href={`http://localhost:3000/events/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MiniPill tone="violet">View</MiniPill>
      </Link>
    </div>
  );
}
