import { Hash, TrendUp, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getOrganizerDashboardData, getOrganizerHashtagPerformance } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

export default async function OrganizerHashtagsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  if (!dashboard) return null;

  const performance = getOrganizerHashtagPerformance(dashboard);
  const totalEngagements = performance.reduce((s, r) => s + r.totalEngagements, 0);

  return (
    <div>
      {/* ── Hero header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Growth</p>
        <h1 className="relative mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Hashtag Performance</h1>
        <p className="relative mt-1 text-[13px] text-[var(--text-secondary)]">Trending tags and reach benchmarks across your events.</p>
      </div>

      <div className="space-y-5 p-5 md:p-7">
        {/* ── KPI strip ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: "Total tags",       value: dashboard.hashtags.length.toString(), accent: "#2f8f45" },
            { label: "Total engagements", value: totalEngagements.toLocaleString(),   accent: "#8b5cf6" },
            { label: "Top tag reach",    value: performance[0]?.avgReachPerPost.toLocaleString() ?? "—", accent: "#f59e0b" },
          ].map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
              <div className="h-[3px]" style={{ background: k.accent }} />
              <div className="p-5">
                <p className="text-[1.9rem] font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)]">{k.value}</p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Hashtag cloud ──────────────────────────────── */}
        <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
              <Hash size={15} weight="fill" style={{ color: "var(--brand)" }} />
            </span>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Active hashtags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.hashtags.length > 0 ? dashboard.hashtags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition hover:scale-105 ${
                  i < 4
                    ? "border-[var(--brand)]/25 bg-[var(--brand)]/8 text-[var(--brand)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                }`}
              >
                {tag}
              </span>
            )) : (
              <p className="text-[13px] text-[var(--text-tertiary)]">No hashtags yet.</p>
            )}
          </div>
        </div>

        {/* ── Performance table ──────────────────────────── */}
        <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10">
              <TrendUp size={15} weight="fill" style={{ color: "var(--brand)" }} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Per-tag breakdown</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Post count, reach, and total engagement per tag.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  {["Tag", "Posts", "Avg Reach / Post", "Total Engagements"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {performance.map((row, i) => (
                  <tr
                    key={row.tag}
                    className="border-b border-[var(--border-subtle)] transition hover:bg-[var(--bg-elevated)] last:border-b-0"
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                            i < 3 ? "bg-[var(--brand)]/12 text-[var(--brand)]" : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          <Hash size={11} weight="fill" style={{ color: "var(--brand)", display: "inline", marginRight: 2 }} />
                          {row.tag}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{row.postCount}</td>
                    <td className="px-5 py-3.5 text-[13px] tabular-nums text-[var(--text-secondary)]">{row.avgReachPerPost.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-bold tabular-nums text-[var(--brand)]">{row.totalEngagements.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
