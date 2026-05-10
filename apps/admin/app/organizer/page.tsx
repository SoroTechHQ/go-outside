import Link from "next/link";
import { supabaseAdmin } from "../../lib/supabase";
import { ShellCard } from "@gooutside/ui";
import { DashboardShell } from "../../components/dashboard-shell";
import { MiniPill, SectionBlock } from "../../components/dashboard-primitives";
import { AdminRevenueChart } from "../../components/charts/AdminRevenueChart";

function fmtGHS(n: number) {
  return `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const statusColors: Record<string, string> = {
  published: "bg-[var(--status-live-bg)] text-[var(--status-live-text)] border border-[var(--status-live-border)]",
  draft: "bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]",
  cancelled: "bg-[rgba(251,113,133,0.1)] text-[var(--accent-coral)] border border-[rgba(251,113,133,0.2)]",
};

export default async function OrganizerDashboardPage() {
  // Pick the highest-revenue verified organizer as the demo organizer
  const { data: orgProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select(`
      id, organization_name, status, verified_at, total_events, total_revenue,
      user_id,
      organizer:users!organizer_profiles_user_id_fkey(id, first_name, last_name, email)
    `)
    .eq("status", "active")
    .not("verified_at", "is", null)
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  const userId = orgProfile?.user_id ?? null;

  // Fetch organizer's events
  const { data: myEvents } = userId
    ? await supabaseAdmin
        .from("events")
        .select("id, title, status, start_datetime, tickets_sold, total_capacity, location_name")
        .eq("organizer_id", userId)
        .order("start_datetime", { ascending: false })
        .limit(20)
    : { data: [] };

  const events = myEvents ?? [];

  // Aggregate stats
  const publishedCount = events.filter((e) => e.status === "published").length;
  const totalTicketsSold = events.reduce((s, e) => s + (e.tickets_sold ?? 0), 0);
  const totalRevenue = Number(orgProfile?.total_revenue ?? 0);

  // Next upcoming event
  const upcomingEvent = events
    .filter((e) => e.status === "published" && e.start_datetime && new Date(e.start_datetime) > new Date())
    .sort((a, b) => new Date(a.start_datetime!).getTime() - new Date(b.start_datetime!).getTime())[0] ?? null;

  const daysUntilNext = upcomingEvent?.start_datetime
    ? Math.max(0, Math.ceil((new Date(upcomingEvent.start_datetime).getTime() - Date.now()) / 86_400_000))
    : null;

  // Revenue chart: daily from payments on organizer's events (last 180 days)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const eventIds = events.map((e) => e.id).filter(Boolean);
  const { data: recentPayments } = eventIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("amount, created_at")
        .eq("status", "paid")
        .in("event_id", eventIds)
        .gte("created_at", sixMonthsAgo.toISOString())
    : { data: [] };

  const revenueByDate: Record<string, number> = {};
  for (const p of recentPayments ?? []) {
    const day = (p.created_at as string).slice(0, 10);
    revenueByDate[day] = (revenueByDate[day] ?? 0) + Number(p.amount);
  }
  const revenueChartData = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  const orgName = orgProfile?.organization_name ?? "Your Organisation";
  const orgUser = orgProfile?.organizer as { first_name?: string; last_name?: string } | null;
  const ownerName = orgUser ? `${orgUser.first_name ?? ""} ${orgUser.last_name ?? ""}`.trim() : "Organizer";

  return (
    <DashboardShell
      mode="organizer"
      title="Organizer Dashboard"
      subtitle="Revenue, ticket movement, and operational priorities"
    >
      <div className="space-y-6">
        {/* Organizer identity bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-5 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-[#0e1410]">
            {orgName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">{orgName}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{ownerName}</p>
          </div>
          <MiniPill tone="brand">Verified</MiniPill>
        </div>

        {/* KPI stat cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {([
            { label: "Total events", value: String(events.length), tone: "neon", trend: "All listings" },
            { label: "Published", value: String(publishedCount), tone: "neon", trend: "Live now" },
            { label: "Tickets sold", value: totalTicketsSold.toLocaleString(), tone: "pink", trend: "Across all events" },
            { label: "Total revenue", value: fmtGHS(totalRevenue), tone: "blue", trend: "All time" },
          ] as const).map((stat) => {
            const toneClass =
              stat.tone === "neon" ? "text-[var(--neon)]" :
              stat.tone === "pink" ? "text-[var(--pink)]" : "text-[var(--blue)]";
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[0_8px_24px_rgba(26,58,26,0.07)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{stat.label}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
                <p className={`mt-2 text-xs font-semibold ${toneClass}`}>{stat.trend}</p>
              </div>
            );
          })}
        </div>

        {/* Revenue chart */}
        <SectionBlock title="Revenue trend" subtitle="Daily revenue from confirmed ticket payments (last 6 months)">
          {revenueChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No payment data yet for your events.</p>
          ) : (
            <AdminRevenueChart data={revenueChartData} />
          )}
        </SectionBlock>

        {/* Events table + sidebar */}
        <div className="grid gap-5 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">My Events</h3>
              <Link href="/organizer/events" className="text-xs font-semibold text-[var(--neon)] hover:underline">
                See all →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="py-4 text-sm text-[var(--text-tertiary)]">No events yet. Create your first event to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {["Event", "Date", "Status", "Sold / Cap"].map((col) => (
                        <th key={col} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {events.slice(0, 5).map((event) => {
                      const statusKey = (event.status ?? "draft") in statusColors ? (event.status ?? "draft") : "draft";
                      return (
                        <tr key={event.id}>
                          <td className="py-3.5 pr-4">
                            <div className="font-medium text-[var(--text-primary)]">{event.title}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{event.location_name ?? "—"}</div>
                          </td>
                          <td className="py-3.5 pr-4 text-[var(--text-secondary)]">
                            {event.start_datetime ? formatDate(event.start_datetime) : "TBD"}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[statusKey]}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-[var(--text-secondary)]">
                            {event.tickets_sold ?? 0} / {event.total_capacity ?? "∞"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <ShellCard>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">Quick actions</p>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/organizer/events/new"
                  className="flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-[#0e1410] shadow-[0_4px_14px_rgba(95,191,42,0.20)] hover:brightness-[1.04]"
                >
                  + New Event
                </Link>
                <Link
                  href="/organizer/analytics"
                  className="flex items-center justify-center rounded-full border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  View Analytics
                </Link>
                <Link
                  href="/organizer/payouts"
                  className="flex items-center justify-center rounded-full border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  View Payouts
                </Link>
              </div>
            </ShellCard>

            {upcomingEvent && (
              <ShellCard>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">Next event</p>
                <p className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)]">
                  {daysUntilNext === 0 ? "Today!" : `${daysUntilNext}d away`}
                </p>
                <p className="mt-2 font-semibold text-[var(--text-primary)]">{upcomingEvent.title}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {formatDate(upcomingEvent.start_datetime!)} · {upcomingEvent.tickets_sold ?? 0} tickets sold
                </p>
              </ShellCard>
            )}

            <ShellCard>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">Platform summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Published events</span>
                  <span className="font-semibold text-[var(--text-primary)]">{publishedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Total tickets sold</span>
                  <span className="font-semibold text-[var(--text-primary)]">{totalTicketsSold.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">All-time revenue</span>
                  <span className="font-semibold text-[var(--neon)]">{fmtGHS(totalRevenue)}</span>
                </div>
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
