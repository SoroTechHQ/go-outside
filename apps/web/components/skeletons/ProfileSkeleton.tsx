import { Skeleton } from "../ui/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Banner */}
      <Skeleton className="h-36 w-full rounded-none" />

      {/* Avatar + edit button row */}
      <div className="relative px-4 pb-3">
        <div className="flex items-end justify-between">
          <div className="-mt-10 h-20 w-20 rounded-full border-4 border-[var(--bg-page)] overflow-hidden shrink-0">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <Skeleton className="mt-2 h-8 w-24 rounded-full" />
        </div>

        {/* Name + handle */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>

        {/* Bio lines */}
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>

        {/* Location + scene tags */}
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex border-y border-[var(--border-subtle)]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5 py-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Pulse score banner */}
      <div className="mx-4 my-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)] px-4 pb-0">
        {[100, 80, 72, 90, 68].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-t-lg" style={{ width: `${w / 5}px` }} />
        ))}
      </div>

      {/* Content cards */}
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
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
  );
}
