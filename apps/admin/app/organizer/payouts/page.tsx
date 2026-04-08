import { ShellCard } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, MiniPill, PageHero } from "../../../components/dashboard-primitives";

export default function OrganizerPayoutsPage() {
  return (
    <DashboardShell mode="organizer" subtitle="Settlement status and remittance timing" title="Payouts">
      <div className="space-y-6">
        <PageHero
          eyebrow="Organizer"
          title="A working payout surface instead of a dead link."
          description="This is still static, but it fills the route and matches the richer admin shell we are building out."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Available balance" meta="Ready for payout" trend="Updated today" value="GHS 18,200" />
          <MetricTile accent="cyan" label="Pending" meta="Awaiting bank settlement" trend="2 batches" value="GHS 9,680" />
          <MetricTile accent="amber" label="Held" meta="Needs verification review" trend="1 account" value="GHS 1,240" />
          <MetricTile accent="violet" label="Last payout" meta="Successfully delivered" trend="2 days ago" value="GHS 6,340" />
        </div>

        <ShellCard>
          <div className="space-y-3">
            {[
              ["Apr 06", "Weekend rooftop launch", "GHS 6,340", "Sent"],
              ["Apr 03", "Community run club", "GHS 3,120", "Queued"],
              ["Mar 30", "Palmwine & Vinyl", "GHS 9,680", "Settling"],
            ].map(([date, label, amount, status], index) => (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{amount}</span>
                  <MiniPill tone={(["brand", "amber", "cyan"] as const)[index]}>{status}</MiniPill>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
