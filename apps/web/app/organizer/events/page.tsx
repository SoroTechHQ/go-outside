import { getOrganizerAllEvents, getOrganizerDashboardData } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { OrganizerEventsClient } from "./OrganizerEventsClient";

export default async function OrganizerEventsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const isOrganizer = user.role === "organizer" || user.role === "admin";
  if (!isOrganizer) return null;

  const dashboard = await getOrganizerDashboardData(user.id);
  if (!dashboard) return null;

  const events = await getOrganizerAllEvents(
    user.id,
    dashboard.overview.revenue,
    dashboard.overview.ticketSales,
  );

  return (
    <OrganizerEventsClient
      events={events}
      totalEvents={dashboard.organizer.totalEvents}
    />
  );
}
