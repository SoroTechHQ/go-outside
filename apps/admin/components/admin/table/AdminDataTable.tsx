"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table"
import { useState, useRef, useEffect, useCallback } from "react"

// ─── Variant styles shared by bulk toolbar + ••• menu ───────────────────────
const variantStyles = {
  primary:
    "bg-[var(--brand)] text-[#071209] border border-[var(--brand)] hover:opacity-85",
  danger:
    "bg-[rgba(251,113,133,0.14)] text-[var(--accent-coral)] border border-[rgba(251,113,133,0.32)] hover:bg-[rgba(251,113,133,0.24)]",
  warning:
    "bg-[rgba(251,191,36,0.12)] text-[var(--accent-amber)] border border-[rgba(251,191,36,0.28)] hover:bg-[rgba(251,191,36,0.22)]",
  ghost:
    "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
  info:
    "bg-[rgba(56,189,248,0.1)] text-[var(--accent-cyan)] border border-[rgba(56,189,248,0.22)] hover:bg-[rgba(56,189,248,0.18)]",
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BulkAction<TData> = {
  label: string
  variant?: keyof typeof variantStyles
  onClick: (rows: TData[]) => void | Promise<void>
}

export type RowAction<TData> = {
  label: string
  variant?: "default" | "danger" | "warning"
  /** Return true to hide this action for a given row */
  hidden?: (row: TData) => boolean
  onClick: (row: TData) => void
}

type Props<TData> = {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  bulkActions?: BulkAction<TData>[]
  rowActions?: RowAction<TData>[]
  onRowClick?: (row: TData, e: React.MouseEvent) => void
  emptyMessage?: string
  defaultVisibility?: VisibilityState
  defaultSorting?: SortingState
  getRowId?: (row: TData) => string
}

// ─── RowActionsMenu ──────────────────────────────────────────────────────────

function RowActionsMenu<TData>({
  row,
  actions,
}: {
  row: TData
  actions: RowAction<TData>[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const visible = actions.filter((a) => !a.hidden?.(row))
  if (visible.length === 0) return null

  const menuItemClass = {
    default:
      "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]",
    danger: "text-[var(--accent-coral)] hover:bg-[rgba(251,113,133,0.08)]",
    warning: "text-[var(--accent-amber)] hover:bg-[rgba(251,191,36,0.08)]",
  }

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-1 shadow-xl">
          {visible.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false)
                action.onClick(row)
              }}
              className={[
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors",
                menuItemClass[action.variant ?? "default"],
              ].join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ColumnVisibilityMenu ────────────────────────────────────────────────────

function ColumnVisibilityMenu({
  columns,
}: {
  columns: ReturnType<typeof useReactTable>["getAllLeafColumns"] extends () => infer R ? R : never
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggleable = columns.filter(
    (col: any) => col.id !== "select" && col.id !== "_actions"
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" />
        </svg>
        Columns
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 shadow-xl">
          <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Toggle columns
          </p>
          {toggleable.map((col: any) => (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="accent-[var(--brand)]"
              />
              {typeof col.columnDef.header === "string"
                ? col.columnDef.header
                : col.id.charAt(0).toUpperCase() + col.id.slice(1)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AdminDataTable ──────────────────────────────────────────────────────────

export function AdminDataTable<TData>({
  data,
  columns: userColumns,
  bulkActions,
  rowActions,
  onRowClick,
  emptyMessage = "No records found.",
  defaultVisibility = {},
  defaultSorting = [],
  getRowId,
}: Props<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isBulkPending, setIsBulkPending] = useState(false)

  // Inject ••• column when rowActions are provided
  const columns: ColumnDef<TData, any>[] = rowActions
    ? [
        ...userColumns,
        {
          id: "_actions",
          header: "",
          enableSorting: false,
          cell: ({ row }) => (
            <RowActionsMenu row={row.original} actions={rowActions} />
          ),
        },
      ]
    : userColumns

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId as any,
    enableMultiSort: true,
    isMultiSortEvent: () => true,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const hasSelection = selectedCount > 0

  async function runBulkAction(action: BulkAction<TData>) {
    setIsBulkPending(true)
    try {
      await action.onClick(selectedRows.map((r) => r.original))
    } finally {
      setIsBulkPending(false)
      setRowSelection({})
    }
  }

  return (
    <div className="space-y-2">
      {/* Toolbar: row count + column visibility */}
      <div className="flex items-center justify-between pb-1">
        <p className="text-xs text-[var(--text-tertiary)]">
          {data.length > 0 ? `${data.length.toLocaleString()} rows on page` : ""}
        </p>
        <ColumnVisibilityMenu columns={table.getAllLeafColumns() as any} />
      </div>

      {/* Bulk action toolbar */}
      {hasSelection && bulkActions && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(74,222,128,0.22)] bg-[rgba(74,222,128,0.05)] px-4 py-2.5">
          <span className="text-xs font-bold text-[var(--brand)]">
            {selectedCount} selected
          </span>
          <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
          {bulkActions.map((action) => (
            <button
              key={action.label}
              disabled={isBulkPending}
              onClick={() => runBulkAction(action)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]",
                variantStyles[action.variant ?? "ghost"],
              ].join(" ")}
            >
              {isBulkPending && (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setRowSelection({})}
            className="ml-auto text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border-subtle)]">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={[
                        "pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]",
                        canSort
                          ? "cursor-pointer select-none hover:text-[var(--text-secondary)]"
                          : "",
                      ].join(" ")}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="text-[10px]">
                              {sorted === "asc"
                                ? " ↑"
                                : sorted === "desc"
                                ? " ↓"
                                : <span className="opacity-30"> ↕</span>}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-[var(--text-tertiary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? (e) => onRowClick(row.original, e) : undefined}
                  className={[
                    "group transition-colors",
                    onRowClick
                      ? "cursor-pointer hover:bg-[rgba(255,255,255,0.025)]"
                      : "",
                    row.getIsSelected() ? "bg-[rgba(74,222,128,0.04)]" : "",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4 pr-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
