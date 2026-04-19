"use client";

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
    <div
      className="relative flex min-h-svh flex-col items-center justify-center"
      style={{ background: "var(--ob-bg)" }}
    >
      {/* ── Full-screen gradient background ───────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{ background: "var(--ob-overlay)" }}
        />
        {/* Subtle radial glow */}
        <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5FBF2A]/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#5FBF2A]/4 blur-[100px]" />
      </div>

      {/* ── Top bar (outside card) ─────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
        {prevRoute ? (
          <button
            onClick={() => router.push(prevRoute)}
            className="flex items-center gap-1.5 transition hover:opacity-70"
            style={{ color: "var(--ob-back-btn)" }}
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
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--ob-step-label)" }}
        >
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      {/* ── Progress dots ─────────────────────────────────────────────── */}
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
                background:   isActive || isCompleted ? "#5FBF2A" : "var(--ob-progress-track)",
                transition:   "width 300ms ease, background 200ms",
              }}
            />
          );
        })}
      </div>

      {/* ── Modal card ────────────────────────────────────────────────── */}
      <div
        className="relative z-20 w-full md:my-20 md:max-w-[520px] md:rounded-[28px] md:backdrop-blur-sm min-h-svh md:min-h-0 overflow-y-auto"
        style={{
          background: "var(--ob-card-bg)",
          border:     "var(--ob-card-border)",
          boxShadow:  "var(--ob-card-shadow)",
        }}
      >
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r from-transparent via-[#5FBF2A]/30 to-transparent hidden md:block" />
        <div className="px-6 pb-10 pt-20 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
