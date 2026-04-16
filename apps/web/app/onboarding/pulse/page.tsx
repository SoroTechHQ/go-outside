"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { computeStartingScore, getTierFromScore, getTierSlug } from "@/lib/onboarding-utils";
import type { VibeData } from "@/lib/onboarding-utils";

type Phase = "loading" | "reveal";

const LOADING_TEXTS = [
  "Reading your vibe…",
  "Mapping your scene…",
  "Building your profile…",
  "Almost ready…",
];

const STATS = [
  { value: "89K+", label: "People going out" },
  { value: "340+", label: "Events this month" },
  { value: "28",   label: "Cities active" },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);
  return count;
}

export default function OnboardingPulsePage() {
  const router   = useRouter();
  const { user } = useUser();
  const [phase,      setPhase]      = useState<Phase>("loading");
  const [textIdx,    setTextIdx]    = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const confettiFired = useRef(false);

  // Compute score from Clerk metadata
  const interests   = (user?.unsafeMetadata?.interests as string[])  ?? [];
  const pastEvents  = (user?.unsafeMetadata?.pastEventIds as string[]) ?? [];
  const vibe        = (user?.unsafeMetadata?.vibe as VibeData | null) ?? null;

  const score = computeStartingScore({ interests, pastEvents, vibe });
  const tier  = getTierFromScore(score);
  const displayed = useCountUp(score, 1600, phase === "reveal");

  // Rotate loading text
  useEffect(() => {
    const iv = setInterval(() => {
      setTextIdx((i) => (i + 1) % LOADING_TEXTS.length);
    }, 600);
    const t = setTimeout(() => {
      clearInterval(iv);
      setPhase("reveal");
    }, 2600);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, []);

  // Fire confetti on reveal
  useEffect(() => {
    if (phase !== "reveal" || confettiFired.current) return;
    confettiFired.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({
        colors:        ["#5FBF2A", "#F5FFF0", "#a3e635"],
        particleCount: 80,
        spread:        70,
        origin:        { y: 0.55 },
      });
    });
  }, [phase]);

  const [enterError, setEnterError] = useState<string | null>(null);

  async function handleEnter() {
    setSubmitting(true);
    setEnterError(null);
    const tierSlug = getTierSlug(score);

    const res = await fetch("/api/onboarding/complete", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ pulse_score: score, pulse_tier: tierSlug }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setEnterError(body.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    // Hard navigation so the server component re-reads fresh Clerk metadata
    window.location.href = "/home";
  }

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        {phase === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Expanding rings */}
            <div className="relative h-20 w-20">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-[rgba(95,191,42,0.4)]"
                  initial={{ width: 40, height: 40, opacity: 0.8, x: "-50%", y: "-50%" }}
                  animate={{ width: 40 + i * 60, height: 40 + i * 60, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                  style={{ left: "50%", top: "50%" }}
                />
              ))}
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(95,191,42,0.7)]" />
            </div>

            <div>
              <p className="text-[13px] font-light text-[#6B8C6B]">Personalising your GoOutside…</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={textIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mt-1 text-[12px] text-[#3a5a3a]"
                >
                  {LOADING_TEXTS[textIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex w-full max-w-sm flex-col items-center gap-4"
          >
            {/* Score */}
            <motion.p
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
              className="font-display leading-none"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle:  "italic",
                fontSize:   "clamp(64px, 14vw, 80px)",
                color:      "#5FBF2A",
              }}
            >
              {displayed}
            </motion.p>

            <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-[#6B8C6B]">
              Your Pulse Score
            </p>

            {/* Tier badge */}
            <span
              className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ background: tier.bg, color: tier.color }}
            >
              {tier.label}
            </span>

            <p
              className="mt-2 text-[20px] font-normal italic text-[#F5FFF0]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Accra&apos;s been waiting.
            </p>
            <p className="text-[13px] font-light leading-relaxed text-[#4A6A4A]">
              Go out more. Your score grows with every event.
            </p>

            {/* Stats row */}
            <div className="mt-2 grid w-full grid-cols-3 gap-2">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded-[12px] border border-[rgba(95,191,42,0.1)] bg-[#0D140D] px-3 py-3"
                >
                  <p
                    className="text-[18px] font-normal italic text-[#F5FFF0]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] text-[#4A6A4A]">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {enterError && (
              <p className="w-full max-w-xs rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-center text-[12px] text-red-400">
                {enterError}
              </p>
            )}

            {/* CTA */}
            <motion.button
              onClick={handleEnter}
              disabled={submitting}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex h-[46px] w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#5FBF2A] text-[14px] font-bold text-[#020702] shadow-[0_0_18px_rgba(95,191,42,0.3)] transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#020702] border-t-transparent" />
                  Entering…
                </>
              ) : (
                "Enter GoOutside →"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
