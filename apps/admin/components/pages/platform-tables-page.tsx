import { events, getCategoryBySlug, getOrganizerById, organizers } from "@gooutside/demo-data";
import { ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";

export function PlatformTablesPage() {
  return (
    <DashboardShell mode="admin" subtitle="Dense data layouts and operational listings" title="Tables">
      <div className="space-y-6">
        <PageHero
          eyebrow="Table page"
          title="Table layouts ported beyond the boilerplate defaults."
          description="This page keeps the readable density of the boilerplate’s data pages while shifting the visual treatment to our softer cards, mixed accents, and root-level admin information architecture."
        />

        <SectionBlock subtitle="Primary operational table" title="Event performance table">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Event", "Organizer", "Category", "Revenue", "Status", "Health"].map((heading) => (
                    <th
                      key={heading}
                      className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {events.map((event, index) => (
                  <tr key={event.id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{event.dateLabel}</p>
                    </td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{getOrganizerById(event.organizerId)?.name ?? "GoOutside"}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{getCategoryBySlug(event.categorySlug)?.name ?? "General"}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">GHS {(index + 2) * 18}k</td>
                    <td className="py-4 pr-4">
                      <StatusPill
                        tone={
                          event.status === "live"
                            ? "live"
                            : event.status === "pending"
                              ? "pending"
                              : event.status === "review"
                                ? "review"
                                : "draft"
                        }
                      >
                        {event.status}
                      </StatusPill>
                    </td>
                    <td className="py-4">
                      <MiniPill tone={(["brand", "cyan", "violet", "amber", "coral"] as const)[index % 5]}>
                        {["Strong", "Healthy", "Watch", "Recovering", "At risk"][index % 5]}
                      </MiniPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionBlock subtitle="Secondary table with richer cell treatments" title="Top organizers">
            <div className="space-y-3">
              {organizers.map((organizer, index) => (
                <div
                  key={organizer.id}
                  className="grid gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 md:grid-cols-[1.2fr,0.8fr,auto]"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{organizer.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{organizer.city} · {organizer.tag}</p>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    <p>{organizer.followersLabel}</p>
                    <p className="mt-1">{organizer.eventsLabel}</p>
                  </div>
                  <MiniPill tone={(["brand", "cyan", "amber"] as const)[index % 3]}>
                    {organizer.verified ? "Verified" : "Review"}
                  </MiniPill>
                </div>
              ))}
            </div>
          </SectionBlock>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">Payout snapshot</p>
            <div className="mt-5 space-y-3">
              {[
                ["Sankofa Sessions", "GHS 18,200", "Settling"],
                ["Tamale Night Trails", "GHS 9,680", "Queued"],
                ["Palmwine & Vinyl", "GHS 6,340", "Delayed"],
                ["Coastal Run Club", "GHS 3,120", "Sent"],
              ].map(([name, value, status], index) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{value}</p>
                  </div>
                  <MiniPill tone={(["brand", "amber", "coral", "cyan"] as const)[index]}>{status}</MiniPill>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
