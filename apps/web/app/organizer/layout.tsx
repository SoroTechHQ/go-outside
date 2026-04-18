import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import OrganizerShell from "./_components/OrganizerShell";
import { getOrganizerDashboardData } from "./_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../lib/db/users";
import { STEP_ROUTES } from "../../lib/onboarding-utils";

export const dynamic = "force-dynamic";

export default async function OrganizerLayout({ children }: { children: ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const meta = clerkUser.unsafeMetadata ?? {};
  const onboardingComplete = meta.onboardingComplete as boolean | undefined;

  if (!onboardingComplete) {
    const step = (meta.onboardingStep as number | undefined) ?? 1;
    redirect(STEP_ROUTES[step] ?? STEP_ROUTES[1]);
  }

  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  const fallbackName = `${user.first_name} ${user.last_name}`.trim() || user.first_name;

  return (
    <div className="h-screen overflow-hidden">
      <OrganizerShell
        organizerName={dashboard?.organizer.name ?? fallbackName}
        verified={Boolean(dashboard?.organizer.verified)}
      >
        {children}
      </OrganizerShell>
    </div>
  );
}
