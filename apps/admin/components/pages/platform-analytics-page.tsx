import { DashboardShell } from "../dashboard-shell";
import { MetricTile, PageHero, SectionBlock } from "../dashboard-primitives";
import { DonutChart, MultiBarChart, MultiLineChart, RadialGauge } from "../charts/AdminCharts";

export function PlatformAnalyticsPage() {
  return (
    <DashboardShell mode="admin" subtitle="Charts, comparisons, and experimentation surfaces" title="Analytics">
      <div className="space-y-6">
        <PageHero
          eyebrow="Chart page"
          title="A broader chart library than the original green-only dashboard."
          description="This is the chart-heavy surface requested for the admin app: line, stacked bar, donut, and radial views pulled into a single page so the system has a clear place to keep growing."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Conversion rate" meta="Discovery to checkout completion" trend="+2.8 pts" value="18.4%" />
          <MetricTile accent="cyan" label="Avg. order value" meta="Gross booking basket size" trend="+7%" value="GHS 212" />
          <MetricTile accent="violet" label="Promo uplift" meta="Compared to non-promoted listings" trend="+11%" value="1.38x" />
          <MetricTile accent="amber" label="Refund rate" meta="Trailing thirty days" trend="-0.4 pts" value="2.1%" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.3fr,0.7fr]">
          <SectionBlock subtitle="Two-series trend borrowed from the boilerplate line-chart pattern" title="Bookings vs revenue">
            <MultiLineChart
              categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
              series={[
                { name: "Bookings", data: [140, 168, 160, 190, 214, 238], tone: "brand" },
                { name: "Revenue (GHSk)", data: [82, 95, 92, 110, 128, 142], tone: "violet" },
              ]}
            />
          </SectionBlock>

          <SectionBlock subtitle="Fast pulse gauge" title="Launch confidence">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <RadialGauge label="Readiness" tone="cyan" value={78} />
              <RadialGauge label="Support load" tone="amber" value={34} />
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr,0.82fr]">
          <SectionBlock subtitle="Monthly volume across key streams" title="Traffic layers">
            <MultiBarChart
              categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
              series={[
                { name: "Organic", data: [72, 84, 88, 96, 110, 118], tone: "brand" },
                { name: "Paid", data: [34, 38, 35, 44, 52, 56], tone: "amber" },
                { name: "Referral", data: [22, 28, 26, 30, 35, 39], tone: "cyan" },
              ]}
            />
          </SectionBlock>

          <SectionBlock subtitle="Category performance by demand share" title="Demand split">
            <DonutChart
              items={[
                { label: "Music", value: 29, tone: "brand" },
                { label: "Community", value: 21, tone: "cyan" },
                { label: "Food", value: 18, tone: "amber" },
                { label: "Tech", value: 17, tone: "violet" },
                { label: "Arts", value: 15, tone: "coral" },
              ]}
            />
          </SectionBlock>

          <SectionBlock subtitle="Quick comparisons" title="Signals">
            <div className="space-y-4">
              {[
                ["Homepage placement CTR", "4.8%", "brand"],
                ["Search to event detail", "36%", "cyan"],
                ["Ticket checkout completion", "72%", "violet"],
                ["Moderation same-day closure", "64%", "amber"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="text-sm text-[var(--text-secondary)]">{label}</p>
                  <p className="mt-2 font-display text-3xl italic text-[var(--text-primary)]">{value}</p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--bg-card-alt)]">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: value,
                        backgroundColor:
                          tone === "brand"
                            ? "var(--brand)"
                            : tone === "cyan"
                              ? "var(--accent-cyan)"
                              : tone === "violet"
                                ? "var(--accent-violet)"
                                : "var(--accent-amber)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>
      </div>
    </DashboardShell>
  );
}
