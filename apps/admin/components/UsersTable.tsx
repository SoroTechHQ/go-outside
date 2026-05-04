'use client'

import { useTransition } from 'react'
import { MiniPill } from './dashboard-primitives'
import { suspendUser, activateUser, makeOrganizer } from '../app/users/actions'

type AccentTone = 'brand' | 'cyan' | 'violet' | 'coral' | 'amber'

type User = {
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

const tierColorMap: Record<string, AccentTone> = {
  bronze: 'amber',
  silver: 'cyan',
  gold: 'brand',
  platinum: 'violet',
  diamond: 'coral',
}

function getTierTone(tier: string | null): AccentTone {
  if (!tier) return 'brand'
  return tierColorMap[tier.toLowerCase()] ?? 'brand'
}

function getRoleTone(role: string | null): AccentTone {
  if (role === 'organizer') return 'violet'
  if (role === 'admin') return 'coral'
  return 'cyan'
}

function formatJoined(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function AvatarCircle({ name, tier }: { name: string; tier: string | null }) {
  const tone = getTierTone(tier)
  const colorMap: Record<AccentTone, string> = {
    brand: '#4ade80',
    cyan: '#38bdf8',
    violet: '#a78bfa',
    coral: '#fb7185',
    amber: '#fbbf24',
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#08110b]"
      style={{ backgroundColor: colorMap[tone] }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown'

  return (
    <tr className="opacity-100 transition-opacity" style={{ opacity: isPending ? 0.6 : 1 }}>
      {/* Avatar + name */}
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <AvatarCircle name={fullName} tier={user.pulse_tier} />
          <div>
            <div className="font-semibold text-[var(--text-primary)]">{fullName}</div>
            {user.username ? (
              <div className="text-xs text-[var(--text-tertiary)]">@{user.username}</div>
            ) : null}
          </div>
        </div>
      </td>
      {/* Email */}
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">{user.email ?? '—'}</td>
      {/* Role */}
      <td className="py-4 pr-4">
        <MiniPill tone={getRoleTone(user.role)}>{user.role ?? 'attendee'}</MiniPill>
      </td>
      {/* City */}
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">{user.location_city ?? '—'}</td>
      {/* Pulse */}
      <td className="py-4 pr-4">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{user.pulse_score ?? 0}</div>
        {user.pulse_tier ? (
          <div className="text-xs text-[var(--text-tertiary)] capitalize">{user.pulse_tier}</div>
        ) : null}
      </td>
      {/* Joined */}
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">{formatJoined(user.created_at)}</td>
      {/* Status */}
      <td className="py-4 pr-4">
        <span
          className="inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: user.is_active ? '#4ade80' : '#fb7185' }}
          title={user.is_active ? 'Active' : 'Inactive'}
        />
      </td>
      {/* Actions */}
      <td className="py-4">
        <div className="flex flex-wrap gap-2">
          {user.is_active ? (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => suspendUser(user.id))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(251,113,133,0.18)] bg-[rgba(251,113,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-coral)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend
            </button>
          ) : (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => activateUser(user.id))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Activate
            </button>
          )}
          {user.role !== 'organizer' ? (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => makeOrganizer(user.id))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(167,139,250,0.18)] bg-[rgba(167,139,250,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-violet)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Make Organizer
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

export function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {['User', 'Email', 'Role', 'City', 'Pulse', 'Joined', 'Status', 'Actions'].map((heading) => (
              <th
                key={heading}
                className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
