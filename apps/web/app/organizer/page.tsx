import { OrganizerDashboardView, OrganizerUpgradeGate } from "./_components/OrganizerDashboardView";
import { getOrganizerDashboardData } from "./_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../lib/db/users";

export default async function OrganizerPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) return null;

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  if (!dashboard) {
    return <OrganizerUpgradeGate firstName={user.first_name} />;
  }

  return <OrganizerDashboardView dashboard={dashboard} />;
}
