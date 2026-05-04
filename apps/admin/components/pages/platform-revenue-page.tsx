import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { RevenueAreaChart } from "../charts/RevenueAreaChart";

function sumAmounts(rows: { amount: number }[] | null): number {
  return (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);
}

function fmtGHS(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadgeTone(status: string): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "paid") return "brand";
  if (status === "pending") return "amber";
  if (status === "refunded") return "cyan";
  return "coral";
}

export async function PlatformRevenuePage() {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  const [todayPay, weekPay, monthPay, allPay] = await Promise.all([
    supabaseAdmin.from("payments").select("amount").eq("status", "paid").gte("created_at", todayStart.toISOString()),
    supabaseAdmin.from("payments").select("amount").eq("status", "paid").gte("created_at", weekStart.toISOString()),
    supabaseAdmin.from("payments").select("amount").eq("status", "paid").gte("created_at", monthStart.toISOString()),
    supabaseAdmin.from("payments").select("amount").eq("status", "paid"),
  ]);

  const todayTotal = sumAmounts(todayPay.data);
  const weekTotal = sumAmounts(weekPay.data);
  const monthTotal = sumAmounts(monthPay.data);
  const allTotal = sumAmounts(allPay.data);

  const [paidCount, pendingCount, refundedCount, failedCount] = await Promise.all([
    supabaseAdmin.from("payments").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabaseAdmin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("payments").select("id", { count: "exact", head: true }).eq("status", "refunded"),
    supabaseAdmin.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  const { data: chartPayments } = await supabaseAdmin
    .from("payments")
    .select("amount, created_at")
    .eq("status", "paid")
    .gte("created_at", thirtyAgo.toISOString());

  // Group by date
  const byDate: Record<string, number> = {};
  for (const p of chartPayments ?? []) {
    const d = (p.created_at as string).slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + (p.amount ?? 0);
  }
  // Fill last 30 days
  const chartData: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartData.push({ date: key, total: byDate[key] ?? 0 });
  }

  const { data: transactions } = await supabaseAdmin
    .from("payments")
    .select(`
      id, amount, status, payment_channel, paid_at, created_at, paystack_reference,
      event:events!payments_event_id_fkey(title),
      buyer:users!payments_user_id_fkey(first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: topEventsRaw } = await supabaseAdmin
    .from("payments")
    .select("event_id, amount, events(title)")
    .eq("status", "paid");

  // Group top events by event_id
  const eventRevMap: Record<string, { title: string; total: number }> = {};
  for (const row of topEventsRaw ?? []) {
    if (!row.event_id) continue;
    const title = Array.isArray(row.events)
      ? (row.events[0] as { title: string })?.title ?? row.event_id
      : (row.events as { title: string } | null)?.title ?? row.event_id;
    if (!eventRevMap[row.event_id]) {
      eventRevMap[row.event_id] = { title, total: 0 };
    }
    eventRevMap[row.event_id].total += row.amount ?? 0;
  }
  const topEvents = Object.entries(eventRevMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  return (
    <DashboardShell mode="admin" title="Revenue" subtitle="Payments, transactions and financial overview.">
      <div className="space-y-6">
        <PageHero
          eyebrow="Platform Finance"
          title="Revenue"
          description="Payments, transactions and financial overview."
        />

        {/* KPI Row */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Today"
            value={fmtGHS(todayTotal)}
            trend="Today"
            meta="Paid transactions today"
          />
          <MetricTile
            accent="cyan"
            label="Last 7 days"
            value={fmtGHS(weekTotal)}
            trend="7-day"
            meta="Rolling weekly revenue"
          />
          <MetricTile
            accent="violet"
            label="This month"
            value={fmtGHS(monthTotal)}
            trend="MTD"
            meta="Month-to-date revenue"
          />
          <MetricTile
            accent="amber"
            label="All time"
            value={fmtGHS(allTotal)}
            trend="Total"
            meta="Cumulative paid revenue"
          />
        </div>

        {/* Status breakdown */}
        <SectionBlock title="Payment status" subtitle="Breakdown by transaction state">
          <div className="flex flex-wrap gap-3">
            <MiniPill tone="brand">Paid: {paidCount.count ?? 0}</MiniPill>
            <MiniPill tone="amber">Pending: {pendingCount.count ?? 0}</MiniPill>
            <MiniPill tone="cyan">Refunded: {refundedCount.count ?? 0}</MiniPill>
            <MiniPill tone="coral">Failed: {failedCount.count ?? 0}</MiniPill>
          </div>
        </SectionBlock>

        {/* 30-day chart */}
        <SectionBlock title="30-day revenue" subtitle="Daily paid revenue for the last 30 days">
          <RevenueAreaChart data={chartData} />
        </SectionBlock>

        {/* Top 5 events */}
        <SectionBlock title="Top 5 events by revenue" subtitle="Events with highest total paid revenue">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["#", "Event", "Total Revenue"].map((h) => (
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
                {topEvents.map(([eventId, { title, total }], i) => (
                  <tr key={eventId}>
                    <td className="py-3 pr-4 text-[var(--text-tertiary)]">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{title}</td>
                    <td className="py-3 font-semibold text-[var(--accent-cyan)]">{fmtGHS(total)}</td>
                  </tr>
                ))}
                {topEvents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                      No revenue data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        {/* Transaction table */}
        <SectionBlock title="Recent transactions" subtitle="Last 50 paid transactions">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Buyer", "Event", "Amount", "Channel", "Status", "Date"].map((h) => (
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
                {(transactions ?? []).map((tx) => {
                  const buyer = (tx.buyer as unknown) as { first_name: string; last_name: string } | null;
                  const event = (tx.event as unknown) as { title: string } | null;
                  const buyerName = buyer
                    ? `${buyer.first_name ?? ""} ${buyer.last_name ?? ""}`.trim() || "—"
                    : "—";
                  const eventTitle = event?.title ?? "—";
                  return (
                    <tr key={tx.id}>
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{buyerName}</td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{eventTitle}</td>
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">
                        {fmtGHS(tx.amount ?? 0)}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {tx.payment_channel ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <MiniPill tone={statusBadgeTone(tx.status ?? "")}>
                          {tx.status ?? "unknown"}
                        </MiniPill>
                      </td>
                      <td className="py-3 text-[var(--text-tertiary)]">
                        {tx.created_at ? new Date(tx.created_at as string).toLocaleDateString("en-GH") : "—"}
                      </td>
                    </tr>
                  );
                })}
                {(transactions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
