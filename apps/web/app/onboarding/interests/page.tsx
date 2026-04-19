"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  MusicNote,
  Code,
  ForkKnife,
  PaintBrush,
  Trophy,
  Users,
  BookOpen,
  Buildings,
  type Icon,
} from "@phosphor-icons/react";
import { LANDMARK_BY_ID } from "@/lib/landmark-events";
import { saveOnboardingDraft, getOnboardingDraft } from "@/lib/cookies";
import { updateOnboardingProgress } from "@/lib/onboarding-progress";

const CATEGORIES: { slug: string; name: string; Icon: Icon }[] = [
  { slug: "music",       name: "Music",        Icon: MusicNote  },
  { slug: "tech",        name: "Tech",         Icon: Code       },
  { slug: "food-drink",  name: "Food & Drink", Icon: ForkKnife  },
  { slug: "arts",        name: "Arts",         Icon: PaintBrush },
  { slug: "sports",      name: "Sports",       Icon: Trophy     },
  { slug: "networking",  name: "Networking",   Icon: Users      },
  { slug: "education",   name: "Education",    Icon: BookOpen   },
  { slug: "community",   name: "Community",    Icon: Buildings  },
];

type CategorySlug = "music" | "tech" | "food-drink" | "arts" | "sports" | "networking" | "education" | "community";

export default function OnboardingInterestsPage() {
  const router   = useRouter();
  const { user } = useUser();

  const [selected,          setSelected]         = useState<Set<CategorySlug>>(new Set());
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [historyCategories, setHistoryCategories] = useState<Set<string>>(new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const draft = getOnboardingDraft();
    const draftInterests = new Set<CategorySlug>(
      (draft.interests ?? []) as CategorySlug[]
    );

    const pastIds = draft.pastEventIds
      ?? ((user?.unsafeMetadata?.pastEventIds as string[] | undefined) ?? []);
    const cats = new Set<string>();
    for (const id of pastIds) {
      const ev = LANDMARK_BY_ID.get(id);
      if (ev) cats.add(ev.category);
    }
    setHistoryCategories(cats);

    setSelected((prev) => {
      const next = new Set([...prev, ...draftInterests]);
      for (const c of cats) next.add(c as CategorySlug);
      return next;
    });
  }, [user]);

  useEffect(() => {
    const arr = [...selected];
    if (arr.length > 0) saveOnboardingDraft({ interests: arr });
  }, [selected]);

  function toggle(slug: CategorySlug) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const enoughSelected = selected.size >= 3;

  async function handleContinue() {
    if (!enoughSelected) return;
    setSubmitting(true);
    setError(null);

    const interests = [...selected];
    const vector    = Object.fromEntries(interests.map((s) => [s, 0.6]));

    try {
      const userRes = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ interests }),
      });

      if (!userRes.ok) {
        const body = await userRes.json().catch(() => ({}));
        if (userRes.status === 401) throw new Error("Session expired — please refresh and try again.");
        throw new Error(body?.error ?? "Failed to save your interests. Please try again.");
      }

      const vectorRes = await fetch("/api/onboarding/interests", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ interests, vector }),
      });

      if (!vectorRes.ok) {
        const body = await vectorRes.json().catch(() => ({}));
        if (vectorRes.status === 401) throw new Error("Session expired — please refresh and try again.");
        throw new Error(body?.error ?? "Failed to save your interests. Please try again.");
      }

      await updateOnboardingProgress({
        unsafeMetadata: {
          ...(user?.unsafeMetadata ?? {}),
          interests,
          onboardingStep: 5,
        },
      });

      router.push("/onboarding/pulse");
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
          onboardingStep: 5,
        },
      });

      router.push("/onboarding/pulse");
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
            What moves you?
          </h1>
          <p className="mt-2 text-[14px] font-light" style={{ color: "var(--ob-text-muted)" }}>
            Pick at least 3. Your feed adapts as you explore.
          </p>
        </div>

        {historyCategories.size > 0 && (
          <p className="mb-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#5FBF2A]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5FBF2A]" />
            Pre-selected based on your history
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const isSel       = selected.has(cat.slug as CategorySlug);
            const fromHistory = historyCategories.has(cat.slug);
            const { Icon: CatIcon } = cat;
            return (
              <motion.button
                key={cat.slug}
                type="button"
                onClick={() => toggle(cat.slug as CategorySlug)}
                whileTap={{ scale: 0.96 }}
                animate={{ scale: isSel ? 1.04 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative flex flex-col items-center gap-2 rounded-[14px] border px-2 py-4 text-center transition-colors"
                style={{
                  background:  isSel ? "var(--ob-chip-bg-sel)"     : "var(--ob-chip-bg)",
                  borderColor: isSel ? "var(--ob-chip-border-sel)"  : "var(--ob-chip-border)",
                  boxShadow:   isSel ? "0 0 12px rgba(95,191,42,0.12)" : "none",
                }}
              >
                {fromHistory && !isSel && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#5FBF2A]/40" />
                )}
                <CatIcon
                  size={24}
                  weight={isSel ? "fill" : "regular"}
                  style={{ color: isSel ? "var(--ob-chip-text-sel)" : "var(--ob-chip-text)" }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isSel ? "var(--ob-chip-text-sel)" : "var(--ob-text-muted)" }}
                >
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <p
            className="text-[14px] font-semibold transition-colors"
            style={{ color: enoughSelected ? "#5FBF2A" : "var(--ob-label)" }}
          >
            {selected.size} selected
          </p>
          {!enoughSelected && (
            <p className="mt-1 text-[12px]" style={{ color: "var(--ob-text-faint)" }}>
              Select at least 3
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {enoughSelected && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
              </motion.button>
            )}
          </AnimatePresence>

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
