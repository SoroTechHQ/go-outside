"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { events } from "@gooutside/demo-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type HomeSearchHeroMode = "expanded" | "compact" | "mini" | "mobile";

type HomeSearchHeroProps = {
  mode: HomeSearchHeroMode;
  className?: string;
};

export function HomeSearchHero({ mode, className = "" }: HomeSearchHeroProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [where, setWhere] = useState(searchParams.get("q") ?? "");
  const [when, setWhen] = useState(searchParams.get("when") ?? "");

  useEffect(() => {
    setWhere(searchParams.get("q") ?? "");
    setWhen(searchParams.get("when") ?? "");
  }, [searchParams]);

  const isExpanded = mode === "expanded" || mode === "mobile";
  const isMini = mode === "mini";
  const isMobile = mode === "mobile";

  const applySearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (where.trim()) {
      params.set("q", where.trim());
    } else {
      params.delete("q");
    }

    if (when.trim()) {
      params.set("when", when.trim());
    } else {
      params.delete("when");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const handleSurpriseMe = () => {
    const choice = events[Math.floor(Math.random() * events.length)];
    if (!choice) {
      return;
    }

    router.push(`/events/${choice.slug}`);
  };

  const shellRadius = isMini ? "rounded-[30px]" : "rounded-[999px]";

  return (
    <div className={`w-full ${className}`.trim()}>
      <div className={`mx-auto w-full max-w-[980px] ${shellRadius} border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.98)] shadow-[0_10px_34px_rgba(15,17,15,0.08)]`}>
        <div className={`flex ${isMobile ? "flex-col" : "items-center"} min-h-[74px]`}>
          <label
            className={`min-w-0 flex-1 transition ${isMobile ? "border-b border-[var(--border-subtle)] px-5 py-4" : "rounded-l-[999px] px-8 py-4 hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"}`}
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">Where</span>
            <input
              className={`mt-1 w-full bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] ${isExpanded ? "text-base" : "text-sm"}`}
              onChange={(event) => setWhere(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder="Search destinations"
              type="text"
              value={where}
            />
          </label>

          <div className={`${isMobile ? "hidden" : "h-10 w-px"} bg-[var(--border-subtle)]`} />

          <label
            className={`min-w-0 flex-1 transition ${isMobile ? "border-b border-[var(--border-subtle)] px-5 py-4" : "rounded-r-[999px] px-8 py-4 hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"}`}
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">When</span>
            <input
              className={`mt-1 w-full bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] ${isExpanded ? "text-base" : "text-sm"}`}
              onChange={(event) => setWhen(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder="Add dates"
              type="text"
              value={when}
            />
          </label>

          <div className={`flex items-center gap-3 ${isMobile ? "px-4 py-4" : "pr-3"}`}>
            {!isMini ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-2 text-sm font-medium text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-dim)]"
                onClick={handleSurpriseMe}
                type="button"
              >
                <Sparkle size={14} weight="fill" />
                Surprise me
              </button>
            ) : null}

            <button
              aria-label="Search events"
              className={`inline-flex items-center justify-center rounded-full bg-[var(--text-primary)] text-white transition hover:bg-[var(--brand-hover)] ${isMini ? "h-11 w-11" : "h-14 w-14"}`}
              onClick={applySearch}
              type="button"
            >
              <MagnifyingGlass size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSearchHero;
