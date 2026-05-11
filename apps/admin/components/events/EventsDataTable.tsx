"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { AdminDataTable, BulkAction, RowAction } from "../admin/table/AdminDataTable"
import { MiniPill, AvatarStack } from "../dashboard-primitives"
import { publishEvent, toggleFeature } from "../../app/events/actions"

export type EventRow = {
  id: string
  title: string
  slug: string | null
  status: string
  start_datetime: string | null
  tickets_sold: number | null
  total_capacity: number | null
  is_featured: boolean | null
  is_landmark: boolean | null
  is_sponsored: boolean | null
  categories: { name: string } | null
  organizer: { first_name: string | null; last_name: string | null } | null
}

type AccentTone = "brand" | "amber" | "coral" | "violet" | "cyan"

function statusTone(status: string): AccentTone {
  switch (status) {
    case "published": return "brand"
    case "draft": return "amber"
    case "cancelled": return "coral"
    default: return "violet"
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function OrganizerCell({ organizer }: { organizer: EventRow["organizer"] }) {
  const name = organizer
    ? [organizer.first_name, organizer.last_name].filter(Boolean).join(" ") || "Unknown"
    : "Unknown"
  return (
    <div className="flex items-center gap-2.5">
      <AvatarStack names={[name]} />
      <span className="font-medium text-[var(--text-primary)]">{name}</span>
    </div>
  )
}

const columns: ColumnDef<EventRow, any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomePageRowsSelected()
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="accent-[var(--brand)]"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="accent-[var(--brand)]"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
          {row.original.title}
        </span>
        {row.original.is_landmark && <MiniPill tone="amber">Landmark</MiniPill>}
        {row.original.is_sponsored && <MiniPill tone="violet">Sponsored</MiniPill>}
      </div>
    ),
  },
  {
    id: "organizer",
    header: "Organizer",
    accessorFn: (row) =>
      row.organizer
        ? [row.organizer.first_name, row.organizer.last_name].filter(Boolean).join(" ")
        : "Unknown",
    cell: ({ row }) => <OrganizerCell organizer={row.original.organizer} />,
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row) => row.categories?.name ?? "General",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">{getValue() as string}</span>
    ),
  },
  {
    id: "date",
    header: "Date",
    accessorFn: (row) => row.start_datetime ?? "",
    cell: ({ row }) => (
      <span className="text-[var(--text-secondary)]">
        {formatDate(row.original.start_datetime)}
      </span>
    ),
    sortingFn: "datetime",
  },
  {
    id: "tickets",
    header: "Tickets",
    accessorFn: (row) => row.tickets_sold ?? 0,
    cell: ({ row }) => (
      <span className="text-[var(--text-secondary)]">
        {row.original.tickets_sold ?? 0} / {row.original.total_capacity ?? "∞"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <MiniPill tone={statusTone(getValue() as string)}>
        {getValue() as string}
      </MiniPill>
    ),
  },
]

function useEventRowActions(): RowAction<EventRow>[] {
  const [, startTransition] = useTransition()

  return [
    {
      label: "View details",
      onClick: (row) => {
        window.open(`http://localhost:3000/events/${row.slug ?? row.id}`, "_blank")
      },
    },
    {
      label: "Copy event link",
      onClick: (row) => {
        navigator.clipboard.writeText(
          `${window.location.origin.replace("3001", "3000")}/events/${row.slug ?? row.id}`
        )
      },
    },
    {
      label: "Publish",
      hidden: (row) => row.status !== "draft",
      onClick: (row) => startTransition(() => publishEvent(row.id)),
    },
    {
      label: "Unpublish",
      hidden: (row) => row.status !== "published",
      variant: "warning",
      onClick: (row) =>
        startTransition(async () => {
          const { supabaseBrowser } = await import("../../lib/supabase-browser")
          await supabaseBrowser.from("events").update({ status: "draft" }).eq("id", row.id)
          window.location.reload()
        }),
    },
    {
      label: "Feature",
      hidden: (row) => row.is_featured === true,
      onClick: (row) => startTransition(() => toggleFeature(row.id, false)),
    },
    {
      label: "Unfeature",
      hidden: (row) => row.is_featured !== true,
      onClick: (row) => startTransition(() => toggleFeature(row.id, true)),
    },
    {
      label: "View tickets",
      onClick: (row) => {
        window.location.href = `/tickets?q=${encodeURIComponent(row.title)}`
      },
    },
  ]
}

type Props = {
  events: EventRow[]
  searchQuery?: string
}

export function EventsDataTable({ events, searchQuery }: Props) {
  const router = useRouter()
  const rowActions = useEventRowActions()

  const bulkActions: BulkAction<EventRow>[] = [
    {
      label: "Publish selected",
      variant: "primary",
      onClick: async (rows) => {
        const drafts = rows.filter((r) => r.status === "draft")
        await Promise.all(drafts.map((r) => publishEvent(r.id)))
      },
    },
    {
      label: "Feature selected",
      variant: "warning",
      onClick: async (rows) => {
        await Promise.all(rows.map((r) => toggleFeature(r.id, false)))
      },
    },
  ]

  return (
    <AdminDataTable
      data={events}
      columns={columns}
      bulkActions={bulkActions}
      rowActions={rowActions}
      getRowId={(row) => row.id}
      onRowClick={(row, e) => {
        // Middle-click or ctrl-click → new tab
        if (e.metaKey || e.ctrlKey || e.button === 1) {
          window.open(`/events/${row.id}`, "_blank")
        } else {
          router.push(`/events/${row.id}`)
        }
      }}
      emptyMessage={
        searchQuery ? `No events matching "${searchQuery}".` : "No events found."
      }
    />
  )
}
