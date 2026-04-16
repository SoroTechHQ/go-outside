"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ONBOARDING_STEPS, STEP_ROUTES } from "../../lib/onboarding-utils";
import { ArrowLeft } from "@phosphor-icons/react";

const TOTAL_STEPS = 5;

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const step     = ONBOARDING_STEPS[pathname] ?? 1;
  const prevRoute = step > 1 ? STEP_ROUTES[step - 1] : null;

  return (
    /*
     * Always dark — force dark context regardless of system theme.
     * On desktop: full-screen backdrop + centered modal card.
     * On mobile:  full-screen, no card chrome.
     */
    <div
      className="relative flex min-h-svh flex-col items-center justify-center bg-[#020702]"
      style={{ colorScheme: "dark" }}
    >
      {/* ── Full-screen blurred background image ──────────────────────── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1400&q=60"
          alt=""
          fill
          className="object-cover opacity-30"
          style={{ filter: "blur(6px) saturate(0.6)" }}
          priority
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-[#020702]/70" />
      </div>

      {/* ── Top bar (outside card) ─────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
        {/* Back button — hidden on step 1 */}
        {prevRoute ? (
          <button
            onClick={() => router.push(prevRoute)}
            className="flex items-center gap-1.5 text-[#4A6A4A] transition hover:text-[#5FBF2A]"
          >
            <ArrowLeft size={14} />
            <span className="text-[12px] font-medium">Back</span>
          </button>
        ) : (
          <span
            className="text-[15px] italic text-[#5FBF2A]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            GoOutside
          </span>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A6A4A]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      {/* ── Progress dots (centered, above card) ──────────────────────── */}
      <div className="fixed left-1/2 top-0 z-30 flex -translate-x-1/2 items-center gap-1.5 pt-5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const s           = i + 1;
          const isActive    = s === step;
          const isCompleted = s < step;
          return (
            <div
              key={s}
              style={{
                width:        isActive ? "20px" : "6px",
                height:       "6px",
                borderRadius: "100px",
                background:   isActive || isCompleted ? "#5FBF2A" : "rgba(95,191,42,0.20)",
                transition:   "width 300ms ease, background 200ms",
              }}
            />
          );
        })}
      </div>

      {/*
       * ── Modal card ──────────────────────────────────────────────────
       * Desktop: max-w-[520px], rounded-[28px], dark card bg, shadow
       * Mobile:  full-screen, no radius, scrollable
       */}
      <div className="
        relative z-20 w-full
        md:my-20 md:max-w-[520px] md:rounded-[28px]
        md:border md:border-[rgba(95,191,42,0.12)]
        md:bg-[#0D1A0D]
        md:shadow-[0_32px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(95,191,42,0.06)]
        md:backdrop-blur-sm
        min-h-svh md:min-h-0
        bg-[#020702]
        overflow-y-auto
      ">
        {/* Subtle neon top border line on modal */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r from-transparent via-[#5FBF2A]/30 to-transparent md:block hidden" />

        {/* Content area — pt-16 to clear the fixed top bar */}
        <div className="px-6 pb-10 pt-20 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
