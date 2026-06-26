import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import OrganizerShell from "./_components/OrganizerShell";
import { getOrganizerDashboardData } from "./_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../lib/db/users";
import { supabaseAdmin } from "../../lib/supabase";
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

  if (user.role !== "organizer" && user.role !== "admin") {
    redirect("/home");
  }

  // Auto-heal: if the user has organizer role but their organizer_profiles row is
  // missing (can happen when the become-organizer API fails mid-write), create it
  // so they can access their dashboard without being stuck in a redirect loop.
  const { data: existingProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fallbackName =
      `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
      user.first_name ||
      "My Organisation";
    await supabaseAdmin.from("organizer_profiles").upsert(
      {
        user_id: user.id,
        organization_name: fallbackName,
        status: "approved",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  const dashboard = await getOrganizerDashboardData(user.id);
  if (!dashboard) redirect("/home");

  const fallbackName = `${user.first_name} ${user.last_name}`.trim() || user.first_name;

  const now = new Date().toISOString();

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
    // No AppChrome here — organizer studio is a standalone workspace
    <div className="h-screen">
      <OrganizerShell
        organizer={dashboard.organizer ?? null}
        organizerName={dashboard.organizer?.name ?? fallbackName}
        ownEvents={ownEvents}
        verified={Boolean(dashboard.organizer?.verified)}
        followerCount={dashboard.overview.followerCount}
        avatarUrl={clerkUser.imageUrl ?? null}
        userName={fallbackName}
      >
        {children}
      </OrganizerShell>
    </div>
  );
}
