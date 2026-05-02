"use client";

import Link from "next/link";
import { WizardProvider, useWizard } from "./WizardContext";
import { Step1Basics } from "./steps/Step1Basics";
import { Step2When } from "./steps/Step2When";
import { Step3Where } from "./steps/Step3Where";
import { Step4Tickets } from "./steps/Step4Tickets";
import { Step5Creative } from "./steps/Step5Creative";
import { Step6Publish } from "./steps/Step6Publish";

const STEP_LABELS = ["Basics", "When", "Where", "Tickets", "Creative", "Publish"];

const STEP_COMPONENTS = [Step1Basics, Step2When, Step3Where, Step4Tickets, Step5Creative, Step6Publish];

const STEP_SUBTITLES = [
  "What's the event called and what kind is it?",
  "When does it start and end?",
  "Where is it happening?",
  "How much do tickets cost?",
  "Upload your banner and gallery.",
  "Review and publish your event.",
];

function WizardProgress() {
  const { state, dispatch } = useWizard();
  return (
    <div className="flex items-center gap-1.5">
      {STEP_LABELS.map((label, index) => {
        const stepNum = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const isCompleted = state.step > stepNum;
        const isCurrent = state.step === stepNum;
        return (
          <button
            key={label}
            className="flex items-center gap-1.5 disabled:cursor-not-allowed"
            disabled={!isCompleted}
            title={label}
            type="button"
            onClick={() => isCompleted && dispatch({ type: "SET_STEP", step: stepNum })}
          >
            <div
              className={`h-2 rounded-full transition-all ${
                isCurrent
                  ? "w-8 bg-[var(--brand)]"
                  : isCompleted
                  ? "w-4 bg-[var(--brand)]/60"
                  : "w-4 bg-[var(--bg-muted)]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function WizardContent() {
  const { state, next, back } = useWizard();
  const StepComponent = STEP_COMPONENTS[state.step - 1];
  const isFirst = state.step === 1;
  const isLast = state.step === 6;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-6 py-5 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Step {state.step} of 6 — {STEP_LABELS[state.step - 1]}
            </p>
            <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
              {STEP_SUBTITLES[state.step - 1]}
            </h1>
          </div>
          <div className="hidden shrink-0 sm:block">
            <WizardProgress />
          </div>
        </div>
        <div className="mt-3 sm:hidden">
          <WizardProgress />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {StepComponent && <StepComponent />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          {!isFirst && (
            <button
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              type="button"
              onClick={back}
            >
              Back
            </button>
          )}
          {isFirst && (
            <Link
              className="text-[13px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              href="/organizer/events"
            >
              Cancel
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {state.step > 1 && !isLast && (
            <span className="text-[12px] text-[var(--text-tertiary)]">
              Draft saved automatically
            </span>
          )}
          {!isLast && (
            <button
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97]"
              type="button"
              onClick={next}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function WizardShell() {
  return (
    <WizardProvider>
      <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
        <WizardContent />
      </div>
    </WizardProvider>
  );
}
