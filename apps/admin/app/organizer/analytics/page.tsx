import { supabaseAdmin } from "../../../lib/supabase";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, PageGuide, SectionBlock } from "../../../components/dashboard-primitives";
import { MultiBarChart, MultiLineChart } from "../../../components/charts/AdminCharts";

function getWeekLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset * 7);
  return `W${Math.ceil((d.getDate()) / 7)}`;
}

export default async function OrganizerAnalyticsPage() {
  // Fetch organizer
  const { data: orgProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select("user_id, organization_name, total_events, total_revenue")
    .eq("status", "active")
    .not("verified_at", "is", null)
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  const userId = orgProfile?.user_id ?? null;

  // Fetch organizer's events
  const { data: events } = userId
    ? await supabaseAdmin
        .from("events")
        .select("id, title, tickets_sold, total_capacity")
        .eq("organizer_id", userId)
        .limit(50)
    : { data: [] };

  const allEvents = events ?? [];
  const eventIds = allEvents.map((e) => e.id);

  // Tickets sold by week (last 6 weeks)
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const { data: tickets } = eventIds.length > 0
    ? await supabaseAdmin
        .from("tickets")
        .select("created_at")
        .in("event_id", eventIds)
        .neq("status", "refunded")
        .gte("created_at", sixWeeksAgo.toISOString())
    : { data: [] };

  // Group tickets by week
  const weeklyTickets: number[] = [0, 0, 0, 0, 0, 0];
  const now = Date.now();
  for (const t of tickets ?? []) {
    const diff = now - new Date(t.created_at as string).getTime();
    const weekIndex = Math.floor(diff / (7 * 86_400_000));
    if (weekIndex >= 0 && weekIndex < 6) {
      weeklyTickets[5 - weekIndex]++;
    }
  }

  // Revenue by week (last 6 weeks)
  const { data: payments } = eventIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("amount, created_at")
        .eq("status", "paid")
        .in("event_id", eventIds)
        .gte("created_at", sixWeeksAgo.toISOString())
    : { data: [] };

  const weeklyRevenue: number[] = [0, 0, 0, 0, 0, 0];
  for (const p of payments ?? []) {
    const diff = now - new Date(p.created_at as string).getTime();
    const weekIndex = Math.floor(diff / (7 * 86_400_000));
    if (weekIndex >= 0 && weekIndex < 6) {
      weeklyRevenue[5 - weekIndex] += Number(p.amount ?? 0);
    }
  }

  const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6"];

  // Conversion: average (tickets_sold / total_capacity)
  const conversionEvents = allEvents.filter((e) => e.total_capacity && e.total_capacity > 0);
  const avgConversion = conversionEvents.length > 0
    ? Math.round(conversionEvents.reduce((s, e) => s + ((e.tickets_sold ?? 0) / (e.total_capacity ?? 1)), 0) / conversionEvents.length * 100)
    : 0;

  // Total tickets sold and revenue
  const totalTickets = allEvents.reduce((s, e) => s + (e.tickets_sold ?? 0), 0);
  const totalRevenue = Number(orgProfile?.total_revenue ?? 0);
  const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);

  // Revenue this month vs last month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const thisMonthRev = (payments ?? [])
    .filter((p) => new Date(p.created_at as string) >= monthStart)
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const lastMonthRev = (payments ?? [])
    .filter((p) => {
      const d = new Date(p.created_at as string);
      return d >= lastMonthStart && d < monthStart;
    })
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);

  const revPaceLabel = lastMonthRev > 0
    ? `${thisMonthRev >= lastMonthRev ? "+" : ""}${Math.round((thisMonthRev - lastMonthRev) / lastMonthRev * 100)}% vs last month`
    : "This month";

  return (
    <DashboardShell mode="organizer" subtitle="Demand, revenue, and launch diagnostics" title="Analytics">
      <div className="space-y-6">
        <PageGuide
          title="See how your events are performing"
          tips={[
            "Ticket Conversion shows the percentage of your event capacity that has been sold on average.",
            "The Sales Trend chart shows weekly ticket sales — use it to plan promotions around slow weeks.",
            "Revenue Pace compares this month's income to last month so you can spot growth or decline early.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Ticket conversion"
            meta="Average capacity sold across events"
            trend={`${avgConversion}%`}
            value={`${avgConversion}%`}
          />
          <MetricTile
            accent="cyan"
            label="Revenue this month"
            meta="Confirmed ticket payments"
            trend={revPaceLabel}
            value={`₵${thisMonthRev.toLocaleString("en-GH", { minimumFractionDigits: 0 })}`}
          />
          <MetricTile
            accent="violet"
            label="Total tickets sold"
            meta="Across all events"
            trend="All time"
            value={totalTickets.toLocaleString()}
          />
          <MetricTile
            accent="amber"
            label="Total events"
            meta="Your listed events"
            trend="All time"
            value={String(allEvents.length)}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionBlock subtitle="Weekly ticket sales (last 6 weeks)" title="Sales trend">
            <MultiLineChart
              categories={weekLabels}
              series={[
                { name: "Tickets sold", data: weeklyTickets, tone: "brand" },
              ]}
            />
          </SectionBlock>
          <SectionBlock subtitle="Weekly revenue from confirmed payments (GHS)" title="Revenue by week">
            <MultiBarChart
              categories={weekLabels}
              series={[
                { name: "Revenue (GHS)", data: weeklyRevenue.map((v) => Math.round(v)), tone: "cyan" },
              ]}
            />
          </SectionBlock>
        </div>
      </div>
    </DashboardShell>
  );
}
