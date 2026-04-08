"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlass,
  SignOut,
  SlidersHorizontal,
  Ticket,
  UserCircle,
  BookmarkSimple,
  CalendarBlank,
  ChartLineUp,
  ShieldStar,
  X,
} from "@phosphor-icons/react";
import { demoData } from "@gooutside/demo-data";
import { ThemeToggle } from "@gooutside/ui";

type HeaderRole = "attendee" | "organizer" | "admin";

type HeaderProps = {
  cityLabel?: string;
  floating?: boolean;
  role?: HeaderRole;
  userName?: string;
};

type MenuItem = {
  href: string;
  label: string;
  icon: typeof UserCircle;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({
  cityLabel = "Accra",
  floating = false,
  role = "attendee",
  userName = demoData.attendee.name,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const menuItems = useMemo<MenuItem[]>(() => {
    const baseItems: MenuItem[] = [
      { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
      { href: "/dashboard/tickets", label: "My Tickets", icon: Ticket },
      { href: "/dashboard/saved", label: "Saved Events", icon: BookmarkSimple },
    ];

    if (role === "organizer" || role === "admin") {
      baseItems.push(
        { href: "/organizer", label: "My Events", icon: CalendarBlank },
        { href: "/organizer/events/new", label: "Create Event", icon: ChartLineUp },
      );
    }

    if (role === "admin") {
      baseItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldStar });
    }

    return baseItems;
  }, [role]);

  const applySearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextValue = value.trim();

    if (nextValue) {
      params.set("q", nextValue);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.push(nextUrl, { scroll: false });
    });
  };

  const chromeClassName =
    floating && !scrolled
      ? "border-transparent bg-transparent"
      : "border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.95)] backdrop-blur-md";

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-[72px] border-b transition duration-200 ${chromeClassName}`}
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="font-display text-[1.7rem] italic text-[var(--text-primary)]">
              GoOutside
            </Link>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="flex h-11 w-full max-w-[560px] items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-4 transition focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_rgba(58,140,48,0.12)]">
              <MagnifyingGlass size={16} className="text-[var(--text-tertiary)]" />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                onBlur={(event) => applySearch(event.target.value)}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch(searchValue);
                  }
                }}
                placeholder={`Search events, venues, organizers in ${cityLabel}`}
                value={searchValue}
              />
              {searchValue ? (
                <button
                  aria-label="Clear search"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)]"
                  onClick={() => {
                    setSearchValue("");
                    applySearch("");
                  }}
                  type="button"
                >
                  <X size={14} />
                </button>
              ) : null}
              <button
                aria-label="Open filters"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)]"
                onClick={() => setMobileSearchOpen(true)}
                type="button"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Open search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.88)] text-[var(--text-primary)] transition hover:border-[var(--border)] hover:bg-[var(--bg-card-hover)] md:hidden"
              onClick={() => setMobileSearchOpen(true)}
              type="button"
            >
              <MagnifyingGlass size={18} weight="regular" />
            </button>
            <ThemeToggle />

            <div className="relative" ref={dropdownRef}>
              <button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white shadow-[0_10px_24px_rgba(var(--brand-rgb),0.22)]"
                onClick={() => setMenuOpen((value) => !value)}
                type="button"
              >
                {getInitials(userName)}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 shadow-[0_20px_50px_rgba(11,17,12,0.18)]">
                  <div className="border-b border-[var(--border-subtle)] px-3 py-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      {role}
                    </p>
                  </div>
                  <div className="py-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Icon size={18} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-2">
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                      type="button"
                    >
                      <SignOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {mobileSearchOpen ? (
        <div className="fixed inset-0 z-[60] bg-[color:rgba(var(--bg-card-rgb),0.98)] p-4 md:hidden">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 pt-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl italic text-[var(--text-primary)]">Search the city</p>
              <button
                aria-label="Close search"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                onClick={() => setMobileSearchOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-4">
              <MagnifyingGlass size={18} className="text-[var(--text-tertiary)]" />
              <input
                autoFocus
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch(searchValue);
                    setMobileSearchOpen(false);
                  }
                }}
                placeholder={`Search events in ${cityLabel}`}
                value={searchValue}
              />
            </div>

            <div className="grid gap-3">
              {["Tonight in Accra", "Rooftops", "Live music", "Food tastings"].map((hint) => (
                <button
                  key={hint}
                  className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-4 text-left text-sm font-medium text-[var(--text-secondary)]"
                  onClick={() => {
                    setSearchValue(hint);
                    applySearch(hint);
                    setMobileSearchOpen(false);
                  }}
                  type="button"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Header;
