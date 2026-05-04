"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleSwitch } from "./theme-controls";

type NavItem = { label: string; href: string; icon: ReactNode };

const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="12" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="2" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="12" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/></svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M13 1.5v3M7 1.5v3M2 7.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Organizers",
    href: "/organizers",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M1 17v-.5A6 6 0 0 1 13 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="15" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M13.5 17v-.5a3 3 0 0 1 5.5 0v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1.5a2 2 0 0 0 0 4V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a2 2 0 0 0 0-4V7Z" stroke="currentColor" strokeWidth="1.6"/><path d="M13 6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 2"/></svg>
    ),
  },
  {
    label: "Revenue",
    href: "/revenue",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v1.5M10 12.5V14M7.5 11a2.5 2.5 0 0 0 5 0c0-1.38-1.12-2-2.5-2S7.5 8.38 7.5 7a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Moderation",
    href: "/moderation",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 2l1.8 5.4H17l-4.5 3.3 1.7 5.2L10 13l-4.2 2.9 1.7-5.2L3 7.4h5.2L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: "Broadcasts",
    href: "/broadcasts",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M4 10H2M18 10h-2M10 2V4M10 16v2M5.64 5.64 4.22 4.22M15.78 15.78l-1.42-1.42M5.64 14.36l-1.42 1.42M15.78 4.22l-1.42 1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
    ),
  },
  {
    label: "Promotions",
    href: "/promotions",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M3 10.5 10 3l7 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M8 17v-4h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M1.5 18v-1a6.5 6.5 0 0 1 13 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M17 9v5M19.5 11.5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M3 14.5 8 9l3.5 3.5L17 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 6h6M7 10h6M7 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
];

const organizerNav: NavItem[] = [
  {
    label: "Overview",
    href: "/organizer",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: "My Events",
    href: "/organizer/events",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Create Event",
    href: "/organizer/events/new",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Analytics",
    href: "/organizer/analytics",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 17l5-5 4 4 5-6 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: "Payouts",
    href: "/organizer/payouts",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Profile",
    href: "/organizer/profile",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
  },
];

export function AppSidebar({ mode }: { mode: "admin" | "organizer" }) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const nav = mode === "admin" ? adminNav : organizerNav;
  const title = "GoOutside";
  const subtitle = mode === "admin" ? "Platform Admin" : "Organizer";

  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

      <aside
        className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%),var(--bg-elevated)] transition-all duration-300 ease-in-out"
        style={{ width: wide ? "290px" : "90px", transform: isMobileOpen ? "translateX(0)" : undefined }}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className={`flex h-16 shrink-0 items-center border-b border-[var(--border-subtle)] px-5 ${wide ? "justify-start" : "justify-center"}`}>
          {wide ? (
            <div>
              <Image
                src="/logo-full.png"
                alt="GoOutside"
                width={120}
                height={34}
                style={{ objectFit: "contain" }}
                priority
              />
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{subtitle}</div>
            </div>
          ) : (
            <Image
              src="/logo-mini.png"
              alt="GoOutside"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
              priority
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                } ${wide ? "" : "justify-center"}`}
                title={!wide ? item.label : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-2 h-7 w-[3px] rounded-r-full bg-[var(--neon)]" />
                )}
                <span className={active ? "text-[var(--accent-cyan)]" : ""}>{item.icon}</span>
                {wide && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom avatar */}
        {wide ? (
          <div className="shrink-0 border-t border-[var(--border-subtle)] p-4">
            {mode === "admin" ? <ThemeToggleSwitch className="mb-4" /> : null}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-[#0e1410]">
                {mode === "admin" ? "AD" : "SS"}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {mode === "admin" ? "Admin" : "Sankofa Sessions"}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">{subtitle}</div>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
