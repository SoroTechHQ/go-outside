import { supabaseAdmin } from "../../../lib/supabase";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MiniPill, SectionBlock } from "../../../components/dashboard-primitives";
import Link from "next/link";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms: number | null) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)] shrink-0">{label}</span>
      <span className="text-right text-sm font-mono text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default async function UserLensPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [
    { data: user },
    { data: fingerprints },
    { data: sessions },
    { data: pageViews },
    { data: microEvents },
    { data: signals },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id, first_name, last_name, username, email, role, location_city, pulse_score, pulse_tier, created_at, is_active, avatar_url, followers_count").eq("id", id).single(),
    supabaseAdmin.from("user_fingerprints").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
    supabaseAdmin.from("interaction_sessions").select("id, started_at, ended_at, device_type, browser, os, ip_address, page_count, last_seen_at, is_active").eq("user_id", id).order("started_at", { ascending: false }).limit(20),
    supabaseAdmin.from("user_page_views").select("page_path, entered_at, time_on_page_ms, scroll_depth_pct, click_count, is_bounce").eq("user_id", id).order("entered_at", { ascending: false }).limit(30),
    supabaseAdmin.from("user_micro_events").select("event_type, page_path, target_entity_id, entity_type, hover_duration_ms, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("user_behavioral_signals").select("*").eq("user_id", id).single(),
  ]);

  const latestFp = fingerprints?.[0];
  const eventTypeCounts: Record<string, number> = {};
  for (const e of microEvents ?? []) {
    eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] ?? 0) + 1;
  }

  const topPages: Record<string, number> = {};
  for (const pv of pageViews ?? []) {
    topPages[pv.page_path] = (topPages[pv.page_path] ?? 0) + 1;
  }
  const topPagesList = Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const avgScrollDepth = pageViews?.length
    ? Math.round((pageViews.reduce((s, p) => s + (p.scroll_depth_pct ?? 0), 0)) / pageViews.length)
    : 0;

  const avgTimeOnPage = pageViews?.filter(p => p.time_on_page_ms).length
    ? Math.round((pageViews?.reduce((s, p) => s + (p.time_on_page_ms ?? 0), 0) ?? 0) / (pageViews?.filter(p => p.time_on_page_ms).length ?? 1))
    : 0;

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Unknown";

  return (
    <DashboardShell
      mode="admin"
      title={`${fullName} — Behavioral Lens`}
      subtitle={`Deep profile for @${user?.username ?? id}`}
    >
      <div className="space-y-6">
        {/* Back link */}
        <Link href="/users" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors">
          ← Back to Users
        </Link>

        {/* User identity bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xl font-bold text-[#08110b]">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{fullName}</p>
            <p className="text-sm text-[var(--text-tertiary)]">{user?.email} · @{user?.username ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MiniPill tone={user?.is_active ? "brand" : "coral"}>{user?.is_active ? "Active" : "Suspended"}</MiniPill>
            <MiniPill tone="violet">{user?.role ?? "attendee"}</MiniPill>
            {user?.pulse_tier && <MiniPill tone="cyan">{user.pulse_tier}</MiniPill>}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Browser fingerprint */}
          <SectionBlock title="Browser Fingerprint" subtitle={`Latest of ${(fingerprints ?? []).length} recorded`}>
            {!latestFp ? (
              <p className="text-sm text-[var(--text-tertiary)]">No fingerprint data collected yet.</p>
            ) : (
              <div>
                <DataRow label="Fingerprint ID" value={<span className="text-[var(--brand)]">{latestFp.fingerprint_hash ?? "—"}</span>} />
                <DataRow label="Canvas hash" value={latestFp.canvas_hash ?? "—"} />
                <DataRow label="WebGL hash" value={latestFp.webgl_hash ?? "—"} />
                <DataRow label="Audio hash" value={latestFp.audio_hash ?? "—"} />
                <DataRow label="Browser" value={`${latestFp.browser_name ?? "?"} ${latestFp.browser_version ?? ""}`} />
                <DataRow label="OS" value={latestFp.os_name ?? "—"} />
                <DataRow label="Device" value={latestFp.device_type ?? "—"} />
                <DataRow label="GPU" value={latestFp.gpu_renderer ? `${latestFp.gpu_vendor} · ${latestFp.gpu_renderer?.slice(0, 40)}` : "—"} />
                <DataRow label="CPU cores" value={latestFp.cpu_cores ?? "—"} />
                <DataRow label="RAM" value={latestFp.ram_gb ? `${latestFp.ram_gb} GB` : "—"} />
                <DataRow label="Screen" value={latestFp.screen_width ? `${latestFp.screen_width}×${latestFp.screen_height} @${latestFp.pixel_ratio}x` : "—"} />
                <DataRow label="Timezone" value={latestFp.timezone ?? "—"} />
                <DataRow label="Language" value={latestFp.language ?? "—"} />
                <DataRow label="Fonts detected" value={latestFp.fonts_count ?? "—"} />
                <DataRow label="Ad blocker" value={latestFp.has_ad_blocker ? <MiniPill tone="coral">Detected</MiniPill> : <MiniPill tone="brand">None</MiniPill>} />
                <DataRow label="Do Not Track" value={latestFp.has_do_not_track ? <MiniPill tone="amber">Enabled</MiniPill> : "Disabled"} />
                <DataRow label="Incognito" value={latestFp.is_incognito ? <MiniPill tone="violet">Yes</MiniPill> : "No"} />
                <DataRow label="WebRTC" value={latestFp.has_webrtc ? "Supported" : "Blocked"} />
                <DataRow label="Connection" value={latestFp.connection_type ? `${latestFp.connection_type} · ${latestFp.downlink_mbps ?? 0} Mbps` : "—"} />
                <DataRow label="Battery" value={latestFp.battery_level != null ? `${Math.round(latestFp.battery_level * 100)}% ${latestFp.is_charging ? "(charging)" : ""}` : "—"} />
                <DataRow label="Captured" value={fmtDate(latestFp.created_at)} />
              </div>
            )}
          </SectionBlock>

          {/* Behavioral signals */}
          <SectionBlock title="Behavioral Signals" subtitle="Aggregated across all sessions">
            {!signals ? (
              <p className="text-sm text-[var(--text-tertiary)]">No behavioral data yet.</p>
            ) : (
              <div>
                <DataRow label="Total sessions" value={signals.total_sessions ?? 0} />
                <DataRow label="Total page views" value={signals.total_page_views ?? 0} />
                <DataRow label="Avg scroll depth" value={`${avgScrollDepth}%`} />
                <DataRow label="Avg time / page" value={fmtDuration(avgTimeOnPage)} />
                <DataRow label="Total clicks" value={signals.total_clicks ?? 0} />
                <DataRow label="Rage clicks" value={
                  <span className={signals.rage_click_count > 5 ? "text-[var(--accent-coral)]" : ""}>{signals.rage_click_count ?? 0}</span>
                } />
                <DataRow label="Exit intents" value={signals.exit_intent_count ?? 0} />
                <DataRow label="Event hovers" value={signals.event_hover_count ?? 0} />
                <DataRow label="Avg hover time" value={signals.avg_event_hover_ms ? fmtDuration(signals.avg_event_hover_ms) : "—"} />
                <DataRow label="Searches" value={signals.search_count ?? 0} />
                <DataRow label="Saves" value={signals.save_count ?? 0} />
                <DataRow label="Cart adds" value={signals.cart_add_count ?? 0} />
                <DataRow label="Engagement score" value={
                  <span className="font-semibold text-[var(--brand)]">{signals.engagement_score ?? 0}/100</span>
                } />
                <DataRow label="Device" value={signals.device_type ?? "—"} />
                <DataRow label="Last active" value={fmtDate(signals.last_active_at)} />
              </div>
            )}
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Session history */}
          <SectionBlock title="Session History" subtitle={`Last ${(sessions ?? []).length} sessions`}>
            {!(sessions ?? []).length ? (
              <p className="text-sm text-[var(--text-tertiary)]">No sessions recorded.</p>
            ) : (
              <div className="space-y-2">
                {sessions!.map((s) => (
                  <div key={s.id} className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: s.is_active ? "#4ade80" : "var(--text-tertiary)" }} />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{s.browser ?? "?"} · {s.os ?? "?"}</span>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">{s.page_count ?? 0} pages</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {fmtDate(s.started_at)} · IP: {s.ip_address ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>

          {/* Micro-event breakdown */}
          <SectionBlock title="Event Breakdown" subtitle="Types of micro-interactions logged">
            {!Object.keys(eventTypeCounts).length ? (
              <p className="text-sm text-[var(--text-tertiary)]">No micro-events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(eventTypeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = Math.round((count / (microEvents?.length ?? 1)) * 100);
                    return (
                      <div key={type}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-mono text-[var(--text-secondary)]">{type}</span>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </SectionBlock>
        </div>

        {/* Top pages */}
        <SectionBlock title="Top Pages Visited" subtitle="Most frequent page paths for this user">
          {!topPagesList.length ? (
            <p className="text-sm text-[var(--text-tertiary)]">No page view data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Page path", "Visits", "Avg scroll", "Avg time"].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {topPagesList.map(([path, visits]) => {
                    const pathViews = pageViews?.filter(p => p.page_path === path) ?? [];
                    const scroll = pathViews.length ? Math.round(pathViews.reduce((s, p) => s + (p.scroll_depth_pct ?? 0), 0) / pathViews.length) : 0;
                    const time = pathViews.filter(p => p.time_on_page_ms).length
                      ? Math.round(pathViews.reduce((s, p) => s + (p.time_on_page_ms ?? 0), 0) / pathViews.filter(p => p.time_on_page_ms).length)
                      : 0;
                    return (
                      <tr key={path}>
                        <td className="py-3 pr-4 font-mono text-xs text-[var(--text-primary)]">{path}</td>
                        <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">{visits}</td>
                        <td className="py-3 pr-4 text-[var(--text-secondary)]">{scroll}%</td>
                        <td className="py-3 text-[var(--text-secondary)]">{fmtDuration(time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>

        {/* Recent micro-events timeline */}
        <SectionBlock title="Activity Timeline" subtitle="Last 50 micro-events — newest first">
          {!(microEvents ?? []).length ? (
            <p className="text-sm text-[var(--text-tertiary)]">No activity recorded yet.</p>
          ) : (
            <div className="space-y-1.5 font-mono text-xs">
              {microEvents!.map((e, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2">
                  <span className="shrink-0 text-[var(--text-tertiary)]">{fmtDate(e.created_at)}</span>
                  <MiniPill tone={
                    e.event_type === "rage_click" ? "coral" :
                    e.event_type === "exit_intent" ? "amber" :
                    e.event_type.includes("hover") ? "cyan" :
                    e.event_type === "save_event" ? "brand" : "violet"
                  }>{e.event_type}</MiniPill>
                  {e.target_entity_id && (
                    <span className="text-[var(--text-secondary)]">{e.entity_type}:{e.target_entity_id.slice(0, 8)}…</span>
                  )}
                  {e.hover_duration_ms && (
                    <span className="text-[var(--text-tertiary)]">{fmtDuration(e.hover_duration_ms)}</span>
                  )}
                  <span className="ml-auto text-[var(--text-tertiary)]">{e.page_path}</span>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
