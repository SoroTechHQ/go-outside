"use client";

import { useEffect, useState } from "react";
import { cn } from "@gooutside/ui";

const storageKey = "gooutside-theme";

type ThemeMode = "light" | "dark";

function resolveTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function persistTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new CustomEvent("gooutside-theme-change", { detail: theme }));
}

function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const syncTheme = () => setTheme(resolveTheme());

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("gooutside-theme-change", syncTheme as EventListener);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("gooutside-theme-change", syncTheme as EventListener);
    };
  }, []);

  const toggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    persistTheme(nextTheme);
    setTheme(nextTheme);
  };

  return { theme, isDark: theme === "dark", toggle };
}

function ThemeGlyph({ isDark }: { isDark: boolean }) {
  return isDark ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3c-.1.49-.15.99-.15 1.5A7.5 7.5 0 0 0 18.5 12c.51 0 1.01-.05 1.5-.15Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M4.75 12h-2.5M21.75 12h-2.5M5.93 5.93l1.77 1.77M18.3 18.3l-1.77-1.77M18.07 5.93 16.3 7.7M7.7 16.3l-1.77 1.77"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ThemeIconButton({ className }: { className?: string }) {
  const { isDark, toggle } = useThemeMode();

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition hover:border-[var(--border-card)] hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)]",
        className,
      )}
      onClick={toggle}
      type="button"
    >
      <ThemeGlyph isDark={isDark} />
    </button>
  );
}

export function ThemeToggleSwitch({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { isDark, toggle } = useThemeMode();

  return (
    <button
      aria-label={isDark ? "Enable light mode" : "Enable dark mode"}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-2 text-left transition hover:border-[var(--border-card)] hover:bg-[var(--bg-card-alt)]",
        compact ? "pr-2" : "w-full pr-4",
        className,
      )}
      onClick={toggle}
      type="button"
    >
      <span
        className={cn(
          "relative flex h-7 w-12 shrink-0 rounded-full border transition",
          isDark
            ? "border-[rgba(74,222,128,0.24)] bg-[rgba(74,222,128,0.16)]"
            : "border-[rgba(251,146,60,0.24)] bg-[rgba(251,146,60,0.14)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_6px_16px_rgba(15,23,42,0.16)] transition-all",
            isDark ? "left-[22px]" : "left-0.5",
          )}
        >
          <ThemeGlyph isDark={isDark} />
        </span>
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Theme
          </span>
          <span className="block text-sm font-medium text-[var(--text-primary)]">
            {isDark ? "Dark mode active" : "Light mode active"}
          </span>
        </span>
      )}
    </button>
  );
}
