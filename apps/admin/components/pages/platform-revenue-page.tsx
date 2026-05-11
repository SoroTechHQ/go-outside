import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, PageGuide, SectionBlock } from "../dashboard-primitives";
import { RevenueAreaChart } from "../charts/RevenueAreaChart";
import { AdminTableControls } from "../AdminTableControls";
import { AdminPagination } from "../AdminPagination";
import { RevenueDataTable, type TransactionRow } from "../revenue/RevenueDataTable";

const TX_SORT_OPTIONS = [
  { label: "Date (newest)", value: "created_at" },
  { label: "Amount (highest)", value: "amount" },
  { label: "Status", value: "status" },
  { label: "Channel", value: "payment_channel" },
]

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

type Props = { searchParams: Record<string, string> }

export async function PlatformRevenuePage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const limit = [25, 50, 100].includes(parseInt(searchParams.limit ?? "", 10))
    ? parseInt(searchParams.limit, 10)
    : 50
  const sort = TX_SORT_OPTIONS.some((o) => o.value === searchParams.sort)
    ? searchParams.sort
    : "created_at"
  const order = searchParams.order === "asc"
  const sort2 = TX_SORT_OPTIONS.some((o) => o.value === searchParams.sort2)
    ? searchParams.sort2
    : ""
  const order2 = searchParams.order2 === "asc"
  const q = searchParams.q?.trim() ?? ""
  const regex = searchParams.regex === "1"
  const offset = (page - 1) * limit

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);

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

  const byDate: Record<string, number> = {};
  for (const p of chartPayments ?? []) {
    const d = (p.created_at as string).slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + (p.amount ?? 0);
  }
  const chartData: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartData.push({ date: key, total: byDate[key] ?? 0 });
  }

  const { data: topEventsRaw } = await supabaseAdmin
    .from("payments")
    .select("event_id, amount, events(title)")
    .eq("status", "paid");

  const eventRevMap: Record<string, { title: string; total: number }> = {};
  for (const row of topEventsRaw ?? []) {
    if (!row.event_id) continue;
    const title = Array.isArray(row.events)
      ? (row.events[0] as { title: string })?.title ?? row.event_id
      : (row.events as { title: string } | null)?.title ?? row.event_id;
    if (!eventRevMap[row.event_id]) eventRevMap[row.event_id] = { title, total: 0 };
    eventRevMap[row.event_id].total += row.amount ?? 0;
  }
  const topEvents = Object.entries(eventRevMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  // Paginated transactions
  let txQuery = supabaseAdmin
    .from("payments")
    .select(
      `id, amount, status, payment_channel, paid_at, created_at, paystack_reference,
       event:events!payments_event_id_fkey(title),
       buyer:users!payments_user_id_fkey(first_name, last_name)`,
      { count: "exact" }
    )

  if (q) {
    if (regex) {
      txQuery = txQuery.filter("paystack_reference", "imatch", q)
    } else {
      txQuery = txQuery.or(`paystack_reference.ilike.%${q}%,status.ilike.%${q}%,payment_channel.ilike.%${q}%`)
    }
  }

  let sortedTxQuery = txQuery.order(sort, { ascending: order })
  if (sort2) sortedTxQuery = sortedTxQuery.order(sort2, { ascending: order2 })
  const { data: transactions, count: filteredCount } = await sortedTxQuery.range(offset, offset + limit - 1)

  const txTotal = filteredCount ?? 0

  const currentParams: Record<string, string> = {
    ...(q && { q }),
    limit: String(limit),
    sort,
    order: order ? "asc" : "desc",
    ...(sort2 && { sort2, order2: order2 ? "asc" : "desc" }),
    ...(regex && { regex: "1" }),
  }

  return (
    <DashboardShell mode="admin" title="Revenue" subtitle="Payments, transactions and financial overview.">
      <div className="space-y-6">
        <PageGuide
          title="Track all payments and financial performance"
          tips={[
            "The 4 tiles show revenue for today, the last 7 days, this month, and all time — all from confirmed payments only.",
            "The area chart shows daily revenue over the last 30 days — spikes usually line up with event launch days.",
            "Top Events shows which events have generated the most revenue across the platform.",
            "Use the search bar to filter transactions by reference, status, or payment channel.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Today" value={fmtGHS(todayTotal)} trend="Today" meta="Paid transactions today" />
          <MetricTile accent="cyan" label="Last 7 days" value={fmtGHS(weekTotal)} trend="7-day" meta="Rolling weekly revenue" />
          <MetricTile accent="violet" label="This month" value={fmtGHS(monthTotal)} trend="MTD" meta="Month-to-date revenue" />
          <MetricTile accent="amber" label="All time" value={fmtGHS(allTotal)} trend="Total" meta="Cumulative paid revenue" />
        </div>

        <SectionBlock title="Payment status" subtitle="Breakdown by transaction state">
          <div className="flex flex-wrap gap-3">
            <MiniPill tone="brand">Paid: {paidCount.count ?? 0}</MiniPill>
            <MiniPill tone="amber">Pending: {pendingCount.count ?? 0}</MiniPill>
            <MiniPill tone="cyan">Refunded: {refundedCount.count ?? 0}</MiniPill>
            <MiniPill tone="coral">Failed: {failedCount.count ?? 0}</MiniPill>
          </div>
        </SectionBlock>

        <SectionBlock title="30-day revenue" subtitle="Daily paid revenue for the last 30 days">
          <RevenueAreaChart data={chartData} />
        </SectionBlock>

        <SectionBlock title="Top 5 events by revenue" subtitle="Events with highest total paid revenue">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["#", "Event", "Total Revenue"].map((h) => (
                    <th key={h} className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{h}</th>
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
                  <tr><td colSpan={3} className="py-6 text-center text-sm text-[var(--text-tertiary)]">No revenue data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        <SectionBlock title="Transactions" subtitle="Click a column header to sort. Use ••• for quick actions.">
          <AdminTableControls
            sortOptions={TX_SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? "asc" : "desc", sort2, order2: order2 ? "asc" : "desc", regex }}
            searchPlaceholder="Search reference, status, channel…"
          />
          <RevenueDataTable transactions={(transactions ?? []) as unknown as TransactionRow[]} searchQuery={q} />
          <AdminPagination total={txTotal} page={page} limit={limit} currentParams={currentParams} />
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
