"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { ThemeToggle } from "@gooutside/ui";
import { usePathname } from "next/navigation";
import HomeSearchHero from "../search/HomeSearchHero";
import SearchBar from "../search/SearchBar";
import { useSearchBarScroll } from "../../hooks/useSearchBarScroll";
import { useAppShell } from "./AppShellContext";
import { NotificationBell } from "../notifications/NotificationBell";
import { useCart } from "../cart/CartContext";

type HeaderProps = {
  appShell?: boolean;
  userName?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({ appShell = false, userName = "Kofi Mensah" }: HeaderProps) {
  const pathname = usePathname();
  const { isCompact, isMini, compactProgress, miniProgress } = useSearchBarScroll();
  const { peekPanelWidth } = useAppShell();
  const [isFocused, setIsFocused] = useState(false);
  const { totalCount, openCart } = useCart();
  const stableSidebarOffset = 88;
  const isHome     = pathname === "/";
  const isMessages = pathname === "/messages" || pathname === "/dashboard/messages";
  const isWallets  = pathname === "/wallets" || pathname.startsWith("/wallets/") || pathname.startsWith("/dashboard/wallets");
  const isProfile  = pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/dashboard/profile");
  const isEventDetail = pathname.startsWith("/events/");
  const totalHomeProgress = Math.min(1, compactProgress * 0.58 + miniProgress * 0.42);
  const easedHomeProgress =
    totalHomeProgress * totalHomeProgress * (3 - 2 * totalHomeProgress);
  if (isMessages || isWallets || isProfile || isEventDetail) return null;

  if (appShell) {
    return (
      <>
        <header className="sticky top-0 z-40 hidden md:flex pointer-events-none">
          {isHome ? (
            <div
              className="pointer-events-none absolute top-0 px-4 md:px-6"
              style={{
                width: `calc(100vw - ${stableSidebarOffset}px - ${peekPanelWidth}px)`,
                marginLeft: `${stableSidebarOffset}px`,
                transition: "width 0.3s ease-in-out",
              }}
            >
              <div className="mx-auto w-full max-w-[1120px]">
                <div
                  className="relative mx-auto overflow-hidden rounded-b-[36px]"
                  style={{
                    width: `${1020 - easedHomeProgress * 188}px`,
                    minWidth: "648px",
                    height: `${154 - easedHomeProgress * 14}px`,
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0"
                    style={{
                      height: `${176 - easedHomeProgress * 30}px`,
                      background: `linear-gradient(180deg,
                        rgba(var(--brand-rgb),${0.16 + easedHomeProgress * 0.08}),
                        rgba(var(--brand-rgb),${0.05 + easedHomeProgress * 0.06}) 38%,
                        rgba(255,255,255,0) 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-x-0 top-0"
                    style={{
                      height: `${128 + easedHomeProgress * 26}px`,
                      opacity: 0.46 + easedHomeProgress * 0.34,
                      background: `linear-gradient(180deg,
                        rgba(var(--bg-card-rgb),0.99) 0%,
                        rgba(var(--bg-card-rgb),0.96) 46%,
                        rgba(var(--bg-card-rgb),${0.56 - easedHomeProgress * 0.1}) 78%,
                        rgba(var(--bg-card-rgb),0) 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <div
            className="pointer-events-auto flex justify-center px-4 md:px-6"
            style={{
              width: `calc(100vw - ${stableSidebarOffset}px - ${peekPanelWidth}px)`,
              marginLeft: `${stableSidebarOffset}px`,
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div
              className={`flex w-full justify-center transition-[height,padding,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHome ? "items-start" : "items-center"}`}
              style={{
                height: isHome ? `${160 - easedHomeProgress * 52}px` : isFocused ? 110 : isCompact ? 72 : 84,
                paddingTop: isHome ? `${28 - easedHomeProgress * 11}px` : isFocused ? 26 : isCompact ? 16 : 18,
                paddingBottom: isHome ? `${22 - easedHomeProgress * 10}px` : isFocused ? 20 : isCompact ? 10 : 14,
                transform: isHome ? `translateY(${8 - easedHomeProgress * 4}px)` : undefined,
              }}
            >
              {isHome ? (
                <HomeSearchHero
                  compactProgress={compactProgress}
                  miniProgress={miniProgress}
                  mode={isMini ? "mini" : isCompact ? "compact" : "expanded"}
                />
              ) : (
                <SearchBar
                  isCompact={isCompact}
                  isFocused={isFocused}
                  isMini={isMini}
                  onFocusChange={setIsFocused}
                />
              )}
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              GoOutside
            </Link>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              {totalCount > 0 && (
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition active:scale-95"
                  onClick={openCart}
                  type="button"
                >
                  <ShoppingCart size={17} weight="bold" />
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">
                    {totalCount}
                  </span>
                </button>
              )}
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
      <header className="sticky top-0 z-40 hidden border-b border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.82)] backdrop-blur-xl md:flex">
        <div className="container-shell flex w-full items-center justify-between gap-6 py-4">
          <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            GoOutside
          </Link>
          <div className="flex-1">
            <SearchBar
              isCompact={false}
              isFocused={isFocused}
              isMini={false}
              onFocusChange={setIsFocused}
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {totalCount > 0 && (
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)]"
                onClick={openCart}
                type="button"
              >
                <ShoppingCart size={17} weight="bold" />
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">
                  {totalCount}
                </span>
              </button>
            )}
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

      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            GoOutside
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
