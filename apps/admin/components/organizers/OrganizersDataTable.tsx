"use client"

import { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { AdminDataTable, RowAction } from "../admin/table/AdminDataTable"
import { MiniPill } from "../dashboard-primitives"
import {
  verifyOrganizer,
  suspendOrganizerProfile,
} from "../../app/organizers/actions"

export type OrganizerRow = {
  id: string
  organization_name: string | null
  status: string | null
  verified_at: string | null
  total_events: number | null
  total_revenue: number | null
  paystack_subaccount: string | null
  organizer: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    location_city: string | null
    is_active: boolean | null
  } | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const columns: ColumnDef<OrganizerRow, any>[] = [
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
    id: "organization",
    header: "Organisation",
    accessorFn: (row) => row.organization_name ?? "—",
    cell: ({ row }) => (
      <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
        {row.original.organization_name ?? "—"}
      </span>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    accessorFn: (row) =>
      row.organizer
        ? [row.organizer.first_name, row.organizer.last_name]
            .filter(Boolean)
            .join(" ")
        : "—",
    cell: ({ row }) => {
      const name = row.original.organizer
        ? [
            row.original.organizer.first_name,
            row.original.organizer.last_name,
          ]
            .filter(Boolean)
            .join(" ") || "Unknown"
        : "—"
      return (
        <div>
          <div className="text-sm text-[var(--text-primary)]">{name}</div>
          {row.original.organizer?.email && (
            <div className="text-xs text-[var(--text-tertiary)]">
              {row.original.organizer.email}
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "city",
    header: "City",
    accessorFn: (row) => row.organizer?.location_city ?? "—",
    cell: ({ getValue }) => (
      <span className="text-sm text-[var(--text-secondary)]">
        {getValue() as string}
      </span>
    ),
  },
  {
    id: "events",
    header: "Events",
    accessorFn: (row) => row.total_events ?? 0,
    cell: ({ getValue }) => (
      <span className="text-sm text-[var(--text-secondary)]">
        {getValue() as number}
      </span>
    ),
  },
  {
    id: "revenue",
    header: "Revenue",
    accessorFn: (row) => Number(row.total_revenue ?? 0),
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        {row.original.total_revenue != null
          ? `GHS ${Number(row.original.total_revenue).toLocaleString()}`
          : "—"}
      </span>
    ),
  },
  {
    id: "paystack",
    header: "Paystack",
    accessorFn: (row) => (row.paystack_subaccount ? 1 : 0),
    cell: ({ row }) => {
      const linked = !!row.original.paystack_subaccount
      return (
        <MiniPill tone={linked ? "brand" : "amber"}>
          {linked ? "Linked" : "Not linked"}
        </MiniPill>
      )
    },
  },
  {
    id: "verified",
    header: "Verified",
    accessorFn: (row) => row.verified_at ?? "",
    cell: ({ row }) => (
      <span className="text-sm text-[var(--text-secondary)]">
        {formatDate(row.original.verified_at)}
      </span>
    ),
    sortingFn: "datetime",
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status ?? "—",
    cell: ({ getValue }) => {
      const s = getValue() as string
      return (
        <MiniPill
          tone={
            s === "active" ? "brand" : s === "suspended" ? "coral" : "amber"
          }
        >
          {s}
        </MiniPill>
      )
    },
  },
]

function useOrganizerRowActions(): RowAction<OrganizerRow>[] {
  const [, startTransition] = useTransition()

  return [
    {
      label: "Verify",
      hidden: (row) =>
        row.status === "active" && !!row.verified_at,
      onClick: (row) => startTransition(() => verifyOrganizer(row.id)),
    },
    {
      label: "Suspend",
      variant: "danger",
      hidden: (row) => row.status === "suspended",
      onClick: (row) =>
        startTransition(() => suspendOrganizerProfile(row.id)),
    },
    {
      label: "View events",
      onClick: (row) => {
        window.location.href = `/events?q=${encodeURIComponent(
          row.organization_name ?? ""
        )}`
      },
    },
  ]
}

type Props = {
  organizers: OrganizerRow[]
  searchQuery?: string
}

export function OrganizersDataTable({ organizers, searchQuery }: Props) {
  const rowActions = useOrganizerRowActions()

  return (
    <AdminDataTable
      data={organizers}
      columns={columns}
      rowActions={rowActions}
      getRowId={(row) => row.id}
      emptyMessage={
        searchQuery
          ? `No organizers matching "${searchQuery}".`
          : "No organizer profiles found."
      }
    />
  )
}
