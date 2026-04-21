import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import HomeClient from "../../components/home/HomeClient";
import {
  appBootstrapQueryKey,
  eventsFeedQueryKey,
  feedFiltersFromSearchParams,
  savedEventsQueryKey,
} from "../../lib/app-contracts";
import { loadAppBootstrap, loadFeedPage } from "../../lib/server/home-data";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const [cookieStore, resolvedSearchParams] = await Promise.all([cookies(), searchParams]);

  // ── Fast path ──────────────────────────────────────────────────────────────
  // If go_done cookie is present the user already completed onboarding.
  // Skip the Clerk currentUser() network call entirely.
  const goDone = cookieStore.get("go_done")?.value === "1";
  let clerkId: string | null | undefined;

  // ── Slow path — first visit after sign-up or cookie expired ───────────────
  if (!goDone) {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    clerkId = user.id;

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
  }

  const filters = feedFiltersFromSearchParams(resolvedSearchParams);
  const [bootstrap, initialFeed] = await Promise.all([
    loadAppBootstrap({ clerkId }),
    loadFeedPage({ clerkId, filters, page: 0 }),
  ]);

  const queryClient = new QueryClient();
  queryClient.setQueryData(appBootstrapQueryKey, bootstrap);
  queryClient.setQueryData(savedEventsQueryKey, bootstrap.savedEventIds);
  queryClient.setQueryData(eventsFeedQueryKey(filters), {
    pages: [initialFeed],
    pageParams: [0],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <HomeClient />
      </Suspense>
    </HydrationBoundary>
  );
}
