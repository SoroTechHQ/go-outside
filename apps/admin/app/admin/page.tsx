import Link from "next/link";
import { demoData, events, getCategoryBySlug } from "@gooutside/demo-data";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { UsersChart } from "../../components/charts/UsersChart";
import { CategoryDonut } from "../../components/charts/CategoryDonut";
import { DashboardShell } from "../../components/dashboard-shell";

const toneClasses: Record<string, string> = {
  neon: "text-[var(--neon)]",
  pink: "text-[var(--pink)]",
  blue: "text-[var(--blue)]",
};

const statusColors: Record<string, string> = {
  live: "bg-[var(--status-live-bg)] text-[var(--status-live-text)] border border-[var(--status-live-border)]",
  pending: "bg-[rgba(255,180,50,0.1)] text-[#FFB432] border border-[rgba(255,180,50,0.2)]",
  review: "bg-[rgba(232,93,138,0.1)] text-[var(--pink)] border border-[rgba(232,93,138,0.2)]",
  draft: "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]",
};

export default function AdminDashboardPage() {
  const { stats, revenueTrend, userGrowth, categoryMix, activities } = demoData.adminDashboard;
  const recentEvents = events.slice(0, 5);

  return (
    <DashboardShell
      mode="admin"
      title="Platform Dashboard"
      subtitle="Overview, moderation load, and live commercial health"
    >
      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[0_8px_24px_rgba(26,58,26,0.07)]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{stat.label}</p>
            <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">{stat.value}</p>
            <p className={`mt-2 text-xs font-semibold ${toneClasses[stat.tone] ?? "text-[var(--neon)]"}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr,1fr,0.8fr]">
        {/* Revenue area chart */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl italic text-[var(--text-primary)]">Monthly Revenue</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Gross revenue — last 6 months</p>
            </div>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              6 mo
            </span>
          </div>
          <RevenueChart values={revenueTrend} />
        </div>

        {/* New users bar chart */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="mb-2">
            <h3 className="font-display text-xl italic text-[var(--text-primary)]">New Users</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Weekly signup velocity</p>
          </div>
          <UsersChart values={userGrowth} />
        </div>

        {/* Category donut */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="mb-2">
            <h3 className="font-display text-xl italic text-[var(--text-primary)]">Event Mix</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">By category</p>
          </div>
          <CategoryDonut items={categoryMix} />
        </div>
      </div>

      {/* Events table + activity feed */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr,1fr]">
        {/* Events table */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-xl italic text-[var(--text-primary)]">Recent Events</h3>
            <Link href="/admin/events" className="text-xs font-semibold text-[var(--neon)] hover:underline">
              See all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Event", "Category", "Date", "Status", "Actions"].map((col) => (
                    <th key={col} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {recentEvents.map((event) => {
                  const cat = getCategoryBySlug(event.categorySlug);
                  const statusKey = event.status in statusColors ? event.status : "draft";
                  return (
                    <tr key={event.id} className="group">
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-[var(--text-primary)]">{event.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)]">{cat?.name}</td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)]">{event.dateLabel}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[statusKey]}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex gap-2">
                          <button className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neon)] hover:bg-[var(--bg-card-alt)]">
                            Feature
                          </button>
                          <button className="rounded-lg border border-[rgba(232,93,138,0.2)] bg-[rgba(232,93,138,0.08)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pink)] hover:bg-[rgba(232,93,138,0.14)]">
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live activity */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h3 className="mb-5 font-display text-xl italic text-[var(--text-primary)]">Live Activity</h3>
          <div className="space-y-3">
            {activities.map((a) => (
              <div
                key={a.title}
                className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--status-live-bg)] text-[var(--status-live-text)]">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{a.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{a.meta}</p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{a.timeLabel}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pending reviews callout */}
          <div className="mt-4 rounded-xl border border-[rgba(232,93,138,0.2)] bg-[rgba(232,93,138,0.06)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pink)]">Action needed</p>
            <p className="mt-2 font-display text-2xl italic text-[var(--text-primary)]">14 pending reviews</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Events awaiting moderation approval.</p>
            <Link
              href="/admin/events"
              className="mt-3 inline-block rounded-full bg-[var(--pink)] px-4 py-2 text-xs font-bold text-white"
            >
              Review queue →
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
