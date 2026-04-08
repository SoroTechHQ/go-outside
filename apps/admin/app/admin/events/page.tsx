import { events, getCategoryBySlug, getOrganizerById } from "@gooutside/demo-data";
import { DataTable, ShellCard, StatusPill } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";

const statusFilters = ["all", "live", "pending", "review"];

export default function AdminEventsPage() {
  return (
    <DashboardShell
      mode="admin"
      title="Events"
      subtitle="All platform events"
    >
      <ShellCard>
        <div className="mb-5 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <div
              key={filter}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] cursor-pointer ${
                filter === "all"
                  ? "border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]"
                  : "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
              }`}
            >
              {filter}
            </div>
          ))}
        </div>

        <DataTable
          columns={["Event", "Organizer", "Category", "Date", "Status", "Actions"]}
          rows={events.map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            const organizer = getOrganizerById(event.organizerId);
            return [
              <div key={`${event.slug}-title`}>
                <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{event.locationLine}</div>
              </div>,
              organizer?.name ?? "—",
              category?.name ?? "—",
              event.dateLabel,
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
              <div key={`${event.slug}-actions`} className="flex gap-2">
                <StatusPill tone="live">Feature</StatusPill>
                <StatusPill tone="pending">Approve</StatusPill>
                <StatusPill tone="review">Remove</StatusPill>
              </div>,
            ];
          })}
        />
      </ShellCard>
    </DashboardShell>
  );
}
