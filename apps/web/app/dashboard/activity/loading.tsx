import { ActivitySkeleton } from "./_components/ActivitySkeleton";
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ActivitySkeleton count={7} />
    </div>
  );
}
