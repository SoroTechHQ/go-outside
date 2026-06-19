import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { NotificationFeed } from "./_components/NotificationFeed";
import { PageEntrance } from "../../../components/layout/PageEntrance";

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
      <PageEntrance className="container-shell px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[680px]">
          <h1 className="text-[1.8rem] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            Notifications
          </h1>
          <NotificationFeed userId={user.id} />
        </div>
      </PageEntrance>
    </main>
  );
}
