import { demoData, organizers } from "@gooutside/demo-data";
import { ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, PageHero, ProgressRow, SectionBlock } from "../dashboard-primitives";
import { DonutChart, MultiBarChart } from "../charts/AdminCharts";

const userRows = [
  { name: demoData.attendee.name, role: "Attendee", city: "Accra", joined: "Jan 2024", status: "active" },
  { name: organizers[0].name, role: "Organizer", city: organizers[0].city, joined: "Mar 2023", status: "active" },
  { name: organizers[1].name, role: "Organizer", city: organizers[1].city, joined: "Jun 2023", status: "active" },
  { name: organizers[2].name, role: "Organizer", city: organizers[2].city, joined: "Sep 2023", status: "pending" },
  { name: "Esi Badu", role: "Attendee", city: "Accra", joined: "Feb 2024", status: "active" },
  { name: "Nii Ofori", role: "Attendee", city: "Kumasi", joined: "Mar 2024", status: "review" },
];

const segmentMix = [
  { label: "Attendees", value: 58, tone: "brand" as const },
  { label: "Organizers", value: 19, tone: "cyan" as const },
  { label: "Ambassadors", value: 13, tone: "violet" as const },
  { label: "Support", value: 10, tone: "amber" as const },
];

export function PlatformUsersPage() {
  return (
    <DashboardShell mode="admin" subtitle="Acquisition, trust, and user quality" title="Users">
      <div className="space-y-6">
        <PageHero
          eyebrow="UI page"
          title="Users is now a segmented operational screen."
          description="Instead of a single table, the page carries segment distribution, retention pressure, and the usual account actions. It is closer to the boilerplate’s richer dashboard pattern while still grounded in our product language."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Total users" meta="Across attendee and organizer surfaces" trend="+8.4%" value="89,240" />
          <MetricTile accent="cyan" label="New this week" meta="Fresh accounts entering discovery" trend="+12%" value="1,240" />
          <MetricTile accent="amber" label="Verification queue" meta="Documents or payout checks pending" trend="82 open" value="82" />
          <MetricTile accent="violet" label="90-day retention" meta="Healthy compared to last cycle" trend="+4.1 pts" value="61%" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1.2fr]">
          <SectionBlock subtitle="How the platform population is distributed" title="Segment mix">
            <div className="grid gap-4 lg:grid-cols-[0.95fr,1fr] lg:items-center">
              <DonutChart height={220} items={segmentMix} />
              <div className="space-y-4">
                {segmentMix.map((segment) => (
                  <ProgressRow key={segment.label} label={segment.label} tone={segment.tone} value={segment.value} />
                ))}
              </div>
            </div>
          </SectionBlock>

          <SectionBlock subtitle="Weekly cohort health by user class" title="Cohort flow">
            <MultiBarChart
              categories={["W1", "W2", "W3", "W4", "W5", "W6"]}
              series={[
                { name: "Attendees", data: [24, 28, 29, 34, 37, 40], tone: "brand" },
                { name: "Organizers", data: [6, 9, 10, 12, 14, 16], tone: "violet" },
                { name: "Trust checks", data: [4, 5, 6, 7, 7, 8], tone: "amber" },
              ]}
            />
          </SectionBlock>
        </div>

        <SectionBlock subtitle="Account review and manual operations" title="People index">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Name", "Role", "City", "Joined", "Status", "Actions"].map((heading) => (
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
                {userRows.map((row, index) => (
                  <tr key={row.name}>
                    <td className="py-4 pr-4 font-semibold text-[var(--text-primary)]">{row.name}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{row.role}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{row.city}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{row.joined}</td>
                    <td className="py-4 pr-4">
                      <StatusPill
                        tone={
                          row.status === "active"
                            ? "live"
                            : row.status === "pending"
                              ? "pending"
                              : "review"
                        }
                      >
                        {row.status}
                      </StatusPill>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <MiniPill tone={(["cyan", "violet", "brand", "amber"] as const)[index % 4]}>View</MiniPill>
                        <MiniPill tone="coral">{index % 2 === 0 ? "Suspend" : "Follow up"}</MiniPill>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        <div className="grid gap-5 lg:grid-cols-3">
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">Quality</p>
            <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">92%</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Bookings completed without support intervention.</p>
          </ShellCard>
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">New organizers</p>
            <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">34</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">This month’s verified organizer additions.</p>
          </ShellCard>
          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">Escalations</p>
            <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">11</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Profiles needing trust, payout, or duplicate-account review.</p>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
