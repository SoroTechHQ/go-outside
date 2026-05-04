'use client'

import { useRef, useState, useTransition } from 'react'
import { sendBroadcast } from '../app/broadcasts/actions'
import { MiniPill } from './dashboard-primitives'

export function BroadcastComposer() {
  const formRef = useRef<HTMLFormElement>(null)
  const [charCount, setCharCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await sendBroadcast(formData)
      setResult(res ?? { success: true })
      if (res?.success) {
        formRef.current?.reset()
        setCharCount(0)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {result?.success && (
        <div className="rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
          Broadcast sent to {result.count} user{result.count !== 1 ? 's' : ''}.
        </div>
      )}
      {result?.error && (
        <div className="rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[var(--accent-coral)]">
          {result.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          Title
        </label>
        <input
          name="title"
          required
          placeholder="Broadcast title"
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          <span>Body</span>
          <span className={charCount > 450 ? 'text-[var(--accent-coral)]' : ''}>{charCount}/500</span>
        </label>
        <textarea
          name="body"
          required
          maxLength={500}
          rows={4}
          placeholder="Message body…"
          onChange={(e) => setCharCount(e.target.value.length)}
          className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Audience
          </label>
          <select
            name="audience"
            defaultValue="all"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          >
            <option value="all">All active users</option>
            <option value="attendees">Attendees only</option>
            <option value="organizers">Organizers only</option>
            <option value="city:Accra">City: Accra</option>
            <option value="city:Kumasi">City: Kumasi</option>
            <option value="city:Takoradi">City: Takoradi</option>
            <option value="tier:newcomer">Tier: Newcomer</option>
            <option value="tier:regular">Tier: Regular</option>
            <option value="tier:enthusiast">Tier: Enthusiast</option>
            <option value="tier:vip">Tier: VIP</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Channel
          </label>
          <select
            name="channel"
            defaultValue="in_app"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          >
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[#08110b] transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Send Broadcast'}
      </button>
    </form>
  )
}
