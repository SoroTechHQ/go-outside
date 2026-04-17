"use client";

import { usePathname } from "next/navigation";
import AppBackground from "./AppBackground";
import AppChrome from "./AppChrome";
import Footer from "./Footer";
import type { ReactNode } from "react";

// Routes that should render without the app shell (sidebar, header, footer, bg)
// "/" uses the (marketing) layout which has its own navbar/footer
const STANDALONE_ROUTES = ["/", "/waitlist", "/ad-waitlist", "/sign-in", "/sign-up", "/onboarding"];

// Routes that suppress only the footer (app chrome stays)
const NO_FOOTER_ROUTES = [
  "/dashboard/wallets",
  "/dashboard/messages",
  "/dashboard/activity",
  "/dashboard/notifications",
  "/dashboard/tickets",
  "/dashboard/saved",
  "/dashboard/profile",
  "/dashboard/trending",
  "/dashboard/checkout",
  "/dashboard/user",
  "/dashboard/organizer",
  "/dashboard/events",
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
