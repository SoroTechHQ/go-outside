"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChartBar,
  ChatCircleDots,
  House,
  MoonStars,
  ShoppingCart,
  SignOut,
  SunDim,
  TrendUp,
  UserCircle,
  Wallet,
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppShell } from "./AppShellContext";
import { useCart } from "../cart/CartContext";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
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
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ role = "attendee", userName = "Kofi Mensah" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [hovered, setHovered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { setSidebarWidth } = useAppShell();
  const { totalCount } = useCart();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { href: "/trending", label: "Trending", icon: TrendUp },
    { href: "/messages", label: "Messages", icon: ChatCircleDots, unread: true },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      activeWeight: "fill",
    },
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
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const iconWeight = active
                ? item.activeWeight ?? "fill"
                : item.inactiveWeight ?? "regular";

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
                      weight={iconWeight}
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
          <Link
            className={`relative flex h-[52px] w-full items-center transition ${
              pathname.startsWith("/cart")
                ? "font-semibold text-[var(--brand)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            } ${isExpanded ? "gap-3.5 px-5" : "justify-center"}`}
            href="/cart"
          >
            <ShoppingCart
              size={24}
              weight={pathname.startsWith("/cart") ? "fill" : "regular"}
              className={pathname.startsWith("/cart") ? "text-[var(--brand)]" : "text-current"}
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
            {/* Cart count badge */}
            {totalCount > 0 && (
              <div className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-black ${isExpanded ? "right-3 top-3" : "right-3.5 top-3"}`}>
                {totalCount > 99 ? "99+" : totalCount}
              </div>
            )}
          </Link>

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

          <div ref={profileRef} className="relative mt-2">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              onContextMenu={(e) => { e.preventDefault(); setProfileMenuOpen(true); }}
              className={`flex h-[56px] w-full items-center transition ${
                pathname.startsWith("/profile")
                  ? "font-semibold text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              } ${isExpanded ? "gap-3.5 px-4" : "justify-center px-0"}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--brand)]">
                {isExpanded ? getInitials(userName) : <UserCircle size={20} weight={pathname.startsWith("/profile") ? "fill" : "regular"} />}
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
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-elevated)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                >
                  <button
                    onClick={() => { setProfileMenuOpen(false); router.push("/dashboard/profile"); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-[var(--text-primary)] transition hover:bg-[var(--bg-card)]"
                  >
                    <UserCircle size={15} className="text-[var(--text-tertiary)]" />
                    View Profile
                  </button>
                  <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                  <button
                    onClick={() => signOut(() => router.push("/"))}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-red-400 transition hover:bg-[var(--bg-card)]"
                  >
                    <SignOut size={15} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
