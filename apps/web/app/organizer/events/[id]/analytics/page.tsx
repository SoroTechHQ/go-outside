import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookmarkSimple,
  ChartBar,
  ChatCircle,
  CursorClick,
  Eye,
  Heart,
  Star,
  Ticket,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function pct(num: number, denom: number) {
  if (!denom) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

async function getEventAnalytics(eventId: string, organizerId: string) {
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    { data: event },
    { data: edges },
    { data: ticketTypes },
    { data: communityPosts },
    { data: dailyEdges },
  ] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id, title, slug, banner_url, start_datetime, status, tickets_sold, total_capacity, saves_count, views_count, organizer_id, categories(name, slug)")
      .eq("id", eventId)
      .maybeSingle(),

    // All-time engagement edges for this event
    supabaseAdmin
      .from("graph_edges")
      .select("edge_type, dwell_ms, created_at")
      .eq("to_id", eventId)
      .eq("to_type", "event"),

    supabaseAdmin
      .from("ticket_types")
      .select("id, name, price, price_type, quantity_total, quantity_sold")
      .eq("event_id", eventId)
      .order("price", { ascending: true }),

    supabaseAdmin
      .from("posts")
      .select("id, like_count, created_at")
      .eq("event_id", eventId),

    // Last 30 days for daily breakdown
    supabaseAdmin
      .from("graph_edges")
      .select("edge_type, created_at")
      .eq("to_id", eventId)
      .eq("to_type", "event")
      .gte("created_at", since30d),
  ]);

  if (!event || event.organizer_id !== organizerId) return null;

  // Tally edge types
  const byType: Record<string, number> = {};
  for (const e of edges ?? []) {
    byType[e.edge_type] = (byType[e.edge_type] ?? 0) + 1;
  }

  // Avg dwell
  const dwellEdges = (edges ?? []).filter((e) => e.dwell_ms);
  const avgDwell = dwellEdges.length
    ? Math.round(dwellEdges.reduce((s, e) => s + (e.dwell_ms ?? 0), 0) / dwellEdges.length / 1000)
    : 0;

  // Revenue
  const revenue = (ticketTypes ?? []).reduce(
    (sum, t) => sum + (t.quantity_sold ?? 0) * Number(t.price),
    0
  );

  const avgRating: number | null = null;

  // Daily activity for last 30 days chart
  const dayMap: Record<string, number> = {};
  for (const e of dailyEdges ?? []) {
    const day = e.created_at.slice(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  }
  const last14: Array<{ label: string; value: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    last14.push({
      label: d.toLocaleDateString("en-GH", { month: "short", day: "numeric" }),
      value: dayMap[key] ?? 0,
    });
  }

  return {
    event: event as typeof event & { categories: { name: string; slug: string } | null },
    metrics: {
      peekOpens:    byType["peek_open"] ?? 0,
      cardClicks:   byType["card_click"] ?? 0,
      ticketIntent: byType["ticket_intent"] ?? 0,
      registered:   byType["registered"] ?? (event.tickets_sold ?? 0),
      saves:        byType["save"] ?? (event.saves_count ?? 0),
      longDwells:   byType["card_long_dwell"] ?? 0,
      avgDwell,
    },
    revenue,
    ticketTypes: ticketTypes ?? [],
    postCount: (communityPosts ?? []).length,
    avgRating,
    totalPostLikes: (communityPosts ?? []).reduce((s, p) => s + (p.like_count ?? 0), 0),
    last14,
  };
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-[var(--brand)]/25 bg-[var(--brand)]/8" : "border-[var(--border-subtle)] bg-[var(--bg-card)]"}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? "bg-[var(--brand)]/15 text-[var(--brand)]" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"}`}>
        {icon}
      </span>
      <p className={`mt-3 text-[1.5rem] font-bold tabular-nums leading-none ${accent ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{sub}</p>}
    </div>
  );
}

function FunnelRow({ label, value, total, icon }: { label: string; value: number; total: number; icon: React.ReactNode }) {
  const width = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="flex w-36 shrink-0 items-center gap-2 text-[12px] text-[var(--text-secondary)]">
        {icon}
        {label}
      </div>
      <div className="flex-1">
        <div className="h-7 rounded-xl bg-[var(--bg-muted)]">
          <div
            className="h-7 rounded-xl bg-[var(--brand)] transition-all"
            style={{ width: `${width}%`, opacity: 0.3 + (width / 100) * 0.7 }}
          />
        </div>
      </div>
      <div className="w-24 shrink-0 text-right">
        <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">{value.toLocaleString()}</span>
        <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">{pct(value, total)}</span>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((point, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1">
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-t-md bg-[var(--brand)] opacity-60 transition-all group-hover:opacity-100"
              style={{ height: `${Math.max(2, (point.value / max) * 100)}%` }}
            />
          </div>
          {(i === 0 || i === data.length - 1 || i === 6) && (
            <p className="text-[8px] text-[var(--text-tertiary)]">{point.label}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const data = await getEventAnalytics(id, user.id);
  if (!data) return notFound();

  const { event, metrics, revenue, ticketTypes, postCount, avgRating, postCount, totalPostLikes, last14 } = data;

  const topOfFunnel = Math.max(metrics.peekOpens, metrics.cardClicks, 1);

  const statusLabel =
    event.status !== "published" ? "Draft" :
    event.total_capacity && (event.tickets_sold ?? 0) >= event.total_capacity ? "Sold Out" :
    new Date(event.start_datetime) < new Date() ? "Past" : "Live";

  return (
    <div className="space-y-6 p-5 md:p-7">
      {/* Breadcrumb nav */}
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <Link href="/organizer/analytics" className="text-[var(--text-tertiary)] hover:text-[var(--brand)]">
          Analytics
        </Link>
        <span className="text-[var(--text-tertiary)]">/</span>
        <Link href={`/organizer/events/${event.id}`} className="text-[var(--text-tertiary)] hover:text-[var(--brand)]">
          {event.title}
        </Link>
        <span className="text-[var(--text-tertiary)]">/</span>
        <span className="font-semibold text-[var(--text-primary)]">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {event.banner_url && (
            <img src={event.banner_url} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {event.categories?.name ?? "Event"} · {statusLabel}
            </p>
            <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
              {event.title}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {new Date(event.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <Link
          href={`/organizer/events/${event.id}`}
          className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={14} weight="bold" />
          Event detail
        </Link>
      </div>

      {/* Top KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard accent icon={<Ticket size={16} weight="fill" />} label="Tickets sold" value={(event.tickets_sold ?? 0).toLocaleString()} sub={event.total_capacity ? `of ${event.total_capacity}` : "Unlimited capacity"} />
        <StatCard accent icon={<TrendUp size={16} weight="fill" />} label="Revenue" value={formatMoney(revenue)} />
        <StatCard icon={<BookmarkSimple size={16} weight="fill" />} label="Saves" value={metrics.saves.toLocaleString()} />
        <StatCard icon={<CursorClick size={16} weight="fill" />} label="Card clicks" value={metrics.cardClicks.toLocaleString()} sub={avgDwell(metrics.avgDwell)} />
      </div>

      {/* Activity + Funnel */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        {/* 14-day activity chart */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Engagement — last 14 days</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">All interactions: clicks, saves, peek opens</p>
            </div>
            <ChartBar size={16} className="shrink-0 text-[var(--brand)]" weight="fill" />
          </div>
          <div className="mt-5">
            {last14.every((d) => d.value === 0) ? (
              <div className="flex h-28 items-center justify-center rounded-xl bg-[var(--bg-muted)]/50">
                <p className="text-[12px] text-[var(--text-tertiary)]">No activity in the last 14 days</p>
              </div>
            ) : (
              <MiniBarChart data={last14} />
            )}
          </div>
        </div>

        {/* Engagement stats */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Engagement breakdown</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Peek opens",    value: metrics.peekOpens,    icon: <Eye size={13} /> },
              { label: "Card clicks",   value: metrics.cardClicks,   icon: <CursorClick size={13} /> },
              { label: "Ticket intent", value: metrics.ticketIntent, icon: <Ticket size={13} /> },
              { label: "Registered",    value: metrics.registered,   icon: <Ticket size={13} weight="fill" /> },
              { label: "Saves",         value: metrics.saves,        icon: <BookmarkSimple size={13} /> },
              { label: "Long dwells",   value: metrics.longDwells,   icon: <Eye size={13} weight="fill" /> },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated)] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                  <span className="text-[var(--brand)]">{row.icon}</span>
                  {row.label}
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Conversion funnel</p>
        <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">How people move from discovery to purchase</p>
        <div className="mt-5 space-y-3">
          <FunnelRow label="Peek opens"    value={metrics.peekOpens}    total={topOfFunnel} icon={<Eye size={13} />} />
          <FunnelRow label="Card clicks"   value={metrics.cardClicks}   total={topOfFunnel} icon={<CursorClick size={13} />} />
          <FunnelRow label="Ticket intent" value={metrics.ticketIntent} total={topOfFunnel} icon={<Ticket size={13} />} />
          <FunnelRow label="Registered"    value={metrics.registered}   total={topOfFunnel} icon={<Ticket size={13} weight="fill" />} />
        </div>
        {metrics.peekOpens > 0 && metrics.registered > 0 && (
          <div className="mt-4 rounded-xl bg-[var(--brand)]/8 px-4 py-3 text-[12px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--brand)]">{pct(metrics.registered, metrics.peekOpens)}</span> overall conversion — {metrics.registered} registrations from {metrics.peekOpens} peek opens
          </div>
        )}
      </div>

      {/* Social + tickets side by side */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Community */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Community activity</p>
          <div className="mt-4 space-y-2">
            {[
              { icon: <Star size={14} className="text-amber-500" weight="fill" />, label: "Posts / reviews", value: postCount, sub: avgRating ? `Avg ${avgRating}★` : null },
              { icon: <ChatCircle size={14} className="text-[var(--brand)]" weight="fill" />, label: "Posts tagged", value: postCount, sub: null },
              { icon: <Heart size={14} className="text-rose-400" weight="fill" />, label: "Post likes", value: totalPostLikes, sub: null },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated)] px-3 py-3">
                <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                  {row.icon}
                  <div>
                    <p>{row.label}</p>
                    {row.sub && <p className="text-[11px] text-[var(--text-tertiary)]">{row.sub}</p>}
                  </div>
                </div>
                <span className="text-[15px] font-bold tabular-nums text-[var(--text-primary)]">{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Link href={`/organizer/events/${event.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand)] hover:underline">
            View all posts & posts →
          </Link>
        </div>

        {/* Ticket tier breakdown */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Ticket tiers</p>
          {ticketTypes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {ticketTypes.map((t) => {
                const sold = t.quantity_sold ?? 0;
                const total = t.quantity_total;
                const ratio = total ? Math.round((sold / total) * 100) : 0;
                return (
                  <div key={t.id} className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {Number(t.price) === 0 ? "Free" : formatMoney(Number(t.price))} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold tabular-nums text-[var(--text-primary)]">{sold}{total ? `/${total}` : ""}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">sold</p>
                      </div>
                    </div>
                    {total ? (
                      <div className="mt-2.5">
                        <div className="h-1.5 rounded-full bg-[var(--bg-muted)]">
                          <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${ratio}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{ratio}% sold · {formatMoney(sold * Number(t.price))} revenue</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">No ticket tiers configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function avgDwell(seconds: number) {
  if (!seconds) return undefined;
  if (seconds < 60) return `${seconds}s avg dwell`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s avg dwell`;
}
