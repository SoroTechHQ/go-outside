"use client";

import Link from "next/link";
import Image from "next/image";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ThemeToggle } from "@gooutside/ui";
import { usePathname } from "next/navigation";
import HomeSearchHero from "../search/HomeSearchHero";
import { SearchPillExpanded } from "../search/SearchPillExpanded";
import { useSearchBarScroll } from "../../hooks/useSearchBarScroll";
import { useAppShell } from "./AppShellContext";
import { NotificationBell } from "../notifications/NotificationBell";

type HeaderProps = {
  appShell?: boolean;
  userName?: string;
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

export function Header({ appShell = false, userName = "" }: HeaderProps) {
  const pathname = usePathname();
  const { isCompact, isMini, compactProgress, miniProgress } = useSearchBarScroll();
  const { peekPanelWidth } = useAppShell();
  const stableSidebarOffset = 88;
  const isSearch    = pathname === "/search";
  const isMessages  = pathname === "/messages" || pathname === "/dashboard/messages";
  const isWallets   = pathname === "/wallets" || pathname.startsWith("/wallets/") || pathname.startsWith("/dashboard/wallets");
  const isProfile   = pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/dashboard/profile") || pathname.startsWith("/dashboard/user/");
  const isEventDetail = pathname.startsWith("/events/");

  // Public profile pages — single segment paths not matching reserved routes
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
          /* Home: keep original animated hero search widget */
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
          /* Non-home app pages: compact 72px bar — search bar only on desktop */
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

        {/* Mobile header */}
        <header className="sticky top-0 z-40 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <Image src="/logo-mini.png" alt="GoOutside" width={32} height={32} style={{ objectFit: "contain" }} />
            </Link>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ThemeToggle />
              <Link
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black transition active:scale-95"
                href="/profile"
              >
                {getInitials(userName)}
              </Link>
            </div>
          </div>
        </header>
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
              href="/profile"
            >
              {getInitials(userName)}
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
            <ThemeToggle />
            <Link
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black transition active:scale-95"
              href="/profile"
            >
              {getInitials(userName)}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
