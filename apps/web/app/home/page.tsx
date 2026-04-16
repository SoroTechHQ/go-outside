import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import HomeClient from "../../components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const meta               = user.unsafeMetadata ?? {};
  const onboardingComplete = meta.onboardingComplete as boolean | undefined;

  if (!onboardingComplete) {
    const step = (meta.onboardingStep as number | undefined) ?? 1;
    const STEP_ROUTES: Record<number, string> = {
      1: "/onboarding/profile",
      2: "/onboarding/vibe",
      3: "/onboarding/history",
      4: "/onboarding/interests",
      5: "/onboarding/pulse",
    };
    redirect(STEP_ROUTES[step] ?? "/onboarding/profile");
  }

  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
