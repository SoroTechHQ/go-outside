import Link from "next/link";
import { supabaseAdmin } from "../../lib/supabase";
import { ShellCard } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import {
  AccentDot,
  MetricTile,
  MiniPill,
  PageHero,
  SectionBlock,
} from "../dashboard-primitives";
import { AdminRevenueChart } from "../charts/AdminRevenueChart";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function PlatformDashboardPage() {
  // ── KPI queries ──────────────────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: liveEvents },
    { data: payments },
    { count: pendingMod },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    (() => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte("created_at", startOfMonth.toISOString());
    })(),
    supabaseAdmin
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const revenueMTD = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  // ── Activity log ─────────────────────────────────────────────────────────
  const { data: activityLog } = await supabaseAdmin
    .from("admin_activity_log")
    .select("id, action_type, entity_type, details, created_at, admin_id")
    .order("created_at", { ascending: false })
    .limit(10);

  // ── Upcoming events ──────────────────────────────────────────────────────
  const { data: upcomingEvents } = await supabaseAdmin
    .from("events")
    .select("id, title, start_datetime, status, tickets_sold, total_capacity")
    .eq("status", "published")
    .gte("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(5);

  // ── Revenue chart (last 30 days) ─────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentPayments } = await supabaseAdmin
    .from("payments")
    .select("amount, created_at")
    .eq("status", "paid")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Group by YYYY-MM-DD
  const revenueByDate: Record<string, number> = {};
  for (const p of recentPayments ?? []) {
    const day = p.created_at.slice(0, 10);
    revenueByDate[day] = (revenueByDate[day] ?? 0) + Number(p.amount);
  }
  const revenueChartData = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  return (
    <DashboardShell
      mode="admin"
      title="Dashboard"
      subtitle="Platform health at a glance."
    >
      <div className="space-y-6">
        <PageHero
          eyebrow="Live data"
          title="Platform at a glance."
          description="Real-time metrics pulled directly from the GoOutside database. User registrations, live events, gross revenue month-to-date, and moderation queue pressure — all in one place."
        />

        {/* KPI tiles */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Total users"
            meta="Registered accounts on the platform"
            trend="All time"
            value={String(totalUsers ?? 0)}
          />
          <MetricTile
            accent="cyan"
            label="Live events"
            meta="Currently published and discoverable"
            trend="Published"
            value={String(liveEvents ?? 0)}
          />
          <MetricTile
            accent="violet"
            label="Revenue MTD"
            meta="Gross revenue from paid tickets this month"
            trend="GHS"
            value={`₵${revenueMTD.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <MetricTile
            accent="coral"
            label="Pending moderation"
            meta="Items in queue awaiting review"
            trend={pendingMod ? `${pendingMod} waiting` : "Queue clear"}
            value={String(pendingMod ?? 0)}
          />
        </div>

        {/* Revenue chart */}
        <SectionBlock
          title="Revenue (last 30 days)"
          subtitle="Daily GHS revenue from confirmed ticket payments"
          action={<MiniPill tone="brand">Live</MiniPill>}
        >
          <AdminRevenueChart data={revenueChartData} />
        </SectionBlock>

        {/* Upcoming events + Recent activity */}
        <div className="grid gap-5 xl:grid-cols-[1.4fr,1fr]">
          {/* Upcoming events table */}
          <SectionBlock
            action={
              <Link className="text-xs font-semibold text-[var(--accent-cyan)] hover:underline" href="/events">
                View all
              </Link>
            }
            subtitle="Next 5 published events sorted by date"
            title="Upcoming events"
          >
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No upcoming events.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {["Event", "Date", "Tickets", "Status"].map((h) => (
                        <th
                          key={h}
                          className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {upcomingEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-[var(--text-primary)]">{ev.title}</div>
                        </td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">
                          {ev.start_datetime ? formatDate(ev.start_datetime) : "TBD"}
                        </td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">
                          {ev.tickets_sold ?? 0} / {ev.total_capacity ?? "∞"}
                        </td>
                        <td className="py-4">
                          <MiniPill tone="brand">{ev.status}</MiniPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionBlock>

          {/* Recent activity */}
          <ShellCard className="bg-[linear-gradient(135deg,rgba(167,139,250,0.14),rgba(56,189,248,0.08),transparent_75%),var(--bg-card)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">
              Recent activity
            </p>
            {!activityLog || activityLog.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-tertiary)]">No recent activity.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {activityLog.map((log, index) => (
                  <div
                    key={log.id}
                    className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--bg-card)]">
                        <AccentDot tone={(["brand", "cyan", "violet", "coral"] as const)[index % 4]} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold capitalize text-[var(--text-primary)]">
                          {log.action_type?.replace(/_/g, " ")}
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                          {log.entity_type ?? "—"}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          {relativeTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
