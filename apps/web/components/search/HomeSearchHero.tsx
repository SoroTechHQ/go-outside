"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { events } from "@gooutside/demo-data";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AnimatedSearchPlaceholder from "./AnimatedSearchPlaceholder";

type HomeSearchHeroMode = "expanded" | "compact" | "mini" | "mobile";

type HomeSearchHeroProps = {
  mode: HomeSearchHeroMode;
  className?: string;
  compactProgress?: number;
  miniProgress?: number;
};

const WHERE_SUGGESTIONS = [
  "Osu rooftop nights",
  "East Legon brunch this Sunday",
  "Labadi beach after work",
  "Spintex live music tomorrow",
  "Cantonments art shows this weekend",
  "Airport City networking tonight",
];

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function smoothStep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

export function HomeSearchHero({
  mode,
  className = "",
  compactProgress = 0,
  miniProgress = 0,
}: HomeSearchHeroProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [where, setWhere] = useState(searchParams.get("q") ?? "");
  const [when, setWhen] = useState(searchParams.get("when") ?? "");
  const [isWhereFocused, setIsWhereFocused] = useState(false);

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

  const totalProgress = smoothStep(Math.min(1, compactProgress * 0.6 + miniProgress * 0.4));
  const surpriseFade = Math.max(0, 1 - miniProgress * 1.35);
  const dynamicMaxWidth = isMobile
    ? "100%"
    : `${Math.round(lerp(1020, 648, totalProgress))}px`;
  const dynamicMinHeight = `${Math.round(lerp(isExpanded ? 78 : 68, 56, totalProgress))}px`;
  const dynamicVerticalPadding = `${lerp(isExpanded ? 18 : 15, 10, totalProgress)}px`;
  const dynamicHorizontalPadding = `${lerp(isExpanded ? 36 : 30, 22, totalProgress)}px`;
  const dynamicButtonSize = `${Math.round(lerp(isExpanded ? 58 : 50, 42, totalProgress))}px`;
  const dynamicSearchSize = `${lerp(isMini ? 14 : 16, 14, totalProgress)}px`;
  const dynamicDividerHeight = `${Math.round(lerp(38, 30, totalProgress))}px`;
  const searchText = isMini ? "text-sm" : "text-base";

  return (
    <div className={`w-full ${className}`.trim()}>
      <div
        className="mx-auto w-full rounded-[999px] border transition-[max-width,box-shadow,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          maxWidth: dynamicMaxWidth,
          backgroundColor: "var(--bg-card)",
          borderColor: `rgba(15,17,15, ${lerp(0.08, 0.12, totalProgress)})`,
          boxShadow: `0 ${Math.round(lerp(12, 10, totalProgress))}px ${Math.round(lerp(28, 24, totalProgress))}px rgba(15,17,15,${lerp(0.06, 0.09, totalProgress)})`,
        }}
      >
        <div
          className={`flex transition-[min-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMobile ? "flex-col" : "items-center"}`}
          style={{ minHeight: dynamicMinHeight }}
        >
          <label
            className={`min-w-0 flex-1 transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMobile ? "border-b border-[var(--border-subtle)] px-5 py-4" : "rounded-l-[999px] hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"}`}
            style={
              isMobile
                ? undefined
                : {
                    padding: `${dynamicVerticalPadding} ${dynamicHorizontalPadding}`,
                  }
            }
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">Where</span>
            <div className="relative mt-1">
              <input
                className={`w-full bg-transparent text-[var(--text-secondary)] outline-none caret-[var(--brand)] placeholder:text-transparent ${searchText}`}
                onBlur={() => setIsWhereFocused(false)}
                onChange={(event) => setWhere(event.target.value)}
                onFocus={() => setIsWhereFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch();
                  }
                }}
                placeholder=""
                type="text"
                value={where}
              />
              {!where && !isWhereFocused ? (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <AnimatedSearchPlaceholder
                    className={searchText}
                    isVisible={!where && !isWhereFocused}
                    suggestions={WHERE_SUGGESTIONS}
                  />
                </div>
              ) : null}
            </div>
          </label>

          <div
            className={`${isMobile ? "hidden" : "w-px"} bg-[var(--border-subtle)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            style={isMobile ? undefined : { height: dynamicDividerHeight }}
          />

          <label
            className={`min-w-0 flex-1 transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMobile ? "border-b border-[var(--border-subtle)] px-5 py-4" : "rounded-r-[999px] hover:bg-[var(--brand-dim)] focus-within:bg-[var(--brand-dim)]"}`}
            style={
              isMobile
                ? undefined
                : {
                    padding: `${dynamicVerticalPadding} ${dynamicHorizontalPadding}`,
                  }
            }
          >
            <span className="block text-[0.92rem] font-semibold text-[var(--text-primary)]">When</span>
            <input
              className={`mt-1 w-full bg-transparent text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] ${searchText}`}
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

          <div
            className={`flex items-center transition-[gap,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMobile ? "gap-3 px-4 py-4" : "gap-3 pr-3"}`}
          >
            {!isMobile ? (
              <div
                className="overflow-hidden transition-[max-width,opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  maxWidth: `${Math.round(lerp(152, 0, 1 - surpriseFade))}px`,
                  opacity: surpriseFade,
                  transform: `scale(${lerp(1, 0.9, 1 - surpriseFade)})`,
                }}
              >
                <button
                  className="inline-flex min-w-max items-center gap-2 rounded-full border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-2 text-sm font-medium text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-dim)]"
                  onClick={handleSurpriseMe}
                  type="button"
                >
                  <Sparkle size={14} weight="fill" />
                  Surprise me
                </button>
              </div>
            ) : null}

            <button
              aria-label="Search events"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] text-white transition-[height,width,background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--brand-hover)] active:scale-[0.96] active:bg-[#1f5f2d]"
              style={{ height: dynamicButtonSize, width: dynamicButtonSize }}
              onClick={applySearch}
              type="button"
            >
              <MagnifyingGlass size={Number.parseFloat(dynamicSearchSize)} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSearchHero;
