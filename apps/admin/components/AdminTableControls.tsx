"use client";

import { useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

type SortOption = { label: string; value: string };

type CurrentParams = {
  q: string;
  limit: string;
  sort: string;
  order: string;
  regex: boolean;
};

type Props = {
  sortOptions: SortOption[];
  currentParams: CurrentParams;
  searchPlaceholder?: string;
};

export function AdminTableControls({
  sortOptions,
  currentParams,
  searchPlaceholder = "Search…",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { q, limit, sort, order, regex } = currentParams;

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged: Record<string, string> = {
      q,
      limit,
      sort,
      order,
      regex: regex ? "1" : "",
      ...overrides,
      page: "1",
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `${pathname}?${params.toString()}`;
  }

  function nav(overrides: Record<string, string>) {
    startTransition(() => {
      router.push(buildUrl(overrides));
    });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => nav({ q: val }), 380);
  }

  function toggleRegex() {
    nav({ regex: regex ? "" : "1", q });
  }

  function toggleOrder() {
    nav({ order: order === "desc" ? "asc" : "desc" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-[var(--border-subtle)] mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[360px]">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg className="h-3.5 w-3.5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <input
          key={q}
          type="text"
          defaultValue={q}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-2 pl-8 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
        />
        <button
          onClick={toggleRegex}
          title={regex ? "Regex mode on — click to disable" : "Enable regex search"}
          className={`absolute inset-y-0 right-1.5 flex items-center px-2 rounded-lg text-[11px] font-bold font-mono transition-colors ${
            regex
              ? "text-[var(--brand)] bg-[rgba(74,222,128,0.14)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          .*
        </button>
      </div>

      {/* Sort by */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Sort</span>
        <select
          value={sort}
          onChange={(e) => nav({ sort: e.target.value })}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Order toggle */}
      <button
        onClick={toggleOrder}
        title={order === "desc" ? "Descending — click to switch to ascending" : "Ascending — click to switch to descending"}
        className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]"
      >
        <svg
          className="h-3.5 w-3.5 transition-transform"
          style={{ transform: order === "asc" ? "scaleY(-1)" : undefined }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
        <span>{order === "desc" ? "Newest" : "Oldest"}</span>
      </button>

      {/* Per page */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Show</span>
        <select
          value={limit}
          onChange={(e) => nav({ limit: e.target.value })}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
        >
          {["25", "50", "100"].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {isPending && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      )}
    </div>
  );
}
