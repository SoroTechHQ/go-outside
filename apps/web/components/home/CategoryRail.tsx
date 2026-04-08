"use client";

import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";

interface CategoryRailProps {
  categories: Array<{ id: string; name: string; slug: string; icon: string; event_count: number }>;
  selected: string[];
  onClear: () => void;
  onToggle: (slug: string) => void;
}

export function CategoryRail({
  categories,
  selected,
  onClear,
  onToggle,
}: CategoryRailProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-b border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.82)] backdrop-blur">
      <div className="container-shell relative py-4">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <button
            className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
              selected.length === 0
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:scale-[1.04] hover:bg-[var(--bg-card-hover)]"
            }`}
            onClick={onClear}
            type="button"
          >
            All Events
          </button>

          {categories.map((category) => {
            const active = selected.includes(category.slug);
            return (
              <button
                key={category.id}
                className={`h-9 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                  active
                    ? "scale-[1.04] bg-[var(--brand)] text-white"
                    : "border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:scale-[1.04] hover:bg-[var(--bg-card-hover)]"
                }`}
                onClick={() => onToggle(category.slug)}
                type="button"
              >
                {category.icon} {category.name}
              </button>
            );
          })}

          <button
            aria-label="Browse all categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:scale-[1.04] hover:bg-[var(--bg-card-hover)]"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 hidden w-[360px] rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_20px_40px_rgba(12,18,12,0.14)] md:block">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl italic text-[var(--text-primary)]">
                  Browse categories
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Pin scenes and the feed reorders around them.
                </p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const active = selected.includes(category.slug);
                return (
                  <button
                    key={category.slug}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-transparent bg-[rgba(var(--brand-rgb),0.12)] text-[var(--brand)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                    }`}
                    onClick={() => onToggle(category.slug)}
                    type="button"
                  >
                    <p className="text-lg">{category.icon}</p>
                    <p className="mt-2 text-sm font-semibold">{category.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {category.event_count} events
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-[rgba(10,14,11,0.45)] md:hidden">
          <button
            aria-label="Close categories"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-[var(--bg-card)] p-5 shadow-[0_-20px_50px_rgba(12,18,12,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl italic text-[var(--text-primary)]">
                  Browse categories
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Pick one or stack a few.
                </p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  className={`rounded-[20px] border px-4 py-4 text-left transition ${
                    selected.includes(category.slug)
                      ? "border-transparent bg-[rgba(var(--brand-rgb),0.12)] text-[var(--brand)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  }`}
                  onClick={() => onToggle(category.slug)}
                  type="button"
                >
                  <p className="text-lg">{category.icon}</p>
                  <p className="mt-2 text-sm font-semibold">{category.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {category.event_count} events
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CategoryRail;
