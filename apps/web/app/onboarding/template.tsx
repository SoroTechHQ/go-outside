"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { useRef } from "react";
import { ONBOARDING_STEPS } from "../../lib/onboarding-utils";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

export default function OnboardingTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reduceMotion } = useAnimationConfig();
  const step = ONBOARDING_STEPS[pathname] ?? 1;
  const prevStepRef = useRef(step);

  const direction = step >= prevStepRef.current ? 1 : -1;
  prevStepRef.current = step;

  const springTransition: Transition = { type: "spring", stiffness: 200, damping: 24 };
  const fastTransition: Transition   = { duration: 0.15, ease: "linear" };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 32 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduceMotion   ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
        transition={reduceMotion ? fastTransition : springTransition}
        style={{ width: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
