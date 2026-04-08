import { events, getCategoryBySlug, getOrganizerById } from "@gooutside/demo-data";
import { Button, ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { AvatarStack, MetricTile, MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";

const moderationStages = [
  {
    title: "Needs review",
    tone: "coral" as const,
    items: events.slice(0, 2),
  },
  {
    title: "Ready to publish",
    tone: "amber" as const,
    items: events.slice(2, 4),
  },
  {
    title: "Promoted",
    tone: "cyan" as const,
    items: events.slice(4, 6),
  },
];

export function PlatformEventsPage() {
  return (
    <DashboardShell mode="admin" subtitle="Moderation, launch visibility, and scheduling" title="Events">
      <div className="space-y-6">
        <PageHero
          eyebrow="UI page"
          title="Events now blend table workflows with queue cards."
          description="This screen borrows the dense table rhythm from the boilerplate and mixes it with a more opinionated moderation board so the app does not feel trapped in a single bland admin pattern."
          actions={
            <>
              <Button>Approve batch</Button>
              <Button variant="ghost">Export review list</Button>
            </>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Live events" meta="Listings currently discoverable" trend="+12%" value="124" />
          <MetricTile accent="coral" label="Review queue" meta="Tickets blocked by moderation" trend="14 waiting" value="14" />
          <MetricTile accent="cyan" label="Feature slots" meta="Homepage and city-rail placements" trend="6 open" value="18" />
          <MetricTile accent="amber" label="Avg. publish time" meta="From draft to approved" trend="-22 min" value="2.4h" />
        </div>

        <SectionBlock subtitle="A broader canvas than a flat table, while still staying operational" title="Moderation lanes">
          <div className="grid gap-5 xl:grid-cols-3">
            {moderationStages.map((stage) => (
              <div key={stage.title} className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <MiniPill tone={stage.tone}>{stage.title}</MiniPill>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{stage.items.length}</span>
                </div>
                <div className="space-y-3">
                  {stage.items.map((event) => {
                    const organizer = getOrganizerById(event.organizerId);
                    return (
                      <div key={event.id} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                        <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.shortDescription}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                          <span>{event.dateLabel}</span>
                          <span>{organizer?.name ?? "Unassigned organizer"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock subtitle="Boilerplate-style data table, recast for GoOutside operators" title="Platform event index">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Event", "Organizer", "Category", "Audience", "Status", "Actions"].map((heading) => (
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
                {events.map((event, index) => {
                  const organizer = getOrganizerById(event.organizerId);
                  const category = getCategoryBySlug(event.categorySlug);

                  return (
                    <tr key={event.id}>
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <AvatarStack names={[organizer?.name ?? "GO"]} />
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{organizer?.name ?? "GoOutside Team"}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{organizer?.city ?? "Accra"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-[var(--text-secondary)]">{category?.name ?? "General"}</td>
                      <td className="py-4 pr-4 text-[var(--text-secondary)]">{event.capacityLabel}</td>
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
                        <div className="flex flex-wrap gap-2">
                          <MiniPill tone={(["brand", "cyan", "violet", "amber", "coral"] as const)[index % 5]}>
                            {index % 2 === 0 ? "Feature" : "Inspect"}
                          </MiniPill>
                          <MiniPill tone="coral">{index % 3 === 0 ? "Escalate" : "Hold"}</MiniPill>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
