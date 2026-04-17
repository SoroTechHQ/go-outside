import { ChartBar, Compass, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { getOrganizerAudienceData, getOrganizerDashboardData } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

export default async function OrganizerAnalyticsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  if (!dashboard) return null;

  const audience = getOrganizerAudienceData(dashboard);

  return (
    <div className="p-5 md:p-7">
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Growth
        </p>
        <h1 className="mt-3 font-display text-[2.2rem] italic text-[var(--text-primary)]">Audience Analytics</h1>
        <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--text-secondary)]">
          Referral sources, pulse-tier shape, and neighbourhood concentration. This pushes the dashboard&apos;s audience teaser into a deeper page.
        </p>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <UsersThree size={18} className="text-[var(--brand)]" weight="fill" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Pulse tiers</p>
          </div>
          <div className="mt-4 space-y-3">
            {audience.pulseBreakdown.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)]">{row.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{row.percentage}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-[var(--bg-muted)]">
                  <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${row.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <ChartBar size={18} className="text-[var(--brand)]" weight="fill" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Referral sources</p>
          </div>
          <div className="mt-4 space-y-3">
            {audience.referralSources.map((row) => (
              <div key={row.label} className="rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{row.label}</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{row.value}% of current traffic</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <Compass size={18} className="text-[var(--brand)]" weight="fill" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Top neighbourhoods</p>
          </div>
          <div className="mt-4 space-y-3">
            {audience.neighbourhoods.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-[13px]">
                <span className="text-[var(--text-primary)]">{row.name}</span>
                <span className="font-semibold text-[var(--brand)]">{row.share}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
