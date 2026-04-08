import Link from "next/link";
import { demoData, events, getCategoryBySlug } from "@gooutside/demo-data";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { UsersChart } from "../../components/charts/UsersChart";
import { DashboardShell } from "../../components/dashboard-shell";

const statusColors: Record<string, string> = {
  live: "bg-[rgba(184,255,60,0.1)] text-[var(--neon)] border border-[rgba(184,255,60,0.2)]",
  pending: "bg-[rgba(255,180,50,0.1)] text-[#FFB432] border border-[rgba(255,180,50,0.2)]",
  review: "bg-[rgba(232,93,138,0.1)] text-[var(--pink)] border border-[rgba(232,93,138,0.2)]",
};

export default function OrganizerDashboardPage() {
  const { stats, revenueSeries, salesSeries, countdown, recentReviews } = demoData.organizerDashboard;
  const myEvents = events.slice(0, 4);

  return (
    <DashboardShell
      mode="organizer"
      title="Organizer Dashboard"
      subtitle="Revenue, ticket movement, and operational priorities"
    >
      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const toneClass =
            stat.tone === "neon" ? "text-[var(--neon)]" :
            stat.tone === "pink" ? "text-[var(--pink)]" : "text-[var(--blue)]";
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[0_8px_24px_rgba(26,58,26,0.07)]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{stat.label}</p>
              <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">{stat.value}</p>
              <p className={`mt-2 text-xs font-semibold ${toneClass}`}>{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h3 className="font-display text-xl italic text-[var(--text-primary)]">Revenue by Month</h3>
          <p className="mb-2 mt-1 text-xs text-[var(--text-secondary)]">Six-month booking revenue trend</p>
          <RevenueChart values={revenueSeries} />
        </div>
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h3 className="font-display text-xl italic text-[var(--text-primary)]">Ticket Sales</h3>
          <p className="mb-2 mt-1 text-xs text-[var(--text-secondary)]">Weekly ticket velocity</p>
          <UsersChart values={salesSeries} />
        </div>
      </div>

      {/* Events table + sidebar */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-xl italic text-[var(--text-primary)]">My Events</h3>
            <Link href="/organizer/events" className="text-xs font-semibold text-[var(--neon)] hover:underline">
              See all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Event", "Category", "Date", "Status", "Sold / Cap"].map((col) => (
                    <th key={col} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {myEvents.map((event) => {
                  const cat = getCategoryBySlug(event.categorySlug);
                  const statusKey = event.status in statusColors ? event.status : "live";
                  return (
                    <tr key={event.id}>
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
                      <td className="py-3.5 text-[var(--text-secondary)]">{event.capacityLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/organizer/events/new"
                className="flex items-center justify-center rounded-full bg-[var(--neon)] px-4 py-2.5 text-sm font-bold text-[#020702] shadow-[0_0_18px_rgba(184,255,60,0.25)] hover:shadow-[0_0_24px_rgba(184,255,60,0.35)]"
              >
                + New Event
              </Link>
              <Link
                href="/organizer/analytics"
                className="flex items-center justify-center rounded-full border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">{countdown.title}</p>
            <p className="mt-3 font-display text-4xl italic text-[var(--text-primary)]">{countdown.value}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{countdown.meta}</p>
          </div>

          {/* Recent reviews */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
            <h3 className="font-display text-xl italic text-[var(--text-primary)]">Recent reviews</h3>
            <div className="mt-4 space-y-3">
              {recentReviews.map((r) => (
                <div key={r.author} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{r.author}</p>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
