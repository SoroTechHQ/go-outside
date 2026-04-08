"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ThemeToggle } from "@gooutside/ui";
import SearchBar from "../search/SearchBar";
import { useSearchBarScroll } from "../../hooks/useSearchBarScroll";
import { useAppShell } from "./AppShellContext";

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
  const { sidebarWidth } = useAppShell();
  const shellLeft = "max(1rem, calc((100vw - 1280px) / 2))";
  const shellWidth = "min(calc(100vw - 2rem), 1280px)";

  if (appShell) {
    return (
      <>
        <header className="sticky top-0 z-40 hidden md:flex">
          <div
            className="px-4 md:px-6"
            style={{
              width: `calc(${shellWidth} - ${sidebarWidth}px)`,
              marginLeft: `calc(${shellLeft} + ${sidebarWidth}px)`,
            }}
          >
            <div
              className="flex items-center justify-center transition-all duration-300"
              style={{
                height: isFocused ? 104 : isCompact ? 56 : 72,
                paddingTop: isFocused ? 24 : 12,
                paddingBottom: isFocused ? 20 : 12,
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

        <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(10,15,10,0.82)] px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-white/90">
              GoOutside
            </Link>
            <div className="flex items-center gap-2">
              <Link
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white/70"
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
      <header className="sticky top-0 z-40 hidden border-b border-white/5 bg-[rgba(10,15,10,0.78)] md:flex">
        <div className="container-shell flex w-full items-center justify-between gap-6 py-4">
          <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-white/90">
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

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(10,15,10,0.82)] px-4 py-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-[1.2rem] font-semibold tracking-[-0.02em] text-white/90">
            GoOutside
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white/70"
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
