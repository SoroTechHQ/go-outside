import Link from "next/link";
import { BookmarkSimple, ChartBar, Compass, CursorClick, Eye, Funnel, Star, Ticket, TrendUp, UsersThree } from "@phosphor-icons/react/dist/ssr";
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
    (acc, e) => { acc[e.edge_type] = (acc[e.edge_type] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const dwellEdges = edges.filter((e) => e.dwell_ms);
  const avgDwell = dwellEdges.length
    ? Math.round(dwellEdges.reduce((s, e) => s + (e.dwell_ms ?? 0), 0) / dwellEdges.length / 1000)
    : 0;

  return {
    impressions:      byType["impression"]   ?? 0,
    cardOpens:        byType["viewed"]        ?? 0,
    detailViews:      byType["detail_view"]   ?? 0,
    ticketClicks:     byType["clicked"]       ?? 0,
    purchases:        byType["purchased"]     ?? 0,
    avgDwellSeconds:  avgDwell,
  };
}

/* ── shared sub-components ── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)] ${className}`}>
      {children}
    </div>
  );
}

function AccentCard({
  label, value, sub, icon, accent,
}: { label: string; value: string; sub: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}1a`, color: accent }}>
          {icon}
        </span>
        <p className="mt-4 text-[2.1rem] font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)]">{value}</p>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</p>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{sub}</p>
      </div>
      <div className="pointer-events-none absolute -bottom-5 -right-5 h-16 w-16 rounded-full opacity-[0.06]" style={{ background: accent }} />
    </div>
  );
}

function FunnelBar({ label, count, total, accent }: { label: string; count: number; total: number; accent: string }) {
  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
  const width = total > 0 ? Math.max(2, (count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 shrink-0 text-[12px] text-[var(--text-secondary)]">{label}</div>
      <div className="flex-1">
        <div className="h-5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div className="h-5 rounded-full transition-[width]" style={{ width: `${width}%`, background: accent }} />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{count.toLocaleString()}</span>
        <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">{pct}%</span>
      </div>
    </div>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold tabular-nums text-[var(--text-primary)]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div className="h-1.5 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function OrganizerAnalyticsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const isOrganizer = user.role === "organizer" || user.role === "admin";
  const dashboard   = isOrganizer ? await getOrganizerDashboardData(user.id) : null;
  if (!dashboard) return null;

  const [audience, funnel] = await Promise.all([
    Promise.resolve(getOrganizerAudienceData(dashboard)),
    getEngagementFunnel(user.id),
  ]);

  const { overview } = dashboard;

  const kpis = [
    { icon: <Eye      size={18} weight="fill" />, accent: "#2f8f45", label: "Event views",     value: overview.eventViews.toLocaleString(),    sub: overview.eventViewsDelta },
    { icon: <TrendUp  size={18} weight="fill" />, accent: "#3b82f6", label: "Conversion rate", value: `${overview.conversionRate}%`,            sub: "Ticket clicks → purchases" },
    { icon: <UsersThree size={18} weight="fill" />, accent: "#8b5cf6", label: "Followers",     value: overview.followerCount.toLocaleString(), sub: overview.followerDelta },
    { icon: <ChartBar size={18} weight="fill" />, accent: "#f59e0b", label: "Revenue (GHS)",    value: overview.revenue.toLocaleString(),        sub: overview.revenueDelta },
  ];

  const funnelRows = funnel
    ? [
        { label: "Impressions",   count: funnel.impressions,   opacity: 1.0  },
        { label: "Card opens",    count: funnel.cardOpens,     opacity: 0.78 },
        { label: "Detail views",  count: funnel.detailViews,   opacity: 0.58 },
        { label: "Ticket clicks", count: funnel.ticketClicks,  opacity: 0.4  },
        { label: "Purchases",     count: funnel.purchases,     opacity: 0.25 },
      ]
    : null;

  return (
    <div>
      {/* ── Hero header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Growth</p>
        <h1 className="relative mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Analytics</h1>
        <p className="relative mt-1 text-[13px] text-[var(--text-secondary)]">Last 30 days across all events.</p>
      </div>

      <div className="space-y-5 p-5 md:p-7">
        {/* ── KPI row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <AccentCard key={k.label} {...k} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {/* ── Engagement funnel ──────────────────────────── */}
          {funnelRows ? (
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                  <Funnel size={15} weight="fill" style={{ color: "var(--brand)" }} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">Engagement funnel</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Impression → purchase.{funnel?.avgDwellSeconds ? ` Avg dwell: ${funnel.avgDwellSeconds}s.` : ""}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {funnelRows.map((row, i) => (
                  <FunnelBar
                    key={row.label}
                    count={row.count}
                    label={row.label}
                    total={funnelRows[0].count}
                    accent={`rgba(47,143,69,${row.opacity})`}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
                <Funnel size={22} weight="thin" style={{ color: "var(--text-tertiary)" }} />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-[var(--text-primary)]">No funnel data yet</p>
              <p className="mt-1 max-w-[240px] text-[12px] text-[var(--text-secondary)]">
                Funnel data appears once your events have been viewed.
              </p>
            </Card>
          )}

          {/* ── Audience breakdown ─────────────────────────── */}
          <div className="space-y-4">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                  <UsersThree size={15} weight="fill" style={{ color: "var(--brand)" }} />
                </span>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">Pulse tiers</p>
              </div>
              <div className="space-y-4">
                {audience.pulseBreakdown.map((row) => (
                  <ProgressRow key={row.label} label={row.label} pct={row.percentage} />
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                  <Compass size={15} weight="fill" style={{ color: "var(--brand)" }} />
                </span>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">Top neighbourhoods</p>
              </div>
              <div className="space-y-2">
                {audience.neighbourhoods.map((row, i) => (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="w-5 text-center text-[10px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                    <span className="flex-1 text-[13px] text-[var(--text-primary)]">{row.name}</span>
                    <span className="text-[13px] font-bold tabular-nums text-[var(--brand)]">{row.share}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Age bands ──────────────────────────────────────── */}
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Star size={15} weight="fill" style={{ color: "#f59e0b" }} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Age breakdown</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Distribution of your audience by age group</p>
            </div>
          </div>
          {(() => {
            const maxShare = Math.max(...audience.ageBands.map((b) => b.share), 1);
            return (
              <div className="flex h-36 items-end gap-2">
                {audience.ageBands.map((band) => (
                  <div key={band.label} className="group flex flex-1 flex-col items-center gap-2">
                    <p className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{band.share}%</p>
                    <div className="flex w-full items-end">
                      <div
                        className="w-full rounded-t-[8px] transition-colors hover:bg-[var(--brand)]"
                        style={{ height: `${Math.max(4, (band.share / maxShare) * 80)}px`, background: "color-mix(in srgb, var(--brand) 55%, transparent)" }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{band.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* ── Per-event breakdown ────────────────────────────── */}
        {dashboard.recentEvents.length > 0 && (
          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                  <Ticket size={15} weight="fill" style={{ color: "var(--brand)" }} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">Analytics by event</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">Click any event to see its full breakdown.</p>
                </div>
              </div>
              <Link href="/organizer/events" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-3 py-1.5 text-[12px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/12">
                All events →
              </Link>
            </div>

            {/* Column headers */}
            <div className="hidden grid-cols-[minmax(0,1fr)_80px_80px_80px_80px_44px] items-center gap-3 px-2 pb-2 sm:grid">
              {["Event", "Sold", "Saves", "Clicks", "Revenue", ""].map((h) => (
                <p key={h} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {dashboard.recentEvents.map((ev) => {
                const statusColor =
                  ev.statusLabel === "Live"  ? "bg-[var(--brand)]/10 text-[var(--brand)]" :
                  ev.statusLabel === "Draft" ? "bg-amber-500/10 text-amber-500" :
                  "bg-[var(--bg-muted)] text-[var(--text-tertiary)]";

                return (
                  <div
                    key={ev.id}
                    className="group grid grid-cols-1 gap-2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 transition hover:border-[var(--brand)]/20 hover:bg-[var(--bg-card)] sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px_44px] sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)] transition group-hover:text-[var(--brand)]">{ev.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>{ev.statusLabel}</span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">{ev.dateLabel}</span>
                      </div>
                    </div>
                    <p className="hidden text-[13px] font-semibold tabular-nums text-[var(--text-primary)] sm:block">
                      {ev.capacity ? `${ev.sold}/${ev.capacity}` : ev.sold}
                    </p>
                    <p className="hidden text-[13px] tabular-nums text-[var(--text-secondary)] sm:block">—</p>
                    <p className="hidden text-[13px] tabular-nums text-[var(--text-secondary)] sm:block">—</p>
                    <p className="hidden text-[13px] font-semibold tabular-nums text-[var(--text-primary)] sm:block">
                      {ev.revenue > 0
                        ? new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(ev.revenue)
                        : "—"}
                    </p>
                    <Link
                      href={`/organizer/events/${ev.id}/analytics`}
                      className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border-subtle)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
                    >
                      <ChartBar size={12} weight="fill" />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
