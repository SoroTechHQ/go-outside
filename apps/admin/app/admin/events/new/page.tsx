import { DashboardShell } from "../../../../components/dashboard-shell";
import { PageGuide } from "../../../../components/dashboard-primitives";
import { CreateEventForm } from "../../../../components/CreateEventForm";

export default async function AdminNewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ sponsored?: string }>;
}) {
  const params = await searchParams;
  const defaultSponsored = params.sponsored === "1";

  return (
    <DashboardShell
      mode="admin"
      title={defaultSponsored ? "Create Sponsored Event" : "Create Event"}
      subtitle={
        defaultSponsored
          ? "This event will appear as a sponsored ad on the home feed."
          : "Fill in the details below to list a new event on GoOutside."
      }
    >
      <div className="space-y-6">
        {defaultSponsored && (
          <div className="rounded-xl border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-4 py-3 text-sm text-[var(--accent-amber)]">
            <span className="font-semibold">Sponsored placement enabled.</span> This event will be shown as a featured ad on the GoOutside home feed once published. Set a &ldquo;Sponsored until&rdquo; date so it auto-expires.
          </div>
        )}
        <PageGuide
          title="Tips for a great sponsored event"
          tips={[
            "Add a wide landscape banner image (1200×400px minimum) — it's the hero image users see on the home feed.",
            "Set a clear 'Sponsored until' date so the placement auto-expires.",
            "Only one sponsored event appears on the home feed at a time — the earliest upcoming one wins.",
            "You can always toggle sponsorship on/off from the Promotions page.",
          ]}
        />
        <CreateEventForm defaultSponsored={defaultSponsored} />
      </div>
    </DashboardShell>
  );
}
