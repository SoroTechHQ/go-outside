"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { LANDMARK_BY_ID } from "../../../../lib/landmark-events";

const CATEGORIES = [
  { slug: "music",       name: "Music",        emoji: "🎵" },
  { slug: "tech",        name: "Tech",          emoji: "💻" },
  { slug: "food-drink",  name: "Food & Drink",  emoji: "🍽️" },
  { slug: "arts",        name: "Arts",          emoji: "🎨" },
  { slug: "sports",      name: "Sports",        emoji: "⚽" },
  { slug: "networking",  name: "Networking",    emoji: "🤝" },
  { slug: "education",   name: "Education",     emoji: "🎓" },
  { slug: "community",   name: "Community",     emoji: "🌃" },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export default function OnboardingInterestsPage() {
  const router   = useRouter();
  const { user } = useUser();

  const [selected,   setSelected]   = useState<Set<CategorySlug>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Auto-highlight categories from past event selections (Step 3)
  const [historyCategories, setHistoryCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const pastIds = (user.unsafeMetadata?.pastEventIds as string[]) ?? [];
    const cats = new Set<string>();
    for (const id of pastIds) {
      const ev = LANDMARK_BY_ID.get(id);
      if (ev) cats.add(ev.category);
    }
    setHistoryCategories(cats);
    // Pre-select them
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of cats) next.add(c as CategorySlug);
      return next;
    });
  }, [user]);

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

    const interests = [...selected];
    const vector    = Object.fromEntries(interests.map((s) => [s, 0.6]));

    // Update users.interests
    await fetch("/api/users/me", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ interests }),
    });

    // Upsert user_interest_vectors
    await fetch("/api/onboarding/interests", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ interests, vector }),
    });

    await user?.update({
      unsafeMetadata: {
        ...(user.unsafeMetadata ?? {}),
        interests,
        onboardingStep: 5,
      },
    });

    router.push("/onboarding/pulse");
  }

  return (
    <div className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1
            className="text-[26px] font-normal italic text-[#F5FFF0]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            What moves you?
          </h1>
          <p className="mt-2 text-[14px] font-light text-[#6B8C6B]">
            Pick at least 3. Your feed adapts as you explore.
          </p>
        </div>

        {historyCategories.size > 0 && (
          <p className="mb-4 text-center text-[11px] text-[#4A6A4A]">
            ✓ Pre-selected based on your history
          </p>
        )}

        {/* 4×2 grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const isSel      = selected.has(cat.slug);
            const fromHistory = historyCategories.has(cat.slug);
            return (
              <motion.button
                key={cat.slug}
                type="button"
                onClick={() => toggle(cat.slug)}
                whileTap={{ scale: 0.96 }}
                animate={{ scale: isSel ? 1.04 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative flex flex-col items-center gap-2 rounded-[14px] border px-2 py-4 text-center transition-colors"
                style={{
                  background:  isSel ? "rgba(95,191,42,0.10)" : "rgba(255,255,255,0.03)",
                  borderColor: isSel ? "#5FBF2A" : "rgba(95,191,42,0.10)",
                  boxShadow:   isSel ? "0 0 12px rgba(95,191,42,0.12)" : "none",
                }}
              >
                {fromHistory && !isSel && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#5FBF2A]/40" />
                )}
                <span className="text-[24px] leading-none">{cat.emoji}</span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isSel ? "#5FBF2A" : "#6B8C6B" }}
                >
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="mt-5 text-center">
          <p
            className="text-[14px] font-semibold transition-colors"
            style={{ color: enoughSelected ? "#5FBF2A" : "#4A6A4A" }}
          >
            {selected.size} selected
          </p>
          {!enoughSelected && (
            <p className="mt-1 text-[12px] text-[#3a5a3a]">Select at least 3</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleContinue}
            disabled={!enoughSelected || submitting}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold transition"
            style={{
              background:  enoughSelected && !submitting ? "#5FBF2A" : "rgba(255,255,255,0.04)",
              color:       enoughSelected && !submitting ? "#020702" : "#4A6A4A",
              boxShadow:   enoughSelected && !submitting ? "0 0 18px rgba(95,191,42,0.25)" : "none",
              cursor:      enoughSelected && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </>
            ) : (
              "Continue →"
            )}
          </button>

          <button
            onClick={() => {
              void user?.update({
                unsafeMetadata: { ...(user.unsafeMetadata ?? {}), onboardingStep: 5 },
              });
              router.push("/onboarding/pulse");
            }}
            className="block w-full py-2 text-center text-[13px] text-[#4A6A4A] transition hover:text-[#6B8C6B]"
          >
            Skip for now
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
