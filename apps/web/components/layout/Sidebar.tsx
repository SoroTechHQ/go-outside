"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Compass,
  HeartStraight,
  HouseLine,
  MoonStars,
  PlusCircle,
  SunDim,
  Ticket,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
};

type NavItem = {
  href: string;
  icon: typeof HouseLine;
  label: string;
  unread?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ role = "attendee", userName = "Kofi Mensah" }: SidebarProps) {
  const pathname = usePathname();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isWideDesktop = useMediaQuery("(min-width: 1280px)");
  const [hovered, setHovered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme;
    setTheme(currentTheme === "light" ? "light" : "dark");
  }, []);

  if (!isTabletUp) {
    return null;
  }

  const allowHoverExpand = isDesktop && !isWideDesktop;
  const isExpanded = isWideDesktop || (allowHoverExpand && hovered);
  const navItems: NavItem[] =
    role === "organizer" || role === "admin"
      ? [
          { href: "/", label: "Home", icon: HouseLine },
          { href: "/search", label: "Explore", icon: Compass },
          { href: "/organizer", label: "My Events", icon: Ticket },
          { href: "/organizer/events/new", label: "Create Event", icon: PlusCircle },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
          { href: "/dashboard/notifications", label: "Notifications", icon: Bell, unread: true },
        ]
      : [
          { href: "/", label: "Home", icon: HouseLine },
          { href: "/search", label: "Explore", icon: Compass },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
          { href: "/dashboard/notifications", label: "Notifications", icon: Bell, unread: true },
        ];

  return (
    <motion.aside
      animate={{ width: isExpanded ? 240 : 72 }}
      className="glass-card fixed left-0 top-0 z-30 hidden h-screen overflow-hidden rounded-none border-r border-l-0 border-t-0 border-b-0 md:flex md:flex-col"
      onMouseEnter={() => {
        if (allowHoverExpand) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (allowHoverExpand) {
          setHovered(false);
        }
      }}
      transition={{ duration: isExpanded ? 0.25 : 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={`flex items-center ${isExpanded ? "gap-3 px-4 py-5" : "justify-center px-0 py-5"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand)]/30 bg-[var(--brand)]/20">
          <span className="font-display text-lg font-bold italic text-[var(--brand)]">G</span>
        </div>

        <AnimatePresence>
          {isExpanded ? (
            <motion.span
              animate={{ opacity: 1, width: "auto", x: 0 }}
              className="font-display whitespace-nowrap text-base italic text-white/90"
              exit={{ opacity: 0, width: 0, x: -8 }}
              initial={{ opacity: 0, width: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              GoOutside
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex h-[52px] items-center rounded-xl ${
                  isExpanded ? "gap-3.5 px-5" : "justify-center"
                } ${
                  active
                    ? "bg-[var(--brand)]/12 text-[var(--brand)]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                }`}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.97 }}
              >
                {active ? (
                  <motion.div
                    className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[var(--brand)]"
                    layoutId="nav-active-bar"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : null}

                <Icon
                  size={active ? 26 : 24}
                  weight="bold"
                  className={active ? "text-[var(--brand)]" : "text-current"}
                />

                <AnimatePresence>
                  {isExpanded ? (
                    <motion.span
                      animate={{ opacity: 1, width: "auto" }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium"
                      exit={{ opacity: 0, width: 0 }}
                      initial={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>

                {item.unread ? (
                  <div
                    className={`absolute h-1.5 w-1.5 rounded-full bg-[var(--brand)] ${
                      isExpanded ? "right-3 top-3" : "right-4 top-3"
                    }`}
                  />
                ) : null}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/5 px-2 py-4">
        <button
          className={`flex h-[52px] w-full items-center rounded-xl text-white/40 transition hover:bg-white/[0.04] hover:text-white/80 ${
            isExpanded ? "gap-3.5 px-5" : "justify-center"
          }`}
          onClick={() => {
            const nextTheme = theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = nextTheme;
            window.localStorage.setItem("gooutside-theme", nextTheme);
            setTheme(nextTheme);
          }}
          type="button"
        >
          {theme === "dark" ? <SunDim size={24} weight="bold" /> : <MoonStars size={24} weight="bold" />}
          <AnimatePresence>
            {isExpanded ? (
              <motion.span
                animate={{ opacity: 1, width: "auto" }}
                className="overflow-hidden whitespace-nowrap text-sm font-medium"
                exit={{ opacity: 0, width: 0 }}
                initial={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>

        <div className={`mt-2 flex h-[52px] items-center rounded-xl ${isExpanded ? "gap-3.5 px-5" : "justify-center"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-black">
            {getInitials(userName)}
          </div>
          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                animate={{ opacity: 1, width: "auto" }}
                className="min-w-0 overflow-hidden"
                exit={{ opacity: 0, width: 0 }}
                initial={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="truncate text-sm font-medium text-white/85">{userName}</p>
                <span className="mt-1 inline-flex rounded-full bg-[var(--brand)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                  Pulse
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
