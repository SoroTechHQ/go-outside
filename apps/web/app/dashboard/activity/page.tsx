import { SectionHeader } from "@gooutside/ui";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { getUnreadCount } from "../../../lib/db/notifications";
import { ActivityFeed } from "./_components/ActivityFeed";

export default async function ActivityPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    return (
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <div className="container-shell py-20 text-center">
          <p className="text-[var(--text-secondary)]">
            Please sign in to view your activity.
          </p>
        </div>
      </main>
    );
  }

  const unreadCount = await getUnreadCount(user.id);

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <SectionHeader
          eyebrow="Your world"
          index="01"
          title={
            unreadCount > 0 ? `Activity · ${unreadCount} new` : "Activity"
          }
          description="Tickets, saves, reviews, and everything happening around you."
        />

        <div className="mx-auto mt-8 max-w-[680px]">
          <ActivityFeed userId={user.id} />
        </div>
      </div>
    </main>
  );
}
