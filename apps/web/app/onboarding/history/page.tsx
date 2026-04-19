"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "@phosphor-icons/react";
import {
  INITIAL_LANDMARK_IDS,
  LANDMARK_BY_ID,
  type LandmarkEvent,
} from "@/lib/landmark-events";
import { saveOnboardingDraft, getOnboardingDraft } from "@/lib/cookies";
import { updateOnboardingProgress } from "@/lib/onboarding-progress";

const CATEGORY_COLORS: Record<string, string> = {
  music:        "#7c3aed",
  tech:         "#2563eb",
  "food-drink": "#d97706",
  arts:         "#be185d",
  sports:       "#059669",
  networking:   "#0891b2",
  education:    "#b45309",
  community:    "#5b21b6",
};

function EventChip({
  event,
  selected,
  onToggle,
}: {
  event:    LandmarkEvent;
  selected: boolean;
  onToggle: () => void;
}) {
  const dot = CATEGORY_COLORS[event.category] ?? "#5FBF2A";
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.2 }}
      onClick={onToggle}
      className="relative flex items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors"
      style={{
        background:  selected ? "var(--ob-chip-bg-sel)" : "var(--ob-chip-bg)",
        borderColor: selected ? "var(--ob-chip-border-sel)" : "var(--ob-chip-border)",
        boxShadow:   selected ? "0 0 10px rgba(95,191,42,0.1)" : "none",
      }}
    >
      <span
        className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13px] font-medium"
          style={{ color: "var(--ob-question-label)" }}
        >
          {event.name}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--ob-text-faint)" }}>
          {event.year}
        </p>
      </div>
      {selected && (
        <CheckCircle size={16} weight="fill" className="shrink-0 text-[#5FBF2A]" />
      )}
    </motion.button>
  );
}

export default function OnboardingHistoryPage() {
  const router   = useRouter();
  const { user } = useUser();

  const [selected,  setSelected]   = useState<Set<string>>(new Set());
  const [shownIds,  setShownIds]    = useState<string[]>(INITIAL_LANDMARK_IDS);
  const [submitting,setSubmitting]  = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  useEffect(() => {
    const draft = getOnboardingDraft();
    if (draft.pastEventIds && draft.pastEventIds.length > 0) {
      setSelected(new Set(draft.pastEventIds));
    }
  }, []);

  useEffect(() => {
    const ids = [...selected];
    if (ids.length > 0) saveOnboardingDraft({ pastEventIds: ids });
  }, [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const event = LANDMARK_BY_ID.get(id);
        if (event) {
          setShownIds((prevShown) => {
            const toAdd = event.related.filter((r) => !prevShown.includes(r));
            return [...prevShown, ...toAdd.slice(0, 3)];
          });
        }
      }
      return next;
    });
  }, []);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    const events = [...selected].map((id) => {
      const e = LANDMARK_BY_ID.get(id)!;
      return { name: e.name, category: e.category, year: e.year };
    });

    try {
      const res = await fetch("/api/onboarding/history", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ events }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Session expired — please refresh and try again.");
        if (res.status === 404) throw new Error("Account not found. Please sign out and sign back in.");
        throw new Error(body?.error ?? "Failed to save your event history. Please try again.");
      }

      await updateOnboardingProgress({
        unsafeMetadata: {
          ...(user?.unsafeMetadata ?? {}),
          pastEventIds: [...selected],
          onboardingStep: 4,
        },
      });

      router.push("/onboarding/interests");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    setError(null);

    try {
      await updateOnboardingProgress({
        unsafeMetadata: {
          ...(user?.unsafeMetadata ?? {}),
          onboardingStep: 4,
        },
      });

      router.push("/onboarding/interests");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  const shownEvents = shownIds
    .map((id) => LANDMARK_BY_ID.get(id))
    .filter((e): e is LandmarkEvent => Boolean(e));

  return (
    <div>
      <div>
        <div className="mb-6 text-center">
          <h1
            className="text-[24px] font-normal italic"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--ob-heading)" }}
          >
            Events you&apos;ve been to
          </h1>
          <p className="mt-2 text-[13px] font-light" style={{ color: "var(--ob-text-muted)" }}>
            Select any you&apos;ve attended. We use this to personalise your score.
          </p>
        </div>

        <motion.div layout className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {shownEvents.map((event) => (
              <EventChip
                key={event.id}
                event={event}
                selected={selected.has(event.id)}
                onToggle={() => toggle(event.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-6 space-y-3">
          {selected.size > 0 && (
            <p className="text-center text-[12px] text-[#5FBF2A]">
              {selected.size} event{selected.size !== 1 ? "s" : ""} selected
            </p>
          )}

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

          <button
            onClick={handleSkip}
            disabled={submitting}
            className="block w-full py-2 text-center text-[13px] transition"
            style={{ color: "var(--ob-label)" }}
          >
            Skip for now
          </button>

          {error && (
            <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

