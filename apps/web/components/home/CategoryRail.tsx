"use client";

import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";

interface CategoryRailProps {
  categories: Array<{ id: string; name: string; slug: string; icon: string; event_count: number }>;
  selected: string[];
  onClear: () => void;
  onToggle: (slug: string) => void;
}

export function CategoryRail({ categories, selected, onClear, onToggle }: CategoryRailProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-20">
      {/* Seamless pill row — no hard border, glass background */}
      <div className="container-shell relative py-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {/* All Events */}
          <button
            className={`h-8 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-all duration-200 ${
              selected.length === 0
                ? "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[var(--brand-shadow)]"
                : "border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
            }`}
            onClick={onClear}
            type="button"
          >
            All Events
          </button>

          {/* Category pills */}
          {categories.map((category) => {
            const active = selected.includes(category.slug);
            return (
              <button
                key={category.id}
                className={`h-8 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[var(--brand-shadow)]"
                    : "border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
                }`}
                onClick={() => onToggle(category.slug)}
                type="button"
              >
                {category.icon} {category.name}
              </button>
            );
          })}

          {/* Browse all */}
          <button
            aria-label="Browse all categories"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Desktop popover */}
      {open ? (
        <div className="absolute right-6 top-[calc(100%+0.5rem)] z-30 hidden w-[380px] rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] p-5 shadow-[var(--home-shadow-strong)] backdrop-blur-xl md:block">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-display text-2xl italic text-[var(--text-primary)]">Browse categories</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Pin scenes and the feed reorders around them.
              </p>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const active = selected.includes(category.slug);
              return (
                <button
                  key={category.slug}
                  className={`rounded-[18px] border px-4 py-3.5 text-left transition-all duration-200 ${
                    active
                      ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] text-[var(--brand)]"
                      : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
                  }`}
                  onClick={() => onToggle(category.slug)}
                  type="button"
                >
                  <p className="text-lg">{category.icon}</p>
                  <p className="mt-1.5 text-sm font-semibold">{category.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{category.event_count} events</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Mobile sheet */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close categories"
            className="absolute inset-0 bg-[color:var(--home-overlay)]"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] p-5 shadow-[var(--home-shadow-strong)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl italic text-[var(--text-primary)]">Browse categories</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Pick one or stack a few.</p>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  className={`rounded-[18px] border px-4 py-3.5 text-left transition-all duration-200 ${
                    selected.includes(category.slug)
                      ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] text-[var(--brand)]"
                      : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)]"
                  }`}
                  onClick={() => onToggle(category.slug)}
                  type="button"
                >
                  <p className="text-lg">{category.icon}</p>
                  <p className="mt-1.5 text-sm font-semibold">{category.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{category.event_count} events</p>
                </button>
              ))}
            </div>
            <div className="mt-4 pb-safe">
              <button
                className="w-full rounded-full bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--brand-contrast)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CategoryRail;
