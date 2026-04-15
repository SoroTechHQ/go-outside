import { NextRequest, NextResponse } from "next/server";

/**
 * Demo-mode middleware — no real Clerk.
 *
 * Protected paths:   /dashboard/*, /organizer/*, /onboarding/*
 * Auth-only paths:   /sign-in, /sign-up  (redirect → /dashboard when already signed in)
 *
 * Auth state is stored in a cookie called `demo_signed_in` which the
 * sign-in/sign-up pages set after a successful demo login.
 * (When Clerk is wired up, swap this entire file for the official
 *  clerkMiddleware() + createRouteMatcher pattern.)
 */

const PROTECTED = ["/dashboard", "/organizer", "/onboarding"];
const AUTH_ONLY  = ["/sign-in", "/sign-up"];

function isProtected(pathname: string) {
  return PROTECTED.some((prefix) => pathname.startsWith(prefix));
}

function isAuthOnly(pathname: string) {
  return AUTH_ONLY.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = req.cookies.get("demo_signed_in")?.value === "true";

  // Redirect unauthenticated users away from protected routes
  if (isProtected(pathname) && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from sign-in / sign-up
  if (isAuthOnly(pathname) && signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = req.nextUrl.searchParams.get("redirect") ?? "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image, favicon.ico
     * - public assets (images, fonts, etc.)
     * - API routes handled server-side (/api/*)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
