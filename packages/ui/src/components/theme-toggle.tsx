"use client";

import { useEffect, useState } from "react";
import { MoonStars, SunDim } from "@phosphor-icons/react";
import { cn } from "../lib/cn";

const storageKey = "gooutside-theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
      return;
    }
    applyTheme("dark");
  }, []);

  const toggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.88)] text-[var(--text-primary)] transition hover:border-[var(--border)] hover:bg-[var(--bg-card-hover)]",
        className,
      )}
      onClick={toggle}
      type="button"
    >
      {theme === "dark" ? (
        <SunDim size={size} weight="regular" />
      ) : (
        <MoonStars size={size} weight="regular" />
      )}
    </button>
  );
}
