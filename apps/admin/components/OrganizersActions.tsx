'use client'

import { useTransition } from 'react'
import {
  approveApplication,
  rejectApplication,
  verifyOrganizer,
  suspendOrganizerProfile,
} from '../app/organizers/actions'

type Applicant = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export type OrganizerApplication = {
  id: string
  org_name: string | null
  org_category: string | null
  description: string | null
  instagram_url: string | null
  website_url: string | null
  status: string | null
  created_at: string | null
  applicant: Applicant | null
}

export type OrganizerProfile = {
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

function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ApplicationCard({ app }: { app: OrganizerApplication }) {
  const [isPending, startTransition] = useTransition()
  const applicantName = app.applicant
    ? [app.applicant.first_name, app.applicant.last_name].filter(Boolean).join(' ')
    : 'Unknown'

  return (
    <div
      className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition-opacity"
      style={{ opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{app.org_name ?? 'Unnamed Organisation'}</p>
          {app.org_category ? (
            <span className="mt-1 inline-flex items-center rounded-full border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.1)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-cyan)]">
              {app.org_category}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{daysAgo(app.created_at)}d waiting</span>
      </div>

      {app.description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">{app.description}</p>
      ) : null}

      <div className="mt-4 space-y-1 text-xs text-[var(--text-tertiary)]">
        <p>
          <span className="font-semibold text-[var(--text-secondary)]">{applicantName}</span>
          {app.applicant?.email ? ` — ${app.applicant.email}` : ''}
        </p>
        {app.instagram_url ? (
          <p>
            <a
              href={app.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-cyan)] hover:underline"
            >
              {app.instagram_url}
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              approveApplication(app.id, app.applicant?.id ?? '')
            )
          }
          className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => rejectApplication(app.id))}
          className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(251,113,133,0.18)] bg-[rgba(251,113,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-coral)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export function OrganizersTable({ organizers }: { organizers: OrganizerProfile[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {['Organisation', 'Contact', 'City', 'Events', 'Revenue (GHS)', 'Paystack', 'Verified', 'Actions'].map(
              (heading) => (
                <th
                  key={heading}
                  className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {organizers.map((org) => (
            <OrganizerRow key={org.id} org={org} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrganizerRow({ org }: { org: OrganizerProfile }) {
  const [isPending, startTransition] = useTransition()
  const contactName = org.organizer
    ? [org.organizer.first_name, org.organizer.last_name].filter(Boolean).join(' ') || 'Unknown'
    : '—'
  const isVerified = org.status === 'active' && !!org.verified_at
  const paystackLinked = !!org.paystack_subaccount

  return (
    <tr style={{ opacity: isPending ? 0.6 : 1 }}>
      <td className="py-4 pr-4 font-semibold text-[var(--text-primary)]">
        {org.organization_name ?? '—'}
      </td>
      <td className="py-4 pr-4">
        <div className="text-sm text-[var(--text-primary)]">{contactName}</div>
        {org.organizer?.email ? (
          <div className="text-xs text-[var(--text-tertiary)]">{org.organizer.email}</div>
        ) : null}
      </td>
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">
        {org.organizer?.location_city ?? '—'}
      </td>
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">{org.total_events ?? 0}</td>
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">
        {org.total_revenue != null ? `GHS ${Number(org.total_revenue).toLocaleString()}` : '—'}
      </td>
      <td className="py-4 pr-4">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            paystackLinked
              ? 'border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)] text-[var(--brand)]'
              : 'border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.1)] text-[var(--accent-amber)]'
          }`}
        >
          {paystackLinked ? 'Linked' : 'Not linked'}
        </span>
      </td>
      <td className="py-4 pr-4 text-sm text-[var(--text-secondary)]">{formatDate(org.verified_at)}</td>
      <td className="py-4">
        <div className="flex flex-wrap gap-2">
          {!isVerified ? (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => verifyOrganizer(org.id))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify
            </button>
          ) : null}
          {org.status !== 'suspended' ? (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => suspendOrganizerProfile(org.id))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[rgba(251,113,133,0.18)] bg-[rgba(251,113,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-coral)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend
            </button>
          ) : (
            <span className="inline-flex items-center rounded-full border border-[rgba(251,113,133,0.18)] bg-[rgba(251,113,133,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-coral)]">
              Suspended
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}
