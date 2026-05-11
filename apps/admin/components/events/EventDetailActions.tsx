"use client"

import { useTransition } from "react"
import Link from "next/link"
import { AdminBtn, AdminLinkBtn } from "../AdminBtn"
import { publishEvent, toggleFeature } from "../../app/events/actions"

type Props = {
  id: string
  status: string
  isFeatured: boolean
  slug: string
}

export function EventDetailActions({ id, status, isFeatured, slug }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
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
        {isFeatured ? "★ Unfeature" : "Feature"}
      </AdminBtn>
      <AdminLinkBtn
        variant="ghost"
        href={`http://localhost:3000/events/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on site ↗
      </AdminLinkBtn>
    </div>
  )
}
