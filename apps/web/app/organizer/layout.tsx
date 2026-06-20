import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import OrganizerShell from "./_components/OrganizerShell";
import { getOrganizerDashboardData } from "./_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../lib/db/users";
import { STEP_ROUTES } from "../../lib/onboarding-utils";
import { AppChrome } from "../../components/layout/AppChrome";

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

  if (user.role !== "organizer" && user.role !== "admin") {
    redirect("/home");
  }

  const dashboard = await getOrganizerDashboardData(user.id);
  if (!dashboard) redirect("/home");

  const fallbackName = `${user.first_name} ${user.last_name}`.trim() || user.first_name;

  const now = new Date().toISOString();

  // Only show upcoming published events in the sidebar "Next up" — sorted soonest first
  const ownEvents = (dashboard.recentEvents ?? [])
    .filter((e) => e.statusLabel === "Live" && e.rawDate != null && e.rawDate >= now)
    .sort((a, b) => (a.rawDate ?? "").localeCompare(b.rawDate ?? ""))
    .map((e) => ({
      id: e.id,
      title: e.title,
      date: e.dateLabel ?? null,
      slug: e.slug,
    }));

  return (
    <div className="h-screen overflow-hidden">
      <AppChrome />
      <OrganizerShell
        organizer={dashboard.organizer ?? null}
        organizerName={dashboard.organizer?.name ?? fallbackName}
        ownEvents={ownEvents}
        verified={Boolean(dashboard.organizer?.verified)}
        followerCount={dashboard.overview.followerCount}
      >
        {children}
      </OrganizerShell>
    </div>
  );
}
