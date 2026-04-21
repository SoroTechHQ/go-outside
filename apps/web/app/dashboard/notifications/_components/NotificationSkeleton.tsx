export function NotificationSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-[var(--bg-muted)]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 rounded-full bg-[var(--bg-muted)]" />
              <div className="mt-2 h-3 w-full rounded-full bg-[var(--bg-muted)]" />
            </div>
            <div className="h-3 w-14 rounded-full bg-[var(--bg-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
