import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/organizer(.*)",
  "/onboarding(.*)",
  "/home(.*)",
  "/settings",
]);

const isMarketingRoot = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Authenticated user visiting "/" → send straight to /home
  if (isMarketingRoot(req) && userId) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Protect app routes (redirects to sign-in if not authenticated)
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
