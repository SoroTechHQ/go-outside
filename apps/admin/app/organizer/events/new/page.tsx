import { DashboardShell } from "../../../../components/dashboard-shell";
import { PageGuide } from "../../../../components/dashboard-primitives";
import { CreateEventForm } from "../../../../components/CreateEventForm";

export default function NewEventPage() {
  return (
    <DashboardShell
      mode="organizer"
      subtitle="Fill in the details below to list a new event on GoOutside."
      title="Create Event"
    >
      <div className="space-y-6">
        <PageGuide
          title="How to create a great event listing"
          tips={[
            "Start with a clear, descriptive title — it's the first thing attendees see when browsing.",
            "Set the date and venue early so GoOutside can surface your event in location-based searches.",
            "Use Save as Draft to review your event before publishing. You can always publish later.",
            "Once published, your event appears in the GoOutside app immediately.",
          ]}
        />
        <CreateEventForm />
      </div>
    </DashboardShell>
  );
}
