import { supabaseAdmin } from "../../../lib/supabase";
import { StatCard } from "@gooutside/ui";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MiniPill, PageGuide } from "../../../components/dashboard-primitives";
import { OrganizerEventActions } from "../../../components/OrganizerEventActions";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const statusTone = (s: string | null): "brand" | "amber" | "coral" | "violet" | "cyan" => {
  if (s === "published") return "brand";
  if (s === "draft") return "cyan";
  if (s === "cancelled") return "coral";
  return "amber";
};

export default async function OrganizerEventsPage() {
  // Fetch the top verified organizer (same as dashboard)
  const { data: orgProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select("user_id, organization_name")
    .eq("status", "active")
    .not("verified_at", "is", null)
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  const userId = orgProfile?.user_id ?? null;

  const { data: events } = userId
    ? await supabaseAdmin
        .from("events")
        .select("id, title, status, start_datetime, tickets_sold, total_capacity, location_name, category_slug")
        .eq("organizer_id", userId)
        .order("start_datetime", { ascending: false })
        .limit(50)
    : { data: [] };

  const allEvents = events ?? [];

  const publishedCount = allEvents.filter((e) => e.status === "published").length;
  const draftCount = allEvents.filter((e) => e.status === "draft").length;
  const totalSold = allEvents.reduce((s, e) => s + (e.tickets_sold ?? 0), 0);

  return (
    <DashboardShell
      mode="organizer"
      title="My Events"
      subtitle="All your listed events and their current status."
    >
      <div className="space-y-6">
        <PageGuide
          title="Manage all your events in one place"
          tips={[
            "Click Edit to update an event's details, date, or ticket types.",
            "Click Attendees to see who has bought tickets and check their check-in status.",
            "Draft events are only visible to you — publish them when they're ready to go live.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total events" value={String(allEvents.length)} trend="All listings" tone="neon" />
          <StatCard label="Published" value={String(publishedCount)} trend="Live now" tone="neon" />
          <StatCard label="Draft" value={String(draftCount)} trend="Not yet live" tone="neon" />
          <StatCard label="Tickets sold" value={totalSold.toLocaleString()} trend="Across all events" tone="neon" />
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Event", "Date", "Status", "Sold / Cap", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {allEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--text-tertiary)]">
                      No events yet. Create your first event to get started.
                    </td>
                  </tr>
                ) : (
                  allEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[var(--bg-muted)]/50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--text-primary)]">{event.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{event.location_name ?? "—"}</div>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">
                        {event.start_datetime ? formatDate(event.start_datetime) : "TBD"}
                      </td>
                      <td className="px-5 py-4">
                        <MiniPill tone={statusTone(event.status ?? null)}>
                          {event.status ?? "draft"}
                        </MiniPill>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">
                        {event.tickets_sold ?? 0} / {event.total_capacity ?? "∞"}
                      </td>
                      <td className="px-5 py-4">
                        <OrganizerEventActions
                          eventId={event.id}
                          eventTitle={event.title ?? "Event"}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
