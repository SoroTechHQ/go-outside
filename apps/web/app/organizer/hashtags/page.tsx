import { Hash } from "@phosphor-icons/react/dist/ssr";
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

  return (
    <div className="p-5 md:p-7">
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Growth
        </p>
        <h1 className="mt-3 font-display text-[2.2rem] italic text-[var(--text-primary)]">Hashtag Performance</h1>
        <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--text-secondary)]">
          Trending tags and per-tag reach benchmarks, matching the PRD&apos;s organizer hashtag workspace.
        </p>
      </section>

      <section className="mt-6 rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-wrap gap-2">
          {dashboard.hashtags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                index < 4
                  ? "border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                <th className="px-2 py-3">Tag</th>
                <th className="px-2 py-3">Post Count</th>
                <th className="px-2 py-3">Avg Reach</th>
                <th className="px-2 py-3">Engagements</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((row) => (
                <tr key={row.tag} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <td className="px-2 py-4 text-[13px] font-semibold text-[var(--text-primary)]">
                    <span className="inline-flex items-center gap-2">
                      <Hash size={14} className="text-[var(--brand)]" weight="fill" />
                      {row.tag}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-[13px] text-[var(--text-secondary)]">{row.postCount}</td>
                  <td className="px-2 py-4 text-[13px] text-[var(--text-secondary)]">{row.avgReachPerPost.toLocaleString()}</td>
                  <td className="px-2 py-4 text-[13px] text-[var(--text-secondary)]">{row.totalEngagements.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
