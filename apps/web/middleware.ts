import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { STEP_ROUTES } from "./lib/onboarding-utils";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/organizer(.*)",
  "/onboarding(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isApiRoute        = createRouteMatcher(["/api(.*)"]);
const isAuthRoute       = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 1. Protect all routes requiring auth
  if (isProtected(req)) {
    await auth.protect();
  }

  // 2. If authenticated and not on an API/auth/onboarding route,
  //    check if onboarding is complete and redirect if needed
  if (userId && !isApiRoute(req) && !isAuthRoute(req)) {
    try {
      const client = await clerkClient();
      const user   = await client.users.getUser(userId);
      const meta   = user.unsafeMetadata ?? {};

      const onboardingComplete = meta.onboardingComplete as boolean | undefined;

      // Skip check for users already in onboarding flow
      if (!onboardingComplete && !isOnboardingRoute(req)) {
        // Don't redirect from root / marketing pages
        const path = req.nextUrl.pathname;
        const isDashboard = path.startsWith("/dashboard") || path.startsWith("/organizer");

        if (isDashboard) {
          const step = (meta.onboardingStep as number | undefined) ?? 1;
          const dest = STEP_ROUTES[step] ?? STEP_ROUTES[1];
          return NextResponse.redirect(new URL(dest, req.url));
        }
      }
    } catch {
      // If Clerk lookup fails, let the request through
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
