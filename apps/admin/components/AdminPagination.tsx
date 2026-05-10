"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  total: number;
  page: number;
  limit: number;
  currentParams: Record<string, string>;
};

export function AdminPagination({ total, page, limit, currentParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  function goTo(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...currentParams, page: String(p) })) {
      if (v) params.set(k, v);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
      <p className="text-xs text-[var(--text-tertiary)]">
        {total === 0
          ? "No records found"
          : `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()} records`}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            disabled={page <= 1 || isPending}
            onClick={() => goTo(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>

          {pageNumbers().map((n, i) =>
            n === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-6 items-center justify-center text-xs text-[var(--text-tertiary)]"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                disabled={isPending}
                onClick={() => goTo(n as number)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-60 ${
                  n === page
                    ? "border-[var(--brand)] bg-[rgba(74,222,128,0.12)] font-semibold text-[var(--brand)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                {n}
              </button>
            )
          )}

          {/* Next */}
          <button
            disabled={page >= totalPages || isPending}
            onClick={() => goTo(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
