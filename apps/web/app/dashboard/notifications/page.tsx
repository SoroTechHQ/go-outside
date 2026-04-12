import { demoData } from "@gooutside/demo-data";
import { AppIcon, SectionHeader, ShellCard } from "@gooutside/ui";

export default function NotificationsPage() {
  const notifications = demoData.attendee.notifications;

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <SectionHeader
          eyebrow="Messages"
          index="01"
          title="Messages"
          description="Unread updates, plan nudges, and event activity from your circle."
        />

        <div className="mt-8 space-y-4">
          {notifications.length === 0 ? (
            <ShellCard className="py-12 text-center">
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">All caught up</h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">No new messages right now.</p>
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
    </main>
  );
}
