"use client";

import { usePathname } from "next/navigation";
import AppBackground from "./AppBackground";
import AppChrome from "./AppChrome";
import Footer from "./Footer";
import type { ReactNode } from "react";

// Routes that should render without the app shell (sidebar, header, footer, bg)
const STANDALONE_ROUTES = ["/waitlist", "/ad-waitlist"];

export function ConditionalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <AppBackground />
      <AppChrome />
      <div className="app-content">{children}</div>
      <Footer />
    </>
  );
}
