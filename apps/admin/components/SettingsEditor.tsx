'use client'

import { useState, useTransition } from 'react'
import { updateSetting, toggleCategory } from '../app/settings/actions'
import { MiniPill } from './dashboard-primitives'

type Setting = {
  key: string
  value: unknown
  description: string | null
}

type Category = {
  id: string
  name: string
  slug: string
  icon_key: string | null
  is_active: boolean
  sort_order: number | null
}

function SettingRow({ setting }: { setting: Setting }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(
    typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value),
  )
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await updateSetting(setting.key, draft)
      setEditing(false)
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--text-primary)]">{setting.key}</p>
        {setting.description && (
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{setting.description}</p>
        )}
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
            <button
              onClick={save}
              disabled={isPending}
              className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-[#08110b] disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
      {!editing && (
        <div className="flex shrink-0 items-center gap-3">
          <MiniPill tone="brand">
            {typeof setting.value === 'object'
              ? JSON.stringify(setting.value)
              : String(setting.value ?? '—')}
          </MiniPill>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition()
  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0">
      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{category.name}</td>
      <td className="py-3 pr-4 text-[var(--text-secondary)]">{category.slug}</td>
      <td className="py-3 pr-4 text-[var(--text-secondary)]">{category.icon_key ?? '—'}</td>
      <td className="py-3 pr-4 text-center text-[var(--text-secondary)]">{category.sort_order ?? '—'}</td>
      <td className="py-3">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() => toggleCategory(category.id, category.is_active))
          }
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50 ${
            category.is_active
              ? 'bg-[rgba(74,222,128,0.15)] text-[var(--brand)] hover:bg-[rgba(74,222,128,0.25)]'
              : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]'
          }`}
        >
          {category.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
    </tr>
  )
}

export function SettingsList({ settings }: { settings: Setting[] }) {
  return (
    <div>
      {settings.map((s) => (
        <SettingRow key={s.key} setting={s} />
      ))}
    </div>
  )
}

export function CategoriesTable({ categories }: { categories: Category[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Slug</th>
            <th className="pb-3 pr-4">Icon key</th>
            <th className="pb-3 pr-4 text-center">Order</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
