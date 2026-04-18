"use client";

import { usePathname } from "next/navigation";
import AppBackground from "./AppBackground";
import AppChrome from "./AppChrome";
import Footer from "./Footer";
import type { ReactNode } from "react";

// Routes that should render without the app shell (sidebar, header, footer, bg)
// "/" uses the (marketing) layout which has its own navbar/footer
const STANDALONE_ROUTES = [
  "/",
  "/waitlist",
  "/ad-waitlist",
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/organizer", // organizer portal has its own full-screen shell
];

// Routes that suppress only the footer (app chrome stays).
// These use the clean rewritten URLs (e.g. /messages not /dashboard/messages).
const NO_FOOTER_ROUTES = [
  "/wallets",
  "/messages",
  "/activity",
  "/notifications",
  "/tickets",
  "/saved",
  "/profile",
  "/trending",
  "/checkout",
  "/user",
  "/events",
  // Also catch any legacy /dashboard/* direct hits during transition
  "/dashboard",
];

export function ConditionalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const hideFooter = NO_FOOTER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <AppBackground />
      <AppChrome />
      <div className="app-content">{children}</div>
      {!hideFooter && <Footer />}
    </>
  );
}
