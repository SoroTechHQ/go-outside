"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarBlank,
  UsersThree,
  Ticket,
  CurrencyDollar,
  ShieldStar,
  Broadcast,
  Tag,
  House,
  UserCirclePlus,
  ChartLineUp,
  Gear,
  ClipboardText,
  UsersFour,
  ChartBar,
  Plus,
  CreditCard,
  IdentificationCard,
} from "@phosphor-icons/react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleSwitch } from "./theme-controls";

type NavItem = { label: string; href: string; icon: ReactNode };

const adminNav: NavItem[] = [
  { label: "Dashboard",   href: "/",            icon: <SquaresFour    size={20} weight="duotone" /> },
  { label: "Events",      href: "/events",       icon: <CalendarBlank  size={20} weight="duotone" /> },
  { label: "Organizers",  href: "/organizers",   icon: <UsersThree     size={20} weight="duotone" /> },
  { label: "Tickets",     href: "/tickets",      icon: <Ticket         size={20} weight="duotone" /> },
  { label: "Revenue",     href: "/revenue",      icon: <CurrencyDollar size={20} weight="duotone" /> },
  { label: "Moderation",  href: "/moderation",   icon: <ShieldStar     size={20} weight="duotone" /> },
  { label: "Broadcasts",  href: "/broadcasts",   icon: <Broadcast      size={20} weight="duotone" /> },
  { label: "Promotions",  href: "/promotions",   icon: <Tag            size={20} weight="duotone" /> },
  { label: "Users",       href: "/users",        icon: <UserCirclePlus size={20} weight="duotone" /> },
  { label: "Analytics",   href: "/analytics",    icon: <ChartLineUp    size={20} weight="duotone" /> },
  { label: "Settings",    href: "/settings",     icon: <Gear           size={20} weight="duotone" /> },
  { label: "Audit Log",   href: "/audit-log",    icon: <ClipboardText  size={20} weight="duotone" /> },
  { label: "Team",        href: "/team",         icon: <UsersFour      size={20} weight="duotone" /> },
];

const organizerNav: NavItem[] = [
  { label: "Overview",      href: "/organizer",              icon: <House             size={20} weight="duotone" /> },
  { label: "My Events",     href: "/organizer/events",       icon: <CalendarBlank     size={20} weight="duotone" /> },
  { label: "Create Event",  href: "/organizer/events/new",   icon: <Plus              size={20} weight="bold"    /> },
  { label: "Analytics",     href: "/organizer/analytics",    icon: <ChartBar          size={20} weight="duotone" /> },
  { label: "Payouts",       href: "/organizer/payouts",      icon: <CreditCard        size={20} weight="duotone" /> },
  { label: "Profile",       href: "/organizer/profile",      icon: <IdentificationCard size={20} weight="duotone" /> },
];

export function AppSidebar({ mode }: { mode: "admin" | "organizer" }) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const nav = mode === "admin" ? adminNav : organizerNav;
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
            <Image src="/logo-full.png" alt="GoOutside" width={120} height={34} style={{ objectFit: "contain" }} priority />
          ) : (
            <Image src="/logo-mini.png" alt="GoOutside" width={32} height={32} style={{ objectFit: "contain" }} priority />
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
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                } ${wide ? "" : "justify-center"}`}
                title={!wide ? item.label : undefined}
              >
                <span className={active ? "text-[var(--brand)]" : ""}>{item.icon}</span>
                {wide && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
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
