import { demoData } from "@gooutside/demo-data";
import { AppIcon, MobileBottomNav, SectionHeader, ShellCard } from "@gooutside/ui";
import { PublicHeader } from "../../../components/public-header";

export default function NotificationsPage() {
  const notifications = demoData.attendee.notifications;

  return (
    <main className="pb-24">
      <PublicHeader />

      <div className="container-shell py-10">
        <SectionHeader
          eyebrow="Inbox"
          index="01"
          title="Notifications"
          description="Updates on your tickets, saves, and events."
        />

        <div className="mt-8 space-y-4">
          {notifications.length === 0 ? (
            <ShellCard className="py-12 text-center">
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">All caught up</h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">No new notifications.</p>
            </ShellCard>
          ) : (
            notifications.map((item) => (
              <ShellCard key={item.title} className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--neon)]">
                  <AppIcon name={item.iconKey} size={18} weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.meta}</p>
                </div>
                <p className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{item.timeLabel}</p>
              </ShellCard>
            ))
          )}
        </div>
      </div>

      <MobileBottomNav links={demoData.navigation.attendeeTabs} />
    </main>
  );
}
