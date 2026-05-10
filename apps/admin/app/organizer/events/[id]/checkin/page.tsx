import { supabaseAdmin } from "../../../../../lib/supabase";
import { DashboardShell } from "../../../../../components/dashboard-shell";
import { PageGuide } from "../../../../../components/dashboard-primitives";
import { CheckinClient } from "../../../../../components/CheckinClient";

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;

  // Fetch event info
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("id, title, tickets_sold, total_capacity")
    .eq("id", eventId)
    .single();

  // Get checked-in count
  const { count: checkedInCount } = await supabaseAdmin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null);

  // Get recent check-ins
  const { data: recentScans } = await supabaseAdmin
    .from("tickets")
    .select("id, attendee_name, attendee_email, checked_in_at")
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null)
    .order("checked_in_at", { ascending: false })
    .limit(10);

  const totalTickets = event?.tickets_sold ?? 0;
  const eventTitle = event?.title ?? "Event";

  return (
    <DashboardShell
      mode="organizer"
      title={`Check-in — ${eventTitle}`}
      subtitle="Scan QR codes or manually enter ticket IDs to check in attendees."
    >
      <div className="space-y-6">
        <PageGuide
          title="How to check in attendees"
          tips={[
            "Ask the attendee to show their GoOutside ticket QR code, then scan it with the camera (HTTPS required).",
            "If camera isn't available, type the ticket ID or attendee email into the Manual Entry box.",
            "Each ticket can only be checked in once — duplicate scans are automatically rejected.",
            "Check-in Progress updates in real time as you scan.",
          ]}
        />
        <CheckinClient
          eventId={eventId}
          totalTickets={totalTickets}
          checkedInCount={checkedInCount ?? 0}
          initialScans={recentScans ?? []}
        />
      </div>
    </DashboardShell>
  );
}
