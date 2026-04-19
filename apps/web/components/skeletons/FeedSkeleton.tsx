import { Skeleton } from "../ui/Skeleton";

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[16px] border border-[var(--border-card)] bg-[var(--bg-card)]"
        >
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-2 p-3 pb-4">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
