import { ShellCard } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, PageHero } from "../../../components/dashboard-primitives";

export default function OrganizerProfilePage() {
  return (
    <DashboardShell mode="organizer" subtitle="Public brand presence and trust signals" title="Profile">
      <div className="space-y-6">
        <PageHero
          eyebrow="Organizer"
          title="A profile surface for organizer identity and trust."
          description="This page stays intentionally simple, but it rounds out the organizer shell so each nav item now lands somewhere useful."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Followers" meta="Across all city rails" trend="+120 this month" value="8,420" />
          <MetricTile accent="cyan" label="Average rating" meta="Across completed events" trend="+0.2" value="4.8" />
          <MetricTile accent="violet" label="Repeat attendance" meta="Returning buyers share" trend="+7 pts" value="42%" />
          <MetricTile accent="amber" label="Verification" meta="Business and payout checks" trend="All clear" value="100%" />
        </div>

        <ShellCard className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(61,220,151,0.08),transparent)] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">Brand card</p>
            <h2 className="mt-4 font-display text-4xl italic text-[var(--text-primary)]">Sankofa Sessions</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Boutique cultural gatherings, listening sessions, and city nightlife curation across Accra.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Verified payout account connected",
              "Public organizer bio approved",
              "Support SLA currently under 12 hours",
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-secondary)]">
                {item}
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
