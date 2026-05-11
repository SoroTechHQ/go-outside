"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { AdminDataTable, BulkAction, RowAction } from "../admin/table/AdminDataTable"
import { MiniPill } from "../dashboard-primitives"
import { suspendUser, activateUser, makeOrganizer } from "../../app/users/actions"

export type UserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string | null
  role: string | null
  location_city: string | null
  pulse_score: number | null
  pulse_tier: string | null
  created_at: string | null
  is_active: boolean | null
  avatar_url: string | null
  followers_count: number | null
  following_count: number | null
}

type AccentTone = "brand" | "cyan" | "violet" | "coral" | "amber"

const tierColorMap: Record<string, AccentTone> = {
  bronze: "amber",
  silver: "cyan",
  gold: "brand",
  platinum: "violet",
  diamond: "coral",
}

const tierBgMap: Record<AccentTone, string> = {
  brand: "#4ade80",
  cyan: "#38bdf8",
  violet: "#a78bfa",
  coral: "#fb7185",
  amber: "#fbbf24",
}

function getTierTone(tier: string | null): AccentTone {
  return tierColorMap[tier?.toLowerCase() ?? ""] ?? "brand"
}

function getRoleTone(role: string | null): AccentTone {
  if (role === "organizer") return "violet"
  if (role === "admin") return "coral"
  return "cyan"
}

function formatJoined(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  })
}

function AvatarCircle({ name, tier }: { name: string; tier: string | null }) {
  const tone = getTierTone(tier)
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#08110b]"
      style={{ backgroundColor: tierBgMap[tone] }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const columns: ColumnDef<UserRow, any>[] = [
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
    id: "user",
    header: "User",
    accessorFn: (row) =>
      [row.first_name, row.last_name].filter(Boolean).join(" ") || "Unknown",
    cell: ({ row }) => {
      const fullName =
        [row.original.first_name, row.original.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown"
      return (
        <div className="flex items-center gap-3">
          <AvatarCircle name={fullName} tier={row.original.pulse_tier} />
          <div>
            <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
              {fullName}
            </div>
            {row.original.username && (
              <div className="text-xs text-[var(--text-tertiary)]">
                @{row.original.username}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => (
      <MiniPill tone={getRoleTone(getValue() as string)}>
        {(getValue() as string) ?? "attendee"}
      </MiniPill>
    ),
  },
  {
    accessorKey: "location_city",
    header: "City",
    cell: ({ getValue }) => (
      <span className="text-[var(--text-secondary)]">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    id: "pulse",
    header: "Pulse",
    accessorFn: (row) => row.pulse_score ?? 0,
    cell: ({ row }) => (
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {row.original.pulse_score ?? 0}
        </div>
        {row.original.pulse_tier && (
          <div className="text-xs capitalize text-[var(--text-tertiary)]">
            {row.original.pulse_tier}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "joined",
    header: "Joined",
    accessorFn: (row) => row.created_at ?? "",
    cell: ({ row }) => (
      <span className="text-[var(--text-secondary)]">
        {formatJoined(row.original.created_at)}
      </span>
    ),
    sortingFn: "datetime",
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => (row.is_active ? 1 : 0),
    cell: ({ row }) => (
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: row.original.is_active ? "#4ade80" : "#fb7185",
        }}
        title={row.original.is_active ? "Active" : "Inactive"}
      />
    ),
  },
]

function useUserRowActions(): RowAction<UserRow>[] {
  const [, startTransition] = useTransition()
  const router = useRouter()

  return [
    {
      label: "View behavioral lens",
      onClick: (row) => router.push(`/users/${row.id}`),
    },
    {
      label: "Suspend",
      variant: "danger",
      hidden: (row) => row.is_active === false,
      onClick: (row) => startTransition(() => suspendUser(row.id)),
    },
    {
      label: "Activate",
      hidden: (row) => row.is_active === true,
      onClick: (row) => startTransition(() => activateUser(row.id)),
    },
    {
      label: "Make Organizer",
      variant: "warning",
      hidden: (row) => row.role === "organizer",
      onClick: (row) => startTransition(() => makeOrganizer(row.id)),
    },
  ]
}

type Props = {
  users: UserRow[]
  searchQuery?: string
}

export function UsersDataTable({ users, searchQuery }: Props) {
  const router = useRouter()
  const rowActions = useUserRowActions()

  const bulkActions: BulkAction<UserRow>[] = [
    {
      label: "Suspend selected",
      variant: "danger",
      onClick: async (rows) => {
        const active = rows.filter((r) => r.is_active)
        await Promise.all(active.map((r) => suspendUser(r.id)))
      },
    },
    {
      label: "Activate selected",
      variant: "primary",
      onClick: async (rows) => {
        const inactive = rows.filter((r) => !r.is_active)
        await Promise.all(inactive.map((r) => activateUser(r.id)))
      },
    },
  ]

  return (
    <AdminDataTable
      data={users}
      columns={columns}
      bulkActions={bulkActions}
      rowActions={rowActions}
      getRowId={(row) => row.id}
      onRowClick={(row, e) => {
        if (e.metaKey || e.ctrlKey) {
          window.open(`/users/${row.id}`, "_blank")
        } else {
          router.push(`/users/${row.id}`)
        }
      }}
      emptyMessage={
        searchQuery ? `No users matching "${searchQuery}".` : "No users found."
      }
    />
  )
}
