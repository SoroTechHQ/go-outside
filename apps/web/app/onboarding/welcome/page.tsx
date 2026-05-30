"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const SLIDES = [
  {
    headline: "Discover things worth\nleaving home for.",
    sub:      "Find events, experiences, and communities happening around you — curated to your taste.",
    accent:   "#5FBF2A",
    bg:       "#0c0c0c",
    emoji:    "🗺️",
  },
  {
    headline: "Go with\nfriends.",
    sub:      "See who's attending. Make plans together. Never show up alone unless you want to.",
    accent:   "#3b82f6",
    bg:       "#060c14",
    emoji:    "👥",
  },
  {
    headline: "Build your\nreputation.",
    sub:      "Earn Pulse Points by attending events, discovering new scenes, and being part of the city.",
    accent:   "#f59e0b",
    bg:       "#100c00",
    emoji:    "⚡",
  },
  {
    headline: "Unlock\nrewards.",
    sub:      "Redeem Pulse Points for tickets, event perks, and exclusive access only members get.",
    accent:   "#a855f7",
    bg:       "#0d0614",
    emoji:    "🎁",
  },
];

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 28, stiffness: 260 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-30%" : "30%",
    opacity: 0,
    transition: { duration: 0.22, ease: "easeIn" as const },
  }),
};

export default function OnboardingWelcomePage() {
  const router  = useRouter();
  const [idx, setIdx]   = useState(0);
  const [dir, setDir]   = useState(1);

  const slide    = SLIDES[idx];
  const isLast   = idx === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      router.push("/onboarding/profile");
    } else {
      setDir(1);
      setIdx((i) => i + 1);
    }
  };

  const skip = () => router.push("/onboarding/profile");

  return (
    <div
      className="relative flex min-h-svh flex-col overflow-hidden"
      style={{ background: slide.bg, transition: "background 0.6s ease" }}
    >
      {/* Glow orb */}
      <motion.div
        key={`glow-${idx}`}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: slide.accent }}
      />

      {/* Skip */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          onClick={skip}
          className="text-sm font-medium text-white/30 transition hover:text-white/60"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 pb-4">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col"
          >
            {/* Emoji */}
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 14 }}
              className="mb-8 text-6xl"
            >
              {slide.emoji}
            </motion.span>

            {/* Headline */}
            <h1
              className="mb-5 whitespace-pre-line text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-white md:text-[52px]"
            >
              {slide.headline}
            </h1>

            {/* Sub */}
            <p className="text-[17px] leading-relaxed text-white/50 md:text-lg">
              {slide.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + CTA */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 pb-12">
        {/* Progress dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
              animate={{ width: i === idx ? 24 : 8 }}
              transition={{ duration: 0.25 }}
              className="h-2 rounded-full"
              style={{ background: i === idx ? slide.accent : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={next}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-semibold text-white transition-transform hover:brightness-110 active:scale-[0.97]"
          style={{ background: slide.accent }}
        >
          {isLast ? "Get started" : "Continue"}
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {/* Swipe hint on first slide */}
      {idx === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-36 left-0 right-0 z-10 text-center text-xs text-white"
        >
          Tap to continue
        </motion.p>
      )}
    </div>
  );
}
