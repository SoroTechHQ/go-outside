"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import type { VibeData } from "../../../../lib/onboarding-utils";

/* ── Question data ─────────────────────────────────────────────────────────── */

const QUESTIONS = [
  {
    key:     "frequency" as keyof VibeData,
    label:   "How often do you go out?",
    multi:   false,
    options: [
      { value: "almost_every_weekend", label: "Almost every weekend" },
      { value: "once_or_twice_month",  label: "Once or twice a month" },
      { value: "occasionally",         label: "Occasionally" },
      { value: "rarely_want_to",       label: "Rarely, but I want to" },
    ],
  },
  {
    key:     "crew" as keyof VibeData,
    label:   "What's your usual crew?",
    multi:   false,
    options: [
      { value: "solo",         label: "Solo explorer" },
      { value: "partner",      label: "Partner / date" },
      { value: "small_group",  label: "Small group of friends" },
      { value: "big_group",    label: "Big group" },
    ],
  },
  {
    key:     "time" as keyof VibeData,
    label:   "What time do you come alive?",
    multi:   true,
    options: [
      { value: "afternoon",    label: "Afternoon" },
      { value: "early_evening",label: "Early evening" },
      { value: "late_night",   label: "Late night" },
      { value: "whenever",     label: "Whenever" },
    ],
  },
] as const;

/* ── Chip component ────────────────────────────────────────────────────────── */

function Chip({
  label,
  selected,
  onClick,
}: {
  label:   string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={{ scale: selected ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="rounded-[12px] border px-4 py-3 text-[13px] font-medium transition-colors"
      style={{
        background:   selected ? "rgba(95,191,42,0.12)" : "rgba(255,255,255,0.03)",
        borderColor:  selected ? "#5FBF2A" : "rgba(95,191,42,0.12)",
        color:        selected ? "#5FBF2A" : "rgba(255,255,255,0.5)",
        boxShadow:    selected ? "0 0 12px rgba(95,191,42,0.12)" : "none",
      }}
    >
      {label}
    </motion.button>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function OnboardingVibePage() {
  const router     = useRouter();
  const { user }   = useUser();
  const [vibe, setVibe] = useState<Partial<VibeData>>({});
  const [submitting, setSubmitting] = useState(false);

  function select(key: keyof VibeData, value: string, multi: boolean) {
    setVibe((prev) => {
      if (multi) {
        const arr = (prev[key] as string[] | undefined) ?? [];
        const next = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value];
        return { ...prev, [key]: next };
      }
      return { ...prev, [key]: value };
    });
  }

  function isSelected(key: keyof VibeData, value: string): boolean {
    const v = vibe[key];
    if (Array.isArray(v)) return v.includes(value);
    return v === value;
  }

  const allAnswered = QUESTIONS.every((q) => {
    const v = vibe[q.key];
    return v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== "");
  });

  async function handleContinue() {
    if (!allAnswered) return;
    setSubmitting(true);

    await fetch("/api/users/me", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ vibe }),
    });

    await user?.update({
      unsafeMetadata: {
        ...(user.unsafeMetadata ?? {}),
        vibe,
        onboardingStep: 3,
      },
    });

    router.push("/onboarding/history");
  }

  return (
    <div className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1
            className="text-[26px] font-normal italic text-[#F5FFF0]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Tell us about yourself
          </h1>
          <p className="mt-2 text-[14px] font-light text-[#6B8C6B]">
            Helps us find your kind of scene
          </p>
        </div>

        <div className="space-y-6">
          {QUESTIONS.map((q, qi) => (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: qi * 0.15, ease: "easeOut" }}
            >
              <p className="mb-3 text-[13px] font-semibold text-[#c8e0c8]">{q.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={isSelected(q.key, opt.value)}
                    onClick={() => select(q.key, opt.value, q.multi)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {allAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <button
                onClick={handleContinue}
                disabled={submitting}
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#5FBF2A] text-[14px] font-bold text-[#020702] shadow-[0_0_18px_rgba(95,191,42,0.25)] transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#020702] border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  "Continue →"
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!allAnswered && (
          <p className="mt-6 text-center text-[12px] text-[#3a5a3a]">
            Answer all questions to continue
          </p>
        )}
      </div>
    </div>
  );
}
