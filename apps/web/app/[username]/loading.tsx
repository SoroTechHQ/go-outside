export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32">
      {/* Cover skeleton */}
      <div className="h-[220px] w-full animate-pulse bg-[var(--bg-muted)] md:h-[260px]" />

      <div className="mx-auto max-w-2xl px-4">
        {/* Avatar + buttons row */}
        <div className="flex items-end justify-between -mt-12 pb-4">
          <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-[var(--bg-muted)]" />
          <div className="flex gap-2 pb-1">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--bg-muted)]" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--bg-muted)]" />
          </div>
        </div>

        {/* Name + handle */}
        <div className="space-y-2 pb-4">
          <div className="h-6 w-44 animate-pulse rounded-full bg-[var(--bg-muted)]" />
          <div className="h-3.5 w-28 animate-pulse rounded-full bg-[var(--bg-muted)]" />
          <div className="h-3.5 w-64 animate-pulse rounded-full bg-[var(--bg-muted)]" />
        </div>

        {/* Stats row */}
        <div className="mt-4 h-20 animate-pulse rounded-2xl bg-[var(--bg-muted)]" />

        {/* Progress bar */}
        <div className="mt-3 h-6 animate-pulse rounded-full bg-[var(--bg-muted)]" />

        {/* Tabs */}
        <div className="mt-6 h-10 animate-pulse rounded-full bg-[var(--bg-muted)]" />
      </div>
    </main>
  );
}
