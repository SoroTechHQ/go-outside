import { redirect } from "next/navigation";
import OrganizerPortal, { OrganizerUpgradeGate } from "../../../components/organizer/OrganizerPortal";
import { getOrganizerDashboardData } from "../../../lib/db/organizer-dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboardPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 py-6 md:px-6 md:py-8">
        {dashboard ? (
          <OrganizerPortal dashboard={dashboard} />
        ) : (
          <OrganizerUpgradeGate firstName={user.first_name} />
        )}
      </div>
    </main>
  );
}
