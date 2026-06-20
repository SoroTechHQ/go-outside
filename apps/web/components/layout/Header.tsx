"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  List,
  X,
  Bell,
  Gear,
  ShoppingCart,
  CaretRight,
  UserCircle,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@gooutside/ui";
import { usePathname, useRouter } from "next/navigation";
import HomeSearchHero from "../search/HomeSearchHero";
import { SearchPillExpanded } from "../search/SearchPillExpanded";
import { useSearchBarScroll } from "../../hooks/useSearchBarScroll";
import { useAppShell } from "./AppShellContext";
import { NotificationBell } from "../notifications/NotificationBell";
import { MiniCartDrawer } from "../tickets/MiniCartDrawer";
import { useCart } from "../cart/CartContext";

type HeaderProps = {
  appShell?: boolean;
  userName?: string;
  avatarUrl?: string | null;
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

// ── Mobile hamburger menu (portal) ────────────────────────────────────────────

function MobileMenu({
  open,
  onClose,
  userName,
  avatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();

  function go(href: string) {
    onClose();
    router.push(href);
  }

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 z-[601] flex h-full w-[280px] flex-col bg-[var(--bg-page)] shadow-[-16px_0_48px_rgba(0,0,0,0.28)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.85 }}
          >
            {/* Close button */}
            <div className="flex items-center justify-end px-4 pt-4 pb-2">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)] active:scale-95"
                onClick={onClose}
                type="button"
                aria-label="Close menu"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Profile section */}
            <button
              className="mx-3 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 text-left transition hover:bg-[var(--bg-card-alt)] active:scale-[0.98]"
              onClick={() => go("/dashboard/profile")}
              type="button"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {getInitials(userName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                  {userName || "Your profile"}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">View profile</p>
              </div>
              <CaretRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
            </button>

            {/* Divider */}
            <div className="mx-3 my-3 h-px bg-[var(--border-subtle)]" />

            {/* Menu items */}
            <div className="flex flex-col gap-0.5 px-3">
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--bg-card)] active:scale-[0.98]"
                onClick={() => go("/dashboard/notifications")}
                type="button"
              >
                <Bell size={18} className="text-[var(--text-secondary)]" weight="regular" />
                <span className="text-[14px] font-medium text-[var(--text-primary)]">Notifications</span>
              </button>

              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--bg-card)] active:scale-[0.98]"
                onClick={() => go("/settings")}
                type="button"
              >
                <Gear size={18} className="text-[var(--text-secondary)]" weight="regular" />
                <span className="text-[14px] font-medium text-[var(--text-primary)]">Settings</span>
              </button>
            </div>

            {/* Dark mode toggle at bottom */}
            <div className="mx-3 mt-auto mb-8 flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Appearance</span>
              <ThemeToggle />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

// ── Mobile cart button (shows count badge) ────────────────────────────────────

function MobileCartButton() {
  const { totalCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] active:scale-95"
        onClick={() => setOpen(true)}
        type="button"
        aria-label="Open cart"
      >
        <ShoppingCart size={17} weight="regular" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand)] px-0.5 text-[9px] font-bold text-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>
      <MiniCartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

export function Header({ appShell = false, userName = "", avatarUrl }: HeaderProps) {
  const pathname = usePathname();
  const { isCompact, isMini, compactProgress, miniProgress } = useSearchBarScroll();
  const { peekPanelWidth } = useAppShell();
  const stableSidebarOffset = 88;
  const [hamOpen, setHamOpen] = useState(false);

  const isSearch      = pathname === "/search";
  const isMessages    = pathname === "/messages" || pathname === "/dashboard/messages";
  const isWallets     = pathname === "/wallets" || pathname.startsWith("/wallets/") || pathname.startsWith("/dashboard/wallets");
  const isProfile     = pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/dashboard/profile") || pathname.startsWith("/dashboard/user/");
  const isEventDetail = pathname.startsWith("/events/");

  const RESERVED = new Set([
    "home","search","explore","events","e","go","organizer","organizers","dashboard",
    "api","admin","settings","login","signup","sign-in","sign-up","onboarding","about",
    "help","support","terms","privacy","blog","careers","press","waitlist","ad-waitlist",
    "categories","trending","notifications","saved","rewards","checkout","messages",
    "wallets","people","sign_in","sign_up",
  ]);
  const segments = pathname.split("/").filter(Boolean);
  const isPublicProfile = segments.length === 1 && !RESERVED.has(segments[0]!);

  const totalHomeProgress = Math.min(1, compactProgress * 0.58 + miniProgress * 0.42);
  const easedHomeProgress =
    totalHomeProgress * totalHomeProgress * (3 - 2 * totalHomeProgress);

  if (isMessages || isWallets || isProfile || isEventDetail || isPublicProfile) return null;

  const isHome = pathname === "/home" || pathname === "/";

  if (appShell) {
    return (
      <>
        {/* Desktop header */}
        {isHome ? (
          <header className="sticky top-0 z-40 hidden md:flex pointer-events-none">
            <div
              className="pointer-events-auto flex justify-center px-4 md:px-6"
              style={{
                width: `calc(100vw - ${stableSidebarOffset}px - ${peekPanelWidth}px)`,
                marginLeft: `${stableSidebarOffset}px`,
                transition: "width 0.3s ease-in-out",
              }}
            >
              <div
                className="flex w-full items-start justify-center transition-[height,padding,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  height: `${112 - easedHomeProgress * 4}px`,
                  paddingTop: `${22 - easedHomeProgress * 8}px`,
                  paddingBottom: `${6 - easedHomeProgress * 2}px`,
                  transform: `translateY(${8 - easedHomeProgress * 4}px)`,
                }}
              >
                <HomeSearchHero
                  compactProgress={compactProgress}
                  miniProgress={miniProgress}
                  mode={isMini ? "mini" : isCompact ? "compact" : "expanded"}
                />
              </div>
            </div>
          </header>
        ) : (
          <header
            className="sticky top-0 z-40 hidden md:flex items-center"
            style={{
              width: `calc(100vw - ${stableSidebarOffset}px - ${peekPanelWidth}px)`,
              marginLeft: `${stableSidebarOffset}px`,
              height: 72,
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div className="flex w-full items-center gap-4 px-6">
              {!isSearch ? (
                <div className="flex-1 max-w-2xl mx-auto">
                  <SearchPillExpanded compact />
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </header>
        )}

        {/* Mobile header — logo | [cart, hamburger] */}
        <header className="sticky top-0 z-40 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <Image src="/logo-mini.png" alt="GoOutside" width={32} height={32} style={{ objectFit: "contain" }} />
            </Link>
            <div className="flex items-center gap-1.5">
              <MobileCartButton />
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] active:scale-95"
                onClick={() => setHamOpen(true)}
                type="button"
                aria-label="Open menu"
              >
                <List size={18} weight="bold" />
              </button>
            </div>
          </div>
        </header>

        <MobileMenu
          open={hamOpen}
          onClose={() => setHamOpen(false)}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 hidden md:flex">
        <div className="container-shell flex w-full items-center justify-between gap-6 py-4">
          <Link href="/">
            <Image src="/logo-full.png" alt="GoOutside" width={120} height={34} style={{ objectFit: "contain" }} />
          </Link>
          {!isSearch && (
            <div className="flex-1 max-w-2xl">
              <SearchPillExpanded compact={isCompact} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black transition hover:opacity-90"
              href="/dashboard/profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full rounded-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </Link>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/">
            <Image src="/logo-mini.png" alt="GoOutside" width={32} height={32} style={{ objectFit: "contain" }} />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition active:scale-95 hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              href="/search"
            >
              <MagnifyingGlass size={17} weight="bold" />
            </Link>
            <MobileCartButton />
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition active:scale-95 hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              onClick={() => setHamOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <List size={18} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={hamOpen}
        onClose={() => setHamOpen(false)}
        userName={userName}
        avatarUrl={avatarUrl}
      />
    </>
  );
}

export default Header;
