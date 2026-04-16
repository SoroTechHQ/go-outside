export function ActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
        >
          {/* Icon placeholder */}
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-[var(--bg-muted)]" />

          {/* Text placeholders */}
          <div className="flex-1 space-y-2">
            <div
              className="h-3.5 animate-pulse rounded bg-[var(--bg-muted)]"
              style={{ width: `${55 + (i % 3) * 15}%` }}
            />
            <div
              className="h-3 animate-pulse rounded bg-[var(--bg-muted)]"
              style={{ width: `${30 + (i % 4) * 10}%` }}
            />
          </div>

          {/* Timestamp placeholder */}
          <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-[var(--bg-muted)]" />
        </div>
      ))}
    </div>
  );
}
