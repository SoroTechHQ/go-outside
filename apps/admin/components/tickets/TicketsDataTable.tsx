"use client"

import { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { AdminDataTable, BulkAction, RowAction } from "../admin/table/AdminDataTable"
import { MiniPill } from "../dashboard-primitives"
import { refundTicket } from "../../app/tickets/actions"

export type TicketRow = {
  id: string
  status: string | null
  purchase_price: number | null
  checked_in_at: string | null
  created_at: string | null
  attendee_name: string | null
  attendee_email: string | null
  event: { title: string } | null
  ticket_type: { name: string } | null
}

function fmtGHS(n: number | null) {
  return `GHS ${(n ?? 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function ticketStatusTone(
  status: string | null
): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "active" || status === "used") return "brand"
  if (status === "refunded") return "cyan"
  if (status === "cancelled") return "coral"
  return "amber"
}

const columns: ColumnDef<TicketRow, any>[] = [
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
    id: "attendee",
    header: "Attendee",
    accessorFn: (row) =>
      row.attendee_name?.trim() || row.attendee_email || "—",
    cell: ({ row }) => {
      const name =
        row.original.attendee_name?.trim() ||
        row.original.attendee_email ||
        "—"
      return (
        <div>
          <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
            {name}
          </div>
          {row.original.attendee_email &&
            row.original.attendee_name?.trim() && (
              <div className="text-xs text-[var(--text-tertiary)]">
                {row.original.attendee_email}
              </div>
            )}
        </div>
      )
    },
  },
  {
    id: "event",
    header: "Event",
    accessorFn: (row) => row.event?.title ?? "—",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">
        {getValue() as string}
      </span>
    ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (row) => row.ticket_type?.name ?? "—",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">
        {getValue() as string}
      </span>
    ),
  },
  {
    id: "price",
    header: "Price",
    accessorFn: (row) => row.purchase_price ?? 0,
    cell: ({ row }) => (
      <span className="font-semibold text-[var(--text-primary)]">
        {fmtGHS(row.original.purchase_price)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <MiniPill tone={ticketStatusTone(getValue() as string)}>
        {(getValue() as string) ?? "unknown"}
      </MiniPill>
    ),
  },
  {
    id: "checked_in",
    header: "Checked In",
    accessorFn: (row) => row.checked_in_at ?? "",
    cell: ({ row }) => (
      <span className="text-[var(--text-tertiary)]">
        {row.original.checked_in_at
          ? new Date(row.original.checked_in_at).toLocaleString("en-GH")
          : "—"}
      </span>
    ),
    sortingFn: "datetime",
  },
  {
    id: "issued",
    header: "Issued",
    accessorFn: (row) => row.created_at ?? "",
    cell: ({ row }) => (
      <span className="text-[var(--text-tertiary)]">
        {row.original.created_at
          ? new Date(row.original.created_at).toLocaleDateString("en-GH")
          : "—"}
      </span>
    ),
    sortingFn: "datetime",
  },
]

function useTicketRowActions(): RowAction<TicketRow>[] {
  const [, startTransition] = useTransition()

  return [
    {
      label: "Copy ticket ID",
      onClick: (row) => navigator.clipboard.writeText(row.id),
    },
    {
      label: "Refund ticket",
      variant: "danger",
      hidden: (row) =>
        row.status === "refunded" || row.status === "cancelled",
      onClick: (row) => startTransition(() => refundTicket(row.id)),
    },
  ]
}

type Props = {
  tickets: TicketRow[]
  searchQuery?: string
}

export function TicketsDataTable({ tickets, searchQuery }: Props) {
  const rowActions = useTicketRowActions()

  const bulkActions: BulkAction<TicketRow>[] = [
    {
      label: "Refund selected",
      variant: "danger",
      onClick: async (rows) => {
        const refundable = rows.filter(
          (r) => r.status !== "refunded" && r.status !== "cancelled"
        )
        await Promise.all(refundable.map((r) => refundTicket(r.id)))
      },
    },
  ]

  return (
    <AdminDataTable
      data={tickets}
      columns={columns}
      bulkActions={bulkActions}
      rowActions={rowActions}
      getRowId={(row) => row.id}
      emptyMessage={
        searchQuery
          ? `No tickets matching "${searchQuery}".`
          : "No tickets found."
      }
    />
  )
}
