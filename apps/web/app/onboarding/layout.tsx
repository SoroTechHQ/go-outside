"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ONBOARDING_STEPS, STEP_ROUTES } from "../../lib/onboarding-utils";
import { ArrowLeft } from "@phosphor-icons/react";

const TOTAL_STEPS = 5;

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const isOrgSetup = pathname === "/onboarding/org-setup";
  const step       = ONBOARDING_STEPS[pathname] ?? 1;
  const prevRoute  = (!isOrgSetup && step > 1) ? STEP_ROUTES[step - 1] : null;

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center"
      style={{ background: "var(--ob-bg)" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
        {/* Left: back button or logo */}
        {prevRoute ? (
          <button
            onClick={() => router.push(prevRoute)}
            className="flex items-center gap-1.5 transition hover:opacity-60"
            style={{ color: "var(--ob-back-btn)" }}
          >
            <ArrowLeft size={14} weight="bold" />
            <span className="text-[12px] font-medium">Back</span>
          </button>
        ) : (
          <Image
            src="/logo-full.png"
            alt="GoOutside"
            width={96}
            height={27}
            style={{ objectFit: "contain" }}
            priority
          />
        )}

        {/* Right: step counter or organizer label */}
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--ob-step-label)" }}
        >
          {isOrgSetup ? "Organizer Setup" : `${step} / ${TOTAL_STEPS}`}
        </span>
      </header>

      {/* ── Progress bar ────────────────────────────────────────────── */}
      <div className="fixed left-0 right-0 top-0 z-20 h-[3px]" style={{ background: "var(--ob-progress-track)" }}>
        <div
          className="h-full"
          style={{
            width:      `${(step / TOTAL_STEPS) * 100}%`,
            background: "var(--brand)",
            transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* ── Modal card ──────────────────────────────────────────────── */}
      <div
        className="relative z-20 w-full md:my-20 md:max-w-[500px] md:rounded-[24px] min-h-svh md:min-h-0 overflow-y-auto"
        style={{
          background: "var(--ob-card-bg)",
          border:     "var(--ob-card-border)",
          boxShadow:  "var(--ob-card-shadow)",
        }}
      >
        <div className="px-6 pb-10 pt-20 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
