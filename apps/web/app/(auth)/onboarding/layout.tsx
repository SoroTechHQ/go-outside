"use client";

import { usePathname } from "next/navigation";
import { ONBOARDING_STEPS } from "../../../lib/onboarding-utils";

const TOTAL_STEPS = 5;

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = ONBOARDING_STEPS[pathname] ?? 1;

  return (
    <div className="relative min-h-svh bg-[#020702]">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[rgba(95,191,42,0.07)] blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[rgba(95,191,42,0.05)] blur-[140px]" />

      {/* Top bar */}
      <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        {/* Wordmark */}
        <span
          className="font-display text-[15px] italic text-[#5FBF2A]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          GoOutside
        </span>

        {/* Step label */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A6A4A]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      {/* Progress dots */}
      <div className="fixed left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-[6px] pt-[18px]">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const s = i + 1;
          const isActive    = s === step;
          const isCompleted = s < step;
          return (
            <div
              key={s}
              style={{
                width:        isActive ? "20px" : "6px",
                height:       "6px",
                borderRadius: "100px",
                background:   isActive || isCompleted ? "#5FBF2A" : "rgba(95,191,42,0.2)",
                transition:   "width 300ms ease, background 200ms",
              }}
            />
          );
        })}
      </div>

      {/* Page content */}
      <div className="relative z-10 pt-16">{children}</div>
    </div>
  );
}
