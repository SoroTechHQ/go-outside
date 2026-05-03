import { Skeleton } from "../ui/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="page-grid min-h-screen bg-[var(--bg-base)]">
      {/* Cover */}
      <Skeleton className="h-[180px] w-full rounded-none md:h-[220px]" />

      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_288px] md:gap-6 md:px-6 lg:grid-cols-[1fr_304px] lg:gap-8 lg:px-8">
        {/* Main column */}
        <div className="min-w-0">
          {/* Avatar row overlapping cover */}
          <div className="relative z-10 -mt-11 flex items-end justify-between pb-4 md:-mt-14">
            <Skeleton className="h-[80px] w-[80px] rounded-full border-[3px] border-[var(--bg-base)] md:h-[96px] md:w-[96px]" />
            {/* Buttons placeholder */}
            <div className="mb-1 flex items-center gap-2">
              <Skeleton className="h-[32px] w-[80px] rounded-full" />
              <Skeleton className="h-[32px] w-[32px] rounded-full" />
              <Skeleton className="h-[32px] w-[68px] rounded-full" />
            </div>
          </div>

          {/* Name + handle */}
          <div className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
            {/* Bio */}
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-3.5 w-full max-w-[400px]" />
              <Skeleton className="h-3.5 w-3/4 max-w-[300px]" />
            </div>
            {/* Location + date */}
            <div className="mt-2.5 flex gap-4">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            {/* Interest tags */}
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-stretch border-y border-[var(--border-subtle)]">
            {[80, 80, 80, 60].map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5 py-4">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Pulse score banner */}
          <div className="my-3">
            <Skeleton className="h-[72px] w-full rounded-[18px]" />
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-[var(--border-subtle)] pb-0 pt-1">
            {[88, 72, 68, 88, 68].map((w, i) => (
              <Skeleton key={i} className="h-8 rounded-t-lg" style={{ width: w }} />
            ))}
          </div>

          {/* Content cards */}
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
              >
                <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar (desktop only) */}
        <div className="hidden md:block space-y-4 pt-6">
          <Skeleton className="h-[180px] w-full rounded-[18px]" />
          <Skeleton className="h-[140px] w-full rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}
