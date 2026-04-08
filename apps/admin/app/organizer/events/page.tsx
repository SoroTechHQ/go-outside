import { events, getCategoryBySlug } from "@gooutside/demo-data";
import { DataTable, ShellCard, StatCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";

export default function OrganizerEventsPage() {
  return (
    <DashboardShell
      mode="organizer"
      title="My Events"
      subtitle="All your listed events and their current status."
    >
      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={String(events.length)} trend="All listings" tone="neon" />
      </div>

      <DataTable
        columns={["Title", "Category", "Date", "Status", "Sold / Cap", "Actions"]}
        rows={events.map((event) => {
          const category = getCategoryBySlug(event.categorySlug);
          return [
            <div key={`${event.slug}-title`}>
              <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
            </div>,
            category?.name ?? "—",
            `${event.dateLabel} · ${event.timeLabel}`,
            <StatusPill
              key={`${event.slug}-status`}
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
            </StatusPill>,
            event.capacityLabel,
            <div key={`${event.slug}-actions`} className="flex gap-2">
              <StatusPill tone="draft">Edit</StatusPill>
              <StatusPill tone="draft">View Attendees</StatusPill>
            </div>,
          ];
        })}
      />
    </DashboardShell>
  );
}
