import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { AvatarStack, MetricTile, MiniPill, SectionBlock } from "../dashboard-primitives";
import { EventActionsRow } from "../EventActionsRow";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string): "brand" | "amber" | "coral" | "violet" | "cyan" {
  switch (status) {
    case "published":
      return "brand";
    case "draft":
      return "amber";
    case "cancelled":
      return "coral";
    default:
      return "violet";
  }
}

type EventRow = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  start_datetime: string | null;
  tickets_sold: number | null;
  total_capacity: number | null;
  is_featured: boolean | null;
  is_landmark: boolean | null;
  is_sponsored: boolean | null;
  categories: { name: string } | null;
  organizer: { first_name: string | null; last_name: string | null } | null;
};

export async function PlatformEventsPage() {
  // ── Status KPI counts ────────────────────────────────────────────────────
  const [{ count: live }, { count: draft }, { count: cancelled }] = await Promise.all([
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
  ]);

  // ── Events table ─────────────────────────────────────────────────────────
  const { data: rawEvents } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, status, start_datetime, tickets_sold, total_capacity,
      is_featured, is_landmark, is_sponsored,
      categories(name),
      organizer:users!events_organizer_id_fkey(first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const eventsData = (rawEvents ?? []) as unknown as EventRow[];

  return (
    <DashboardShell mode="admin" subtitle="Review, approve and feature events." title="Events">
      <div className="space-y-6">
        {/* Status KPI pills */}
        <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-3">
          <MetricTile
            accent="brand"
            label="Live events"
            meta="Currently published and discoverable"
            trend="Published"
            value={String(live ?? 0)}
          />
          <MetricTile
            accent="amber"
            label="Draft events"
            meta="Awaiting organizer submission or admin approval"
            trend="Draft"
            value={String(draft ?? 0)}
          />
          <MetricTile
            accent="coral"
            label="Cancelled events"
            meta="Events that have been cancelled"
            trend="Cancelled"
            value={String(cancelled ?? 0)}
          />
        </div>

        {/* Events table */}
        <SectionBlock
          subtitle="All events ordered by creation date — publish or feature directly from this table."
          title="Event index"
        >
          {eventsData.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No events found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Title", "Organizer", "Category", "Date", "Tickets", "Status", "Actions"].map((heading) => (
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
                  {eventsData.map((event) => {
                    const organizerName = event.organizer
                      ? [event.organizer.first_name, event.organizer.last_name].filter(Boolean).join(" ") || "Unknown"
                      : "Unknown";
                    const categoryName = event.categories?.name ?? "General";

                    return (
                      <tr key={event.id}>
                        {/* Title */}
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)]">{event.title}</span>
                            {event.is_landmark && (
                              <MiniPill tone="amber">Landmark</MiniPill>
                            )}
                            {event.is_sponsored && (
                              <MiniPill tone="violet">Sponsored</MiniPill>
                            )}
                          </div>
                        </td>

                        {/* Organizer */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <AvatarStack names={[organizerName]} />
                            <span className="font-medium text-[var(--text-primary)]">{organizerName}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{categoryName}</td>

                        {/* Date */}
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">
                          {formatDate(event.start_datetime)}
                        </td>

                        {/* Tickets */}
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">
                          {event.tickets_sold ?? 0} / {event.total_capacity ?? "∞"}
                        </td>

                        {/* Status badge */}
                        <td className="py-4 pr-4">
                          <MiniPill tone={statusTone(event.status)}>{event.status}</MiniPill>
                        </td>

                        {/* Actions (client component) */}
                        <td className="py-4">
                          <EventActionsRow
                            id={event.id}
                            slug={event.slug ?? event.id}
                            status={event.status}
                            isFeatured={event.is_featured ?? false}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
