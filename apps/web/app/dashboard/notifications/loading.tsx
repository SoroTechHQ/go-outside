import { NotificationSkeleton } from "./_components/NotificationSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <NotificationSkeleton count={7} />
    </div>
  );
}
