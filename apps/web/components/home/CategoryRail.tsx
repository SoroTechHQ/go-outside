"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "@phosphor-icons/react";
import { CategoryIcon } from "../../lib/category-icons";
import type { DbCategory } from "../../hooks/useEventsQuery";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

interface CategoryRailProps {
  categories: DbCategory[];
  selected: string[];
  onClear: () => void;
  onToggle: (slug: string) => void;
}

export function CategoryRail({ categories, selected, onClear, onToggle }: CategoryRailProps) {
  const [open, setOpen] = useState(false);
  const { reduceMotion, springs, variants } = useAnimationConfig();

  const pillTap = reduceMotion ? undefined : { scale: 0.94 };

  return (
    <div className="relative z-20">
      <div className="container-shell relative py-3">
        <motion.div
          className="no-scrollbar flex items-center gap-2 overflow-x-auto"
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
        >
          {/* All Events */}
          <motion.button
            variants={variants.fadeUp}
            whileTap={pillTap}
            transition={springs.snappy}
            className={`h-8 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 ${
              selected.length === 0
                ? "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[var(--brand-shadow)]"
                : "border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
            }`}
            onClick={onClear}
            type="button"
          >
            All Events
          </motion.button>

          {/* Category pills */}
          {categories.map((category) => {
            const active = selected.includes(category.slug);
            return (
              <motion.button
                key={category.id}
                variants={variants.fadeUp}
                whileTap={pillTap}
                transition={springs.snappy}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 ${
                  active
                    ? "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[var(--brand-shadow)]"
                    : "border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
                }`}
                onClick={() => onToggle(category.slug)}
                type="button"
              >
                <CategoryIcon slug={category.slug} iconKey={category.icon_key} size={13} weight="bold" />
                {category.name}
              </motion.button>
            );
          })}

          {/* Browse all */}
          <motion.button
            variants={variants.fadeUp}
            whileTap={pillTap}
            transition={springs.snappy}
            aria-label="Browse all categories"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Plus size={15} />
          </motion.button>
        </motion.div>
      </div>

      {/* Desktop popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0.15 } : springs.gentle}
            className="absolute right-6 top-[calc(100%+0.5rem)] z-30 hidden w-[400px] rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] p-5 shadow-[var(--home-shadow-strong)] backdrop-blur-xl md:block"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl italic text-[var(--text-primary)]">Browse categories</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Pick one and the feed reorders around it.
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
                  <motion.button
                    key={category.slug}
                    whileTap={pillTap}
                    transition={springs.snappy}
                    className={`rounded-[18px] border px-4 py-3.5 text-left transition-colors duration-200 ${
                      active
                        ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] text-[var(--brand)]"
                        : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)] hover:border-[color:var(--home-highlight-border)] hover:bg-[color:var(--home-highlight-bg)] hover:text-[var(--brand)]"
                    }`}
                    onClick={() => onToggle(category.slug)}
                    type="button"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-[var(--brand)] text-white" : "bg-[color:var(--home-border)] text-[var(--text-secondary)]"}`}>
                      <CategoryIcon slug={category.slug} iconKey={category.icon_key} size={16} weight="bold" />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{category.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                      {category.event_count > 0 ? `${category.event_count} event${category.event_count !== 1 ? "s" : ""}` : "No upcoming events"}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-label="Close categories"
              className="absolute inset-0 bg-[color:var(--home-overlay)]"
              onClick={() => setOpen(false)}
              type="button"
            />
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion   ? { opacity: 0 } : { opacity: 0, y: "100%" }}
              transition={reduceMotion ? { duration: 0.15 } : springs.sheet}
              className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] p-5 shadow-[var(--home-shadow-strong)]"
            >
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
                {categories.map((category) => {
                  const active = selected.includes(category.slug);
                  return (
                    <motion.button
                      key={category.slug}
                      whileTap={pillTap}
                      transition={springs.snappy}
                      className={`rounded-[18px] border px-4 py-3.5 text-left transition-colors duration-200 ${
                        active
                          ? "border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] text-[var(--brand)]"
                          : "border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] text-[var(--text-secondary)]"
                      }`}
                      onClick={() => onToggle(category.slug)}
                      type="button"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-[var(--brand)] text-white" : "bg-[color:var(--home-border)] text-[var(--text-secondary)]"}`}>
                        <CategoryIcon slug={category.slug} iconKey={category.icon_key} size={16} weight="bold" />
                      </div>
                      <p className="mt-2 text-sm font-semibold">{category.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                        {category.event_count > 0 ? `${category.event_count} event${category.event_count !== 1 ? "s" : ""}` : "No upcoming events"}
                      </p>
                    </motion.button>
                  );
                })}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategoryRail;
