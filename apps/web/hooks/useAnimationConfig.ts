"use client";

import { useMemo } from "react";
import { useAnimationSettings } from "../lib/animation-settings";
import {
  fadeUp,
  fadeIn,
  slideUp,
  slideInRight,
  scaleIn,
  pageTransition,
  staggerContainer,
  tapScale,
  tapScaleSm,
  springs,
} from "../lib/motion-variants";

/**
 * Returns animation variant sets and spring configs pre-baked for the
 * user's current reduce-motion preference. Components import this instead
 * of importing variants directly so the toggle takes effect everywhere.
 */
export function useAnimationConfig() {
  const { reduceMotion } = useAnimationSettings();

  return useMemo(
    () => ({
      reduceMotion,
      variants: {
        fadeUp:         fadeUp(reduceMotion),
        fadeIn:         fadeIn(reduceMotion),
        slideUp:        slideUp(reduceMotion),
        slideInRight:   slideInRight(reduceMotion),
        scaleIn:        scaleIn(reduceMotion),
        page:           pageTransition(reduceMotion),
        stagger:        staggerContainer(reduceMotion),
      },
      springs,
      tap:   tapScale,
      tapSm: tapScaleSm,
    }),
    [reduceMotion],
  );
}
