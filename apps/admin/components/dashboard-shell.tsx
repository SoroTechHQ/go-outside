"use client";

import type { ReactNode } from "react";
import { useSidebar } from "../context/SidebarContext";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: "admin" | "organizer";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const sidebarWidth =
    isMobileOpen || isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.08),transparent_26%),radial-gradient(circle_at_bottom,rgba(74,222,128,0.08),transparent_26%)]" />
      <AppSidebar mode={mode} />
      <div className={`transition-all duration-300 ease-in-out ${sidebarWidth}`}>
        <AppHeader title={title} subtitle={subtitle} />
        <main className="mx-auto max-w-[1520px] p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
