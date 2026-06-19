"use client";

import Link from "next/link";
import Image from "next/image";
import { NaviiAvatar } from "../profile/NaviiAvatar";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChartBar,
  ChatCircleDots,
  GearSix,
  House,
  MagnifyingGlass,
  MoonStars,
  ShoppingCart,
  SunDim,
  Wallet,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { type ComponentProps, useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppShell } from "./AppShellContext";
import { useCart } from "../cart/CartContext";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";
import { MiniCartDrawer } from "../tickets/MiniCartDrawer";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
  avatarUrl?: string | null;
  username?: string | null;
  email?: string | null;
};

type NavItem = {
  activeWeight?: ComponentProps<typeof House>["weight"];
  href: string;
  icon: typeof House;
  inactiveWeight?: ComponentProps<typeof House>["weight"];
  label: string;
  unread?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "GO";
}

export function Sidebar({ role = "attendee", userName = "", avatarUrl, username }: SidebarProps) {
  const pathname = usePathname();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [hovered, setHovered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const { setSidebarWidth } = useAppShell();
  const { totalCount } = useCart();
  const { reduceMotion } = useAnimationConfig();

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
  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: House },
    { href: "/trending", label: "Explore", icon: MagnifyingGlass },
    { href: "/messages", label: "Messages", icon: ChatCircleDots, unread: true },
    { href: "/wallets", label: "Wallet", icon: Wallet },
    { href: "/notifications", label: "Notifications", icon: Bell, activeWeight: "fill" },
  ];

  if (role === "organizer" || role === "admin") {
    navItems.splice(4, 0, { href: "/organizer", label: "Organizer", icon: ChartBar });
  }

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
      className="fixed left-0 top-0 z-30 hidden h-screen overflow-hidden rounded-none bg-[var(--bg-elevated)] md:flex md:flex-col"
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
          {isExpanded ? (
            <Image
              src="/logo-full.png"
              alt="GoOutside"
              width={120}
              height={34}
              style={{ objectFit: "contain" }}
              priority
            />
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

        <div className="flex min-h-0 flex-1 items-center">
          <nav className="flex w-full flex-col gap-1 px-2">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const iconWeight = active
                ? item.activeWeight ?? "fill"
                : item.inactiveWeight ?? "regular";

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`relative flex h-[52px] items-center rounded-[12px] transition-colors ${
                      isExpanded ? "gap-3.5 px-5" : "justify-center"
                    } ${
                      active
                        ? "font-semibold text-[var(--brand)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                    }`}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Sliding active pill */}
                    {active && !reduceMotion && (
                      <motion.span
                        layoutId="sidebar-pill"
                        className="absolute inset-0 rounded-[12px] bg-[var(--brand-dim)]"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                    {active && reduceMotion && (
                      <span className="absolute inset-0 rounded-[12px] bg-[var(--brand-dim)]" />
                    )}
                    <Icon
                      size={24}
                      weight={iconWeight}
                      className="relative z-10 text-current"
                    />

                    <AnimatePresence>
                      {isExpanded ? (
                        <motion.span
                          animate={{ opacity: 1, width: "auto" }}
                          className="relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium text-current"
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
                        className={`absolute z-10 h-1.5 w-1.5 rounded-full bg-[#22c55e] ${
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
            className={`relative flex h-[52px] w-full items-center rounded-[12px] transition-colors ${
              miniCartOpen
                ? "bg-[var(--brand-dim)] font-semibold text-[var(--brand)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            } ${isExpanded ? "gap-3.5 px-5" : "justify-center"}`}
            onClick={() => setMiniCartOpen((v) => !v)}
            type="button"
          >
            <ShoppingCart
              size={24}
              weight={miniCartOpen ? "fill" : "regular"}
              className={`relative z-10 ${miniCartOpen ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
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
                  Cart
                </motion.span>
              ) : null}
            </AnimatePresence>
            {totalCount > 0 && (
              <div className={`absolute z-30 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--bg-card)] bg-[var(--brand)] px-1 text-[10px] font-bold leading-none text-white shadow-sm ${isExpanded ? "right-2.5 top-1.5" : "right-2 top-1.5"}`}>
                {totalCount > 99 ? "99+" : totalCount}
              </div>
            )}
          </button>

          <MiniCartDrawer open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />

          <button
            className={`flex h-[52px] w-full items-center rounded-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] ${
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
            {theme === "dark" ? <SunDim size={24} weight="regular" /> : <MoonStars size={24} weight="regular" />}
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

          {/* Profile + Settings row */}
          <div className={`mt-2 ${isExpanded ? "flex items-center gap-1" : "flex flex-col gap-0.5"}`}>
            {/* Profile — navigates directly */}
            <Link
              href={username ? `/${username}` : "/dashboard/profile"}
              className={`flex items-center rounded-[12px] transition-colors ${
                pathname === "/dashboard/profile" || (username && pathname === `/${username}`)
                  ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              } ${isExpanded ? "h-[52px] flex-1 gap-3 px-3" : "h-[44px] w-full justify-center"}`}
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--brand)]/40">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userName}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <NaviiAvatar seed={userName} title={userName} size={32} className="h-full w-full object-cover" />
                )}
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
                    <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                      {userName}
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Link>

            {/* Settings — dedicated direct button */}
            <Link
              href="/settings"
              aria-label="Settings"
              className={`flex shrink-0 items-center justify-center rounded-[12px] transition-colors ${
                pathname.startsWith("/settings")
                  ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              } ${isExpanded ? "h-[52px] w-[44px]" : "h-[36px] w-full"}`}
            >
              <GearSix
                size={isExpanded ? 20 : 17}
                weight={pathname.startsWith("/settings") ? "fill" : "regular"}
              />
            </Link>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
