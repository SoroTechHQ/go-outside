'use client'

import { useTransition } from 'react'
import { toggleFeatured, toggleSponsored, updateCampaignStatus } from '../app/promotions/actions'

export function ToggleFeaturedButton({ id, current }: { id: string; current: boolean }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleFeatured(id, current))}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50 ${
        current
          ? 'bg-[rgba(74,222,128,0.15)] text-[var(--brand)] hover:bg-[rgba(74,222,128,0.25)]'
          : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]'
      }`}
    >
      {current ? 'Unfeature' : 'Feature'}
    </button>
  )
}

export function ToggleSponsoredButton({ id, current }: { id: string; current: boolean }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleSponsored(id, current))}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50 ${
        current
          ? 'bg-[rgba(251,191,36,0.15)] text-[var(--accent-amber)] hover:bg-[rgba(251,191,36,0.25)]'
          : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]'
      }`}
    >
      {current ? 'Unsponsored' : 'Sponsor'}
    </button>
  )
}

export function CampaignStatusButton({
  id,
  status,
}: {
  id: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()

  if (status === 'active') {
    return (
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => updateCampaignStatus(id, 'paused'))}
          className="rounded-lg bg-[rgba(251,191,36,0.15)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-amber)] hover:bg-[rgba(251,191,36,0.25)] disabled:opacity-50"
        >
          Pause
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => updateCampaignStatus(id, 'ended'))}
          className="rounded-lg bg-[rgba(251,113,133,0.15)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-coral)] hover:bg-[rgba(251,113,133,0.25)] disabled:opacity-50"
        >
          End
        </button>
      </div>
    )
  }
  if (status === 'paused') {
    return (
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => updateCampaignStatus(id, 'active'))}
          className="rounded-lg bg-[rgba(74,222,128,0.15)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-[rgba(74,222,128,0.25)] disabled:opacity-50"
        >
          Activate
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => updateCampaignStatus(id, 'ended'))}
          className="rounded-lg bg-[rgba(251,113,133,0.15)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-coral)] hover:bg-[rgba(251,113,133,0.25)] disabled:opacity-50"
        >
          End
        </button>
      </div>
    )
  }
  return <span className="text-xs text-[var(--text-tertiary)]">Ended</span>
}
