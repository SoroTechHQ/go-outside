import { demoData } from "@gooutside/demo-data";
import { Button, FauxSelect, FieldLabel, ShellCard, TextArea, TextInput } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { DonutChart, MultiBarChart } from "../charts/AdminCharts";

const channelMix = [
  { label: "Push", value: 44, tone: "brand" as const },
  { label: "Email", value: 28, tone: "cyan" as const },
  { label: "SMS", value: 16, tone: "amber" as const },
  { label: "In-app", value: 12, tone: "violet" as const },
];

export function PlatformNotificationsPage() {
  return (
    <DashboardShell mode="admin" subtitle="Broadcasts, lifecycle messaging, and campaign review" title="Notifications">
      <div className="space-y-6">
        <PageHero
          eyebrow="UI page"
          title="Messaging now feels like a full campaign surface."
          description="This page extends the previous broadcast form with the kind of supporting analytics panels the boilerplate uses throughout its UI pages."
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <ShellCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
                  Campaign builder
                </p>
                <h2 className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">New broadcast</h2>
              </div>
              <MiniPill tone="violet">Draft autosaved</MiniPill>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel>Campaign title</FieldLabel>
                <TextInput value="Weekend picks are live" />
              </div>
              <div>
                <FieldLabel>Audience</FieldLabel>
                <FauxSelect value="All attendees in Accra and Kumasi" />
              </div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel>Primary channel</FieldLabel>
                <FauxSelect value="Push + Email" />
              </div>
              <div>
                <FieldLabel>Send window</FieldLabel>
                <TextInput value="Friday, 6:15 PM GMT" />
              </div>
            </div>
            <div className="mt-5">
              <FieldLabel>Message</FieldLabel>
              <TextArea value="Weekend picks are live. Discover rooftop sessions, food pop-ups, and community runs happening across Accra this weekend." />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Schedule send</Button>
              <Button variant="ghost">Preview templates</Button>
              <Button variant="secondary">Save draft</Button>
            </div>
          </ShellCard>

          <SectionBlock subtitle="Which channels are driving engagement" title="Channel split">
            <DonutChart height={220} items={channelMix} />
            <div className="mt-4 space-y-3">
              {channelMix.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.value}%</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <SectionBlock subtitle="Open rate and delivery performance over six sends" title="Channel performance">
            <MultiBarChart
              categories={["S1", "S2", "S3", "S4", "S5", "S6"]}
              series={[
                { name: "Opens", data: [48, 55, 52, 58, 61, 64], tone: "brand" },
                { name: "Clicks", data: [18, 21, 20, 24, 28, 30], tone: "cyan" },
                { name: "Opt-outs", data: [4, 5, 5, 3, 4, 3], tone: "coral" },
              ]}
            />
          </SectionBlock>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">Recent sends</p>
            <div className="mt-5 space-y-4">
              {demoData.adminDashboard.activities.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.meta}</p>
                    </div>
                    <MiniPill tone={(["brand", "cyan", "amber", "violet"] as const)[index % 4]}>
                      {["Sent", "Testing", "Queued", "Paused"][index % 4]}
                    </MiniPill>
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    {item.timeLabel}
                  </p>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
