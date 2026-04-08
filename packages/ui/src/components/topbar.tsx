"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "./theme-toggle";

export function DashboardTopbar({
  title,
  subtitle,
  searchLabel,
}: {
  title: string;
  subtitle: string;
  searchLabel: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[color:var(--bg-base)]/90 px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-display text-3xl italic text-[var(--text-primary)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex min-w-[260px] items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <MagnifyingGlass size={18} />
          <input
            className="w-full bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
            placeholder={searchLabel}
            type="text"
          />
        </label>
        <ThemeToggle />
      </div>
    </header>
  );
}
