"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AdminDataTable, RowAction } from "../admin/table/AdminDataTable"
import { MiniPill } from "../dashboard-primitives"

export type TransactionRow = {
  id: string
  amount: number | null
  status: string | null
  payment_channel: string | null
  created_at: string | null
  buyer: { first_name: string | null; last_name: string | null } | null
  event: { title: string } | null
}

function fmtGHS(n: number | null) {
  return `GHS ${(n ?? 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function statusTone(
  status: string
): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "paid") return "brand"
  if (status === "pending") return "amber"
  if (status === "refunded") return "cyan"
  return "coral"
}

const columns: ColumnDef<TransactionRow, any>[] = [
  {
    id: "buyer",
    header: "Buyer",
    accessorFn: (row) =>
      row.buyer
        ? [row.buyer.first_name, row.buyer.last_name]
            .filter(Boolean)
            .join(" ") || "—"
        : "—",
    cell: ({ getValue }) => (
      <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
        {getValue() as string}
      </span>
    ),
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
    id: "amount",
    header: "Amount",
    accessorFn: (row) => row.amount ?? 0,
    cell: ({ row }) => (
      <span className="font-semibold text-[var(--text-primary)]">
        {fmtGHS(row.original.amount)}
      </span>
    ),
  },
  {
    id: "channel",
    header: "Channel",
    accessorFn: (row) => row.payment_channel ?? "—",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <MiniPill tone={statusTone((getValue() as string) ?? "")}>
        {(getValue() as string) ?? "unknown"}
      </MiniPill>
    ),
  },
  {
    id: "date",
    header: "Date",
    accessorFn: (row) => row.created_at ?? "",
    cell: ({ row }) => (
      <span className="text-[var(--text-tertiary)]">
        {row.original.created_at
          ? new Date(row.original.created_at as string).toLocaleDateString(
              "en-GH"
            )
          : "—"}
      </span>
    ),
    sortingFn: "datetime",
  },
]

const rowActions: RowAction<TransactionRow>[] = [
  {
    label: "Copy transaction ID",
    onClick: (row) => navigator.clipboard.writeText(row.id),
  },
  {
    label: "View event",
    hidden: (row) => !row.event,
    onClick: (row) => {
      window.location.href = `/events?q=${encodeURIComponent(
        row.event?.title ?? ""
      )}`
    },
  },
]

type Props = {
  transactions: TransactionRow[]
  searchQuery?: string
}

export function RevenueDataTable({ transactions, searchQuery }: Props) {
  return (
    <AdminDataTable
      data={transactions}
      columns={columns}
      rowActions={rowActions}
      getRowId={(row) => row.id}
      emptyMessage={
        searchQuery
          ? `No transactions matching "${searchQuery}".`
          : "No transactions found."
      }
    />
  )
}
