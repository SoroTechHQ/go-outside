"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleSwitch } from "./theme-controls";

type NavItem = { label: string; href: string; icon: ReactNode };

const adminNav: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 11v6M22 14h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 17.5 9 12l4 4 7-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/><path d="M4 20h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Tables",
    href: "/tables",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 4v16M16 4v16" stroke="currentColor" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Forms",
    href: "/forms",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Components",
    href: "/components",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M3 15v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/><rect x="7.5" y="7.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Media",
    href: "/media",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="10" r="1.5" fill="currentColor"/><path d="m21 15-4.5-4.5-4 4-2.5-2.5L3 19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/></svg>
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
              <div className="font-display text-2xl italic text-[var(--text-primary)]">{title}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{subtitle}</div>
            </div>
          ) : (
            <div className="font-display text-xl italic text-[var(--accent-cyan)]">G</div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {wide && mode === "admin" ? (
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
              Platform UI
            </p>
          ) : null}
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
