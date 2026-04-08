import {
  demoData,
  events,
  getCategoryBySlug,
} from "@gooutside/demo-data";
import {
  BarStripes,
  Button,
  ChartCard,
  DataTable,
  LineSpark,
  ShellCard,
  StatCard,
  StatusPill,
} from "@gooutside/ui";
import { DashboardShell } from "../../components/dashboard-shell";

export default function OrganizerDashboardPage() {
  const stats = demoData.organizerDashboard.stats;
  const organizerEvents = events.slice(0, 4);

  return (
    <DashboardShell
      mode="organizer"
      subtitle="Revenue, ticket movement, and near-term operational priorities."
      title="Organizer Dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} tone={stat.tone as "neon" | "pink" | "blue"} trend={stat.trend} value={stat.value} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr,1fr]">
        <ChartCard subtitle="Six-month booking revenue trend." title="Revenue by month">
          <LineSpark values={demoData.organizerDashboard.revenueSeries} />
        </ChartCard>
        <ChartCard subtitle="Ticket velocity as a simple demand line." title="Ticket sales trend">
          <BarStripes values={demoData.organizerDashboard.salesSeries} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <DataTable
          columns={["Title", "Category", "Date", "Status", "Sold / Cap"]}
          rows={organizerEvents.map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            return [
              <div key={`${event.slug}-title`}>
                <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
              </div>,
              category?.name ?? "Category",
              `${event.dateLabel} · ${event.timeLabel}`,
              <StatusPill key={`${event.slug}-status`} tone={event.status === "pending" ? "pending" : event.status === "review" ? "review" : "live"}>{event.status}</StatusPill>,
              event.capacityLabel,
            ];
          })}
        />
        <div className="space-y-5">
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">Quick actions</p>
            <div className="mt-5 grid gap-3">
              <Button href="/organizer/events/new">New Event</Button>
              <Button variant="ghost">View Analytics</Button>
            </div>
          </ShellCard>
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">{demoData.organizerDashboard.countdown.title}</p>
            <h3 className="mt-3 font-display text-4xl italic text-[var(--text-primary)]">{demoData.organizerDashboard.countdown.value}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{demoData.organizerDashboard.countdown.meta}</p>
          </ShellCard>
          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Recent reviews</h3>
            <div className="mt-4 space-y-4">
              {demoData.organizerDashboard.recentReviews.map((review) => (
                <div key={review.author} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{review.author}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{review.body}</p>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
