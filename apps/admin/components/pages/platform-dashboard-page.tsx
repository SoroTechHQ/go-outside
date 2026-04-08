import Link from "next/link";
import { demoData, events, getCategoryBySlug } from "@gooutside/demo-data";
import { Button, ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import {
  AccentDot,
  MetricTile,
  MiniPill,
  PageHero,
  ProgressRow,
  SectionBlock,
} from "../dashboard-primitives";
import { DonutChart, MultiBarChart, MultiLineChart } from "../charts/AdminCharts";

const acquisitionSeries = [
  { name: "Bookings", data: [22, 26, 24, 31, 38, 42], tone: "brand" as const },
  { name: "Waitlist", data: [8, 11, 10, 13, 16, 19], tone: "violet" as const },
];

const channelSeries = [
  { name: "Organic", data: [18, 22, 21, 26, 30, 35], tone: "cyan" as const },
  { name: "Paid", data: [9, 12, 10, 14, 16, 18], tone: "amber" as const },
  { name: "Referral", data: [6, 8, 7, 9, 11, 12], tone: "coral" as const },
];

const categoryItems = demoData.adminDashboard.categoryMix.map((item, index) => ({
  label: item.label,
  value: item.value,
  tone: (["brand", "cyan", "violet", "coral", "amber"] as const)[index % 5],
}));

export function PlatformDashboardPage() {
  const { stats, activities } = demoData.adminDashboard;
  const spotlightEvents = events.slice(0, 4);

  return (
    <DashboardShell
      mode="admin"
      title="Platform Dashboard"
      subtitle="The root-level operating view for admin.gooutside"
    >
      <div className="space-y-6">
        <PageHero
          eyebrow="Boilerplate integration"
          title="The dashboard has moved to the root surface."
          description="This version keeps the dashboard shell from the boilerplate, but recasts it with the GoOutside system: broader accent colors, chart diversity, denser cards, and a routing model that assumes the admin app lives at the domain root instead of under /admin."
          actions={
            <>
              <Button href="/analytics">Open analytics</Button>
              <Button href="/components" variant="ghost">
                Review UI library
              </Button>
            </>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label={stats[0].label}
            meta="Live events, moderation, and check-in activity"
            trend={stats[0].trend}
            value={stats[0].value}
          />
          <MetricTile
            accent="cyan"
            label={stats[1].label}
            meta="Bookings rising after last week’s event discovery changes"
            trend={stats[1].trend}
            value={stats[1].value}
          />
          <MetricTile
            accent="violet"
            label={stats[2].label}
            meta="Organizer teams with upcoming launches this month"
            trend={stats[2].trend}
            value={stats[2].value}
          />
          <MetricTile
            accent="coral"
            label={stats[3].label}
            meta="Queue pressure across trust, payments, and listings"
            trend={stats[3].trend}
            value={stats[3].value}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr,1fr,0.82fr]">
          <SectionBlock
            action={<MiniPill tone="cyan">Quarter to date</MiniPill>}
            subtitle="Bookings and waitlist demand over the last six months"
            title="Audience momentum"
          >
            <MultiLineChart categories={["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]} series={acquisitionSeries} />
          </SectionBlock>

          <SectionBlock subtitle="Top acquisition channels by month" title="Channel mix">
            <MultiBarChart
              categories={["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]}
              height={292}
              series={channelSeries}
              stacked
            />
          </SectionBlock>

          <SectionBlock subtitle="What attendees are actually booking" title="Category share">
            <DonutChart height={220} items={categoryItems} />
            <div className="mt-4 space-y-3">
              {categoryItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AccentDot tone={item.tone} />
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{item.value}%</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr,1fr]">
          <SectionBlock
            action={
              <Link className="text-xs font-semibold text-[var(--accent-cyan)] hover:underline" href="/events">
                View all events
              </Link>
            }
            subtitle="Ported table density inspired by the boilerplate’s data pages"
            title="Launch calendar"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Event", "Category", "Date", "Status", "Priority"].map((item) => (
                      <th
                        key={item}
                        className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {spotlightEvents.map((event, index) => {
                    const category = getCategoryBySlug(event.categorySlug);
                    return (
                      <tr key={event.id}>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
                        </td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{category?.name ?? "General"}</td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{event.dateLabel}</td>
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
                          <MiniPill tone={(["brand", "cyan", "amber", "coral"] as const)[index % 4]}>
                            {["Featured", "Monitor", "Promo push", "Moderate"][index]}
                          </MiniPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionBlock>

          <div className="space-y-5">
            <SectionBlock subtitle="The most active operator queues right now" title="Ops pressure">
              <div className="space-y-4">
                <ProgressRow label="Moderation backlog" tone="coral" value={74} />
                <ProgressRow label="Organizer onboarding" tone="violet" value={58} />
                <ProgressRow label="Payment review queue" tone="amber" value={46} />
                <ProgressRow label="Discovery experiment rollout" tone="cyan" value={82} />
              </div>
            </SectionBlock>

            <ShellCard className="bg-[linear-gradient(135deg,rgba(167,139,250,0.14),rgba(56,189,248,0.08),transparent_75%),var(--bg-card)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">
                Live activity
              </p>
              <div className="mt-4 space-y-3">
                {activities.map((activity, index) => (
                  <div
                    key={activity.title}
                    className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--bg-card)]">
                        <AccentDot tone={(["brand", "cyan", "violet", "coral"] as const)[index % 4]} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-primary)]">{activity.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{activity.meta}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          {activity.timeLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
