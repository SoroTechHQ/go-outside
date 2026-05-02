import { ChartBar, Compass, Eye, Funnel, Star, TrendUp, UsersThree } from "@phosphor-icons/react/dist/ssr";
import {
  getOrganizerAudienceData,
  getOrganizerDashboardData,
} from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { supabaseAdmin } from "../../../lib/supabase";

async function getEngagementFunnel(userId: string) {
  const { data: eventIds } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("organizer_id", userId);

  if (!eventIds?.length) return null;

  const ids = eventIds.map((e) => e.id);
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();

  const { data: edges } = await supabaseAdmin
    .from("graph_edges")
    .select("edge_type, dwell_ms")
    .in("to_id", ids)
    .eq("to_type", "event")
    .gte("created_at", since);

  if (!edges?.length) return null;

  const byType = edges.reduce(
    (acc, e) => {
      acc[e.edge_type] = (acc[e.edge_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dwellEdges = edges.filter((e) => e.dwell_ms);
  const avgDwell = dwellEdges.length
    ? Math.round(dwellEdges.reduce((s, e) => s + (e.dwell_ms ?? 0), 0) / dwellEdges.length / 1000)
    : 0;

  return {
    impressions: byType["impression"] ?? 0,
    cardOpens: byType["viewed"] ?? 0,
    detailViews: byType["detail_view"] ?? 0,
    ticketClicks: byType["clicked"] ?? 0,
    purchases: byType["purchased"] ?? 0,
    avgDwellSeconds: avgDwell,
  };
}

function FunnelBar({
  label,
  count,
  total,
  opacity,
}: {
  label: string;
  count: number;
  total: number;
  opacity: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const width = total > 0 ? Math.max(2, (count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 shrink-0 text-[12px] text-[var(--text-secondary)]">{label}</div>
      <div className="flex-1">
        <div className="h-6 rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-6 rounded-full transition-[width]"
            style={{
              width: `${width}%`,
              backgroundColor: `rgba(95,191,42,${opacity})`,
            }}
          />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
          {count.toLocaleString()}
        </span>
        <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">{pct}%</span>
      </div>
    </div>
  );
}

export default async function OrganizerAnalyticsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const isOrganizer = user.role === "organizer" || user.role === "admin";
  const dashboard = isOrganizer ? await getOrganizerDashboardData(user.id) : null;

  if (!dashboard) return null;

  const [audience, funnel] = await Promise.all([
    Promise.resolve(getOrganizerAudienceData(dashboard)),
    getEngagementFunnel(user.id),
  ]);

  const { overview } = dashboard;
  const kpis = [
    {
      icon: <Eye size={18} weight="fill" />,
      label: "Event views",
      value: overview.eventViews.toLocaleString(),
      sub: overview.eventViewsDelta,
    },
    {
      icon: <TrendUp size={18} weight="fill" />,
      label: "Conversion rate",
      value: `${overview.conversionRate}%`,
      sub: "Ticket clicks → purchases",
    },
    {
      icon: <UsersThree size={18} weight="fill" />,
      label: "Followers",
      value: overview.followerCount.toLocaleString(),
      sub: overview.followerDelta,
    },
    {
      icon: <ChartBar size={18} weight="fill" />,
      label: "Revenue (GHS)",
      value: overview.revenue.toLocaleString(),
      sub: overview.revenueDelta,
    },
  ];

  const funnelRows = funnel
    ? [
        { label: "Impressions", count: funnel.impressions, opacity: 1 },
        { label: "Card opens", count: funnel.cardOpens, opacity: 0.78 },
        { label: "Detail views", count: funnel.detailViews, opacity: 0.58 },
        { label: "Ticket clicks", count: funnel.ticketClicks, opacity: 0.4 },
        { label: "Purchases", count: funnel.purchases, opacity: 0.25 },
      ]
    : null;

  return (
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Growth
        </p>
        <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Last 30 days across all events.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]/12 text-[var(--brand)]">
              {kpi.icon}
            </span>
            <p className="mt-3 text-[1.4rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">
              {kpi.value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              {kpi.label}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Engagement funnel */}
        {funnelRows ? (
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="flex items-center gap-2">
              <Funnel size={16} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Engagement funnel</p>
            </div>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              How people move from impression to purchase.
              {funnel?.avgDwellSeconds
                ? ` Avg dwell: ${funnel.avgDwellSeconds}s.`
                : ""}
            </p>
            <div className="mt-5 space-y-3">
              {funnelRows.map((row) => (
                <FunnelBar
                  key={row.label}
                  count={row.count}
                  label={row.label}
                  opacity={row.opacity}
                  total={funnelRows[0].count}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
            <Funnel size={28} className="text-[var(--text-tertiary)]" weight="thin" />
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
              Funnel data will appear once your events have been viewed.
            </p>
          </div>
        )}

        {/* Audience breakdown */}
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="flex items-center gap-2">
              <UsersThree size={16} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Pulse tiers</p>
            </div>
            <div className="mt-4 space-y-3">
              {audience.pulseBreakdown.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[var(--text-secondary)]">{row.label}</span>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {row.percentage}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--brand)]"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Top neighbourhoods</p>
            </div>
            <div className="mt-4 space-y-2">
              {audience.neighbourhoods.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-[12px] bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px]"
                >
                  <span className="text-[var(--text-primary)]">{row.name}</span>
                  <span className="font-semibold tabular-nums text-[var(--brand)]">{row.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Age breakdown */}
      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[var(--brand)]" weight="fill" />
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Age bands</p>
        </div>
        <div className="mt-4 flex items-end gap-3 h-32">
          {audience.ageBands.map((band) => (
            <div key={band.label} className="flex flex-1 flex-col items-center gap-2">
              <p className="text-[11px] font-semibold tabular-nums text-[var(--text-primary)]">
                {band.share}%
              </p>
              <div className="flex w-full items-end">
                <div
                  className="w-full rounded-t-[10px] bg-[var(--brand)]/60 transition-all"
                  style={{ height: `${(band.share / 40) * 80}px` }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">{band.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
