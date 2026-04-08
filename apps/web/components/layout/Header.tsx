"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ThemeToggle } from "@gooutside/ui";
import SearchBar from "../search/SearchBar";
import { useSearchBarScroll } from "../../hooks/useSearchBarScroll";

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
  const { isCompact, isMini } = useSearchBarScroll();
  const [isFocused, setIsFocused] = useState(false);
  const stableSidebarOffset = 72;

  if (appShell) {
    return (
      <>
        <header className="sticky top-0 z-40 hidden md:flex">
          <div
            className="flex justify-center px-4 md:px-6"
            style={{
              width: `calc(100vw - ${stableSidebarOffset}px)`,
              marginLeft: `${stableSidebarOffset}px`,
            }}
          >
            <div
              className="flex w-full items-center justify-center transition-all duration-300"
              style={{
                height: isFocused ? 110 : isCompact ? 72 : 84,
                paddingTop: isFocused ? 26 : isCompact ? 16 : 18,
                paddingBottom: isFocused ? 20 : isCompact ? 10 : 14,
              }}
            >
              <SearchBar
                isCompact={isCompact}
                isFocused={isFocused}
                isMini={isMini}
                onFocusChange={setIsFocused}
              />
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.88)] px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              GoOutside
            </Link>
            <div className="flex items-center gap-2">
              <Link
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                href="/search"
              >
                <MagnifyingGlass size={18} weight="bold" />
              </Link>
              <ThemeToggle />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black">
                {getInitials(userName)}
              </div>
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black">
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.88)] px-4 py-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            GoOutside
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              href="/search"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </Link>
            <ThemeToggle />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-black">
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
