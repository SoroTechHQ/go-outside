"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import type { VibeData } from "@/lib/onboarding-utils";
import { saveOnboardingDraft, getOnboardingDraft } from "@/lib/cookies";
import { updateOnboardingProgress } from "@/lib/onboarding-progress";

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
      { value: "afternoon",     label: "Afternoon" },
      { value: "early_evening", label: "Early evening" },
      { value: "late_night",    label: "Late night" },
      { value: "whenever",      label: "Whenever" },
    ],
  },
] as const;

function Chip({
  label,
  selected,
  onClick,
}: {
  label:    string;
  selected: boolean;
  onClick:  () => void;
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
        background:  selected ? "var(--ob-chip-bg-sel)"    : "var(--ob-chip-bg)",
        borderColor: selected ? "var(--ob-chip-border-sel)": "var(--ob-chip-border)",
        color:       selected ? "var(--ob-chip-text-sel)"  : "var(--ob-chip-text)",
        boxShadow:   selected ? "0 0 12px rgba(95,191,42,0.12)" : "none",
      }}
    >
      {label}
    </motion.button>
  );
}

export default function OnboardingVibePage() {
  const router     = useRouter();
  const { user }   = useUser();
  const [vibe, setVibe] = useState<Partial<VibeData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = getOnboardingDraft();
    if (draft.vibe && Object.keys(draft.vibe).length > 0) {
      setVibe(draft.vibe as Partial<VibeData>);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(vibe).length > 0) {
      saveOnboardingDraft({ vibe: vibe as Record<string, unknown> });
    }
  }, [vibe]);

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
    setError(null);

    try {
      const profileRes = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ vibe }),
      });

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        if (profileRes.status === 401) throw new Error("Session expired — please refresh and try again.");
        throw new Error(body?.error ?? "Failed to save your vibe. Please try again.");
      }

      await updateOnboardingProgress({
        unsafeMetadata: {
          ...(user?.unsafeMetadata ?? {}),
          vibe,
          onboardingStep: 3,
        },
      });

      router.push("/onboarding/history");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div>
        <div className="mb-8 text-center">
          <h1
            className="text-[26px] font-normal italic"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--ob-heading)" }}
          >
            Tell us about yourself
          </h1>
          <p className="mt-2 text-[14px] font-light" style={{ color: "var(--ob-text-muted)" }}>
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
              <p
                className="mb-3 text-[13px] font-semibold"
                style={{ color: "var(--ob-question-label)" }}
              >
                {q.label}
              </p>
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
          <p className="mt-6 text-center text-[12px]" style={{ color: "var(--ob-text-faint)" }}>
            Answer all questions to continue
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
