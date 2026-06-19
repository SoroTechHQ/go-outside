import type { Variants, Transition } from "framer-motion";

// ─── Spring presets ──────────────────────────────────────────────────────────
export const springs = {
  // Fast micro-interactions (button taps, toggles)
  snappy: { type: "spring", stiffness: 400, damping: 30 } as Transition,
  // Card / list item entrances
  gentle: { type: "spring", stiffness: 200, damping: 22 } as Transition,
  // Page-level transitions
  page:   { type: "spring", stiffness: 180, damping: 24 } as Transition,
  // Sheet / modal slide-up
  sheet:  { type: "spring", stiffness: 160, damping: 26 } as Transition,
  // Overlay fade (no spring)
  overlay: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } as Transition,
} as const;

// ─── Reduced-motion equivalents (opacity only, short) ────────────────────────
const reducedTransition: Transition = { duration: 0.15, ease: "linear" };

// ─── Variant factories ───────────────────────────────────────────────────────

export function fadeUp(reduced = false): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: reducedTransition },
      exit:    { opacity: 0, transition: reducedTransition },
    };
  }
  return {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: springs.gentle },
    exit:    { opacity: 0, y: 8,  transition: springs.gentle },
  };
}

export function fadeIn(reduced = false): Variants {
  return {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: reduced ? reducedTransition : springs.overlay },
    exit:    { opacity: 0, transition: reduced ? reducedTransition : springs.overlay },
  };
}

export function slideUp(reduced = false): Variants {
  if (reduced) {
    return {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: reducedTransition },
      exit:    { opacity: 0, transition: reducedTransition },
    };
  }
  return {
    hidden:  { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: 0,      transition: springs.sheet },
    exit:    { opacity: 0, y: "100%", transition: springs.sheet },
  };
}

export function slideInRight(reduced = false): Variants {
  if (reduced) {
    return {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: reducedTransition },
      exit:    { opacity: 0, transition: reducedTransition },
    };
  }
  return {
    hidden:  { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0,  transition: springs.page },
    exit:    { opacity: 0, x: 24, transition: springs.page },
  };
}

export function scaleIn(reduced = false): Variants {
  if (reduced) {
    return {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: reducedTransition },
      exit:    { opacity: 0, transition: reducedTransition },
    };
  }
  return {
    hidden:  { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1,    transition: springs.gentle },
    exit:    { opacity: 0, scale: 0.94, transition: springs.gentle },
  };
}

export function pageTransition(reduced = false): Variants {
  if (reduced) {
    return {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: reducedTransition },
      exit:    { opacity: 0, transition: reducedTransition },
    };
  }
  return {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: springs.page },
    exit:    { opacity: 0, y: 4, transition: { ...springs.page, duration: 0.15 } },
  };
}

// Stagger container — wraps lists; children use any *Up/In variant
export function staggerContainer(reduced = false): Variants {
  return {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.04,
        delayChildren:   reduced ? 0 : 0.04,
      },
    },
  };
}

// Tap / press feedback for interactive elements
export const tapScale = {
  whileTap: { scale: 0.96 },
  transition: springs.snappy,
} as const;

export const tapScaleSm = {
  whileTap: { scale: 0.92 },
  transition: springs.snappy,
} as const;
