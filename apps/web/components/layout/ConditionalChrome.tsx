"use client";

import { usePathname } from "next/navigation";
import AppBackground from "./AppBackground";
import AppChrome from "./AppChrome";
import Footer from "./Footer";
import type { ReactNode } from "react";

// Routes that should render without the app shell (sidebar, header, footer, bg)
// "/" is handled by page.tsx which injects chrome only when authenticated
const STANDALONE_ROUTES = ["/", "/waitlist", "/ad-waitlist"];

// Routes that suppress only the footer (app chrome stays)
const NO_FOOTER_ROUTES = ["/dashboard/wallets"];

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
