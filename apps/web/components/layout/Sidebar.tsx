"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatCircleDots,
  House,
  MoonStars,
  SunDim,
  TrendUp,
  UserCircle,
  Wallet,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppShell } from "./AppShellContext";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
};

type NavItem = {
  href: string;
  icon: typeof House;
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
  const [hovered, setHovered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { setSidebarWidth } = useAppShell();

  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = document.documentElement.dataset.theme;
      setTheme(currentTheme === "light" ? "light" : "dark");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const isExpanded = isDesktop && hovered;
  const navItems: NavItem[] =
    role === "organizer" || role === "admin"
      ? [
          { href: "/", label: "Home", icon: House },
          { href: "/dashboard/notifications", label: "Messages", icon: ChatCircleDots, unread: true },
          { href: "/dashboard/tickets", label: "Wallets", icon: Wallet },
          { href: "/dashboard/saved", label: "Activity", icon: TrendUp },
        ]
      : [
          { href: "/", label: "Home", icon: House },
          { href: "/dashboard/notifications", label: "Messages", icon: ChatCircleDots, unread: true },
          { href: "/dashboard/tickets", label: "Wallets", icon: Wallet },
          { href: "/dashboard/saved", label: "Activity", icon: TrendUp },
        ];

  useEffect(() => {
    if (!isTabletUp) {
      setSidebarWidth(0);
      return;
    }

    setSidebarWidth(isExpanded ? 240 : 72);
  }, [isExpanded, isTabletUp, setSidebarWidth]);

  if (!isTabletUp) {
    return null;
  }

  return (
    <motion.aside
      animate={{ width: isExpanded ? 240 : 72 }}
      className="fixed left-0 top-0 z-30 hidden h-screen overflow-hidden rounded-none border-r border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%),var(--bg-elevated)] backdrop-blur-xl md:flex md:flex-col"
      onMouseEnter={() => {
        if (isDesktop) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => setHovered(false)}
      transition={{ duration: isExpanded ? 0.25 : 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex h-full flex-col py-4">
        <div className={`flex items-center ${isExpanded ? "gap-3 px-4 py-5" : "justify-center px-0 py-5"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--brand)]/30 bg-[var(--brand)]/20">
            <span className="text-lg font-bold text-[var(--brand)]">G</span>
          </div>

          <AnimatePresence>
            {isExpanded ? (
              <motion.span
                animate={{ opacity: 1, width: "auto", x: 0 }}
                className="whitespace-nowrap text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
                exit={{ opacity: 0, width: 0, x: -8 }}
                initial={{ opacity: 0, width: 0, x: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                GoOutside
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex min-h-0 flex-1 items-center">
          <nav className="flex w-full flex-col gap-1 px-2">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`relative flex h-[52px] items-center ${
                      isExpanded ? "gap-3.5 px-5" : "justify-center"
                    } ${
                      active
                        ? "font-semibold text-[var(--brand)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon
                      size={24}
                      weight={active ? "fill" : "regular"}
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
                        className={`absolute h-1.5 w-1.5 rounded-full bg-[#22c55e] ${
                          isExpanded ? "right-3 top-3" : "right-4 top-3"
                        }`}
                      />
                    ) : null}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-2 pt-4">
          <button
            className={`flex h-[52px] w-full items-center text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${
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

          <Link
            className={`mt-2 flex h-[56px] items-center transition ${
              pathname.startsWith("/dashboard/profile")
                ? "font-semibold text-[var(--brand)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            } ${isExpanded ? "gap-3.5 px-4" : "justify-center px-0"}`}
            href="/dashboard/profile"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--brand)]">
              {isExpanded ? getInitials(userName) : <UserCircle size={20} weight={pathname.startsWith("/dashboard/profile") ? "fill" : "regular"} />}
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
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Profile</p>
                  <span className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                    {userName}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Link>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
