import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, PageHero, SectionBlock } from "../../../components/dashboard-primitives";
import { MultiBarChart, MultiLineChart } from "../../../components/charts/AdminCharts";

export default function OrganizerAnalyticsPage() {
  return (
    <DashboardShell mode="organizer" subtitle="Demand, revenue, and launch diagnostics" title="Analytics">
      <div className="space-y-6">
        <PageHero
          eyebrow="Organizer"
          title="A fuller analytics page for event operators."
          description="This keeps organizer navigation complete and gives the admin shell a parallel experience on the organizer side."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile accent="brand" label="Ticket conversion" meta="Detail page to checkout" trend="+3.4 pts" value="21%" />
          <MetricTile accent="cyan" label="Revenue pace" meta="This month vs last month" trend="+14%" value="GHS 42k" />
          <MetricTile accent="violet" label="Returning buyers" meta="Repeat guests across launches" trend="+9%" value="38%" />
          <MetricTile accent="amber" label="Support flags" meta="Open attendee issues" trend="6 open" value="6" />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionBlock subtitle="Weekly ticket demand" title="Sales trend">
            <MultiLineChart
              categories={["W1", "W2", "W3", "W4", "W5", "W6"]}
              series={[
                { name: "Tickets sold", data: [36, 44, 42, 52, 61, 68], tone: "brand" },
                { name: "Waitlist", data: [8, 10, 9, 12, 15, 19], tone: "violet" },
              ]}
            />
          </SectionBlock>
          <SectionBlock subtitle="Campaign sources" title="Acquisition">
            <MultiBarChart
              categories={["IG", "Email", "Referral", "Homepage", "Search", "Partner"]}
              series={[
                { name: "Clicks", data: [56, 48, 32, 41, 38, 26], tone: "cyan" },
                { name: "Bookings", data: [24, 22, 14, 18, 16, 11], tone: "brand" },
              ]}
            />
          </SectionBlock>
        </div>
      </div>
    </DashboardShell>
  );
}
