import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { STEP_ROUTES } from "../../lib/onboarding-utils";
import { StreamTokenPrewarm } from "../../components/messages/StreamTokenPrewarm";

/**
 * Dashboard layout — guards against users who haven't completed onboarding.
 * Runs as a Server Component so it has access to Clerk server helpers.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const meta               = user.unsafeMetadata ?? {};
  const onboardingComplete = meta.onboardingComplete as boolean | undefined;

  if (!onboardingComplete) {
    const step = (meta.onboardingStep as number | undefined) ?? 1;
    const dest = STEP_ROUTES[step] ?? STEP_ROUTES[1];
    redirect(dest);
  }

  return (
    <>
      <StreamTokenPrewarm />
      {children}
    </>
  );
}
