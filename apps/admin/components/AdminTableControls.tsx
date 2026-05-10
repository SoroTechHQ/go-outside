"use client";

import { useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

type SortOption = { label: string; value: string };

export type TableControlParams = {
  q: string;
  limit: string;
  sort: string;
  order: string;
  sort2: string;
  order2: string;
  regex: boolean;
};

type Props = {
  sortOptions: SortOption[];
  currentParams: TableControlParams;
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
  const { q, limit, sort, order, sort2, order2, regex } = currentParams;

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged: Record<string, string> = {
      q,
      limit,
      sort,
      order,
      sort2,
      order2,
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
    startTransition(() => router.push(buildUrl(overrides)));
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

  function toggleOrder2() {
    nav({ order2: order2 === "desc" ? "asc" : "desc" });
  }

  const sortLabel = (val: string) =>
    sortOptions.find((o) => o.value === val)?.label ?? val;

  // Active chips
  const hasAnyFilter = q || sort2;
  const hasAnything = q || sort2 || sort !== (sortOptions[0]?.value ?? "created_at");

  const orderArrow = (o: string) => (o === "asc" ? "↑" : "↓");

  return (
    <div className="mb-4 space-y-2">
      {/* ── Main control bar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-[360px]">
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
            title={regex ? "Regex on — click to disable" : "Enable regex search"}
            className={`absolute inset-y-0 right-1.5 flex items-center px-2 rounded-lg text-[11px] font-bold font-mono transition-colors ${
              regex
                ? "text-[var(--brand)] bg-[rgba(74,222,128,0.14)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            .*
          </button>
        </div>

        {/* Sort 1 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Sort</span>
          <select
            value={sort}
            onChange={(e) => nav({ sort: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={toggleOrder}
            title={order === "desc" ? "Descending" : "Ascending"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
          >
            <svg
              className="h-4 w-4 transition-transform"
              style={{ transform: order === "asc" ? "scaleY(-1)" : undefined }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
            </svg>
          </button>
        </div>

        {/* Sort 2 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Then</span>
          <select
            value={sort2}
            onChange={(e) => nav({ sort2: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
          >
            <option value="">— none —</option>
            {sortOptions
              .filter((o) => o.value !== sort)
              .map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </select>
          {sort2 && (
            <button
              onClick={toggleOrder2}
              title={order2 === "desc" ? "Descending" : "Ascending"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
            >
              <svg
                className="h-4 w-4 transition-transform"
                style={{ transform: order2 === "asc" ? "scaleY(-1)" : undefined }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
              </svg>
            </button>
          )}
        </div>

        {/* Per page */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Show</span>
          <select
            value={limit}
            onChange={(e) => nav({ limit: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] cursor-pointer"
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

      {/* ── Active filter chips ── */}
      {hasAnything && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Active:</span>

          {/* Search chip */}
          {q && (
            <button
              onClick={() => nav({ q: "" })}
              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.1)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-cyan)] transition hover:bg-[rgba(56,189,248,0.18)]"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              {q.length > 20 ? `"${q.slice(0, 20)}…"` : `"${q}"`}
              <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Primary sort chip */}
          <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25" />
            </svg>
            {sortLabel(sort)} {orderArrow(order)}
          </span>

          {/* Secondary sort chip */}
          {sort2 && (
            <button
              onClick={() => nav({ sort2: "", order2: "" })}
              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-violet)] transition hover:bg-[rgba(167,139,250,0.18)]"
            >
              <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25" />
              </svg>
              then {sortLabel(sort2)} {orderArrow(order2 || "desc")}
              <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Clear all */}
          {hasAnyFilter && (
            <button
              onClick={() => nav({ q: "", sort2: "", order2: "", regex: "" })}
              className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
