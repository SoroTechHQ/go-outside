import {
  demoData,
  events,
  getCategoryBySlug,
} from "@gooutside/demo-data";
import {
  BarStripes,
  ChartCard,
  DataTable,
  DonutLegend,
  LineSpark,
  ShellCard,
  StatCard,
  StatusPill,
} from "@gooutside/ui";
import { DashboardShell } from "../../components/dashboard-shell";

export default function AdminDashboardPage() {
  const stats = demoData.adminDashboard.stats;
  const recentEvents = events.slice(0, 4);

  return (
    <DashboardShell
      mode="admin"
      subtitle="Platform overview, moderation load, and live commercial health."
      title="Platform Dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} tone={stat.tone as "neon" | "pink" | "blue"} trend={stat.trend} value={stat.value} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <ChartCard subtitle="Gross revenue across the active operating window." title="Monthly revenue">
          <LineSpark values={demoData.adminDashboard.revenueTrend} />
        </ChartCard>
        <ChartCard subtitle="Weekly signup velocity, useful for demand pacing." title="New users">
          <BarStripes values={demoData.adminDashboard.userGrowth} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <DataTable
          columns={["Event", "Category", "Date", "Status", "Actions"]}
          rows={recentEvents.map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            return [
              <div key={`${event.slug}-title`}>
                <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
              </div>,
              category?.name ?? "Category",
              `${event.dateLabel} · ${event.timeLabel}`,
              <StatusPill key={`${event.slug}-status`} tone={event.status === "review" ? "review" : "live"}>{event.status}</StatusPill>,
              <div key={`${event.slug}-action`} className="flex gap-2">
                <StatusPill tone="draft">Feature</StatusPill>
                <StatusPill tone="pending">Review</StatusPill>
              </div>,
            ];
          })}
        />
        <ChartCard subtitle="Category spread across active demand." title="Events by category">
          <DonutLegend items={demoData.adminDashboard.categoryMix} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr,360px]">
        <ShellCard>
          <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Recent platform events</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This table is a static frontend implementation of the platform moderation queue and feature controls.
          </p>
          <div className="mt-5 grid gap-4">
            {recentEvents.map((event) => (
              <div key={event.slug} className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-4">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.city} · {event.capacityLabel}</p>
                </div>
                <StatusPill tone={event.trending ? "paid" : "draft"}>{event.trending ? "hot" : "stable"}</StatusPill>
              </div>
            ))}
          </div>
        </ShellCard>
        <ShellCard>
          <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Live activity</h3>
          <div className="mt-5 space-y-4">
            {demoData.adminDashboard.activities.map((activity) => (
              <div key={activity.title} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                <p className="font-semibold text-[var(--text-primary)]">{activity.title}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{activity.meta}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{activity.timeLabel}</p>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
