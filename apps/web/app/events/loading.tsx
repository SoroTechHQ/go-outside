import { FeedSkeleton } from "../../components/skeletons/FeedSkeleton";
export default function Loading() {
  return (
    <div className="container-shell py-6">
      <FeedSkeleton count={6} />
    </div>
  );
}
