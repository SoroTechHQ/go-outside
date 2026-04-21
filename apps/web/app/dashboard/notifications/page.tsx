import { SectionHeader } from "@gooutside/ui";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { NotificationFeed } from "./_components/NotificationFeed";

export default async function NotificationsPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    return (
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <div className="container-shell py-20 text-center">
          <p className="text-[var(--text-secondary)]">Please sign in to view notifications.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <SectionHeader
          eyebrow="Inbox"
          index="01"
          title="Notifications"
          description="Follows, mentions, replies, reminders, and event updates in one feed."
        />

        <div className="mx-auto mt-8 max-w-[680px]">
          <NotificationFeed userId={user.id} />
        </div>
      </div>
    </main>
  );
}
