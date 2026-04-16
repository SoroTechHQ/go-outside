import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { getUserNotifications } from "../../../lib/db/notifications";
import { AppIcon, SectionHeader, ShellCard } from "@gooutside/ui";

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

  const notifications = await getUserNotifications(user.id);

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <SectionHeader
          eyebrow="Messages"
          index="01"
          title="Notifications"
          description="Unread updates, plan nudges, and event activity from your circle."
        />

        <div className="mt-8 space-y-4">
          {notifications.length === 0 ? (
            <ShellCard className="py-12 text-center">
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
                All caught up
              </h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                No new notifications right now.
              </p>
            </ShellCard>
          ) : (
            notifications.map((item) => (
              <ShellCard
                key={item.id}
                className={`flex items-start gap-4 p-4 ${!item.isRead ? "border-[var(--neon)]/20" : ""}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--neon)]">
                  <AppIcon name={item.iconKey} size={18} weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.meta}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    {item.timeLabel}
                  </p>
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-[var(--neon)]" />
                  )}
                </div>
              </ShellCard>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
