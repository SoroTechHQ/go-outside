"use client";

import { useRef, useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeIconButton, ThemeToggleSwitch } from "./theme-controls";

export function AppHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { isExpanded, isHovered, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 px-5 py-3 backdrop-blur">
      {/* Left: toggle + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          aria-label="Toggle sidebar"
        >
          {isMobileOpen ? (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </button>
        <div>
          <h1 className="font-display text-xl italic text-[var(--text-primary)]">{title}</h1>
          <p className="hidden text-xs text-[var(--text-tertiary)] sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative hidden lg:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search… ⌘K"
            className="h-9 w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--neon)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--neon)]/10"
          />
        </div>

        <div className="hidden xl:flex">
          <ThemeToggleSwitch compact />
        </div>

        <ThemeIconButton />

        {/* Notification bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--neon)]" />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--neon)] text-[11px] font-bold text-[#0e1410]">
          AD
        </div>
      </div>
    </header>
  );
}
