"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

/**
 * Wraps a page's content with a consistent fade-up entrance.
 * Use this as the outermost wrapper inside any page's <main> to get
 * the Apple-style content-entrance feel without every page importing
 * motion directly.
 */
export function PageEntrance({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { variants, reduceMotion } = useAnimationConfig();

  return (
    <motion.div
      variants={variants.fadeUp}
      initial="hidden"
      animate="visible"
      transition={reduceMotion ? { duration: 0.15, delay } : { delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list wrapper — each direct child fades/slides up in sequence.
 * Children should be wrapped in motion.div or motion.li with variants.fadeUp.
 */
export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { variants } = useAnimationConfig();

  return (
    <motion.div
      variants={variants.stagger}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { variants } = useAnimationConfig();

  return (
    <motion.div variants={variants.fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
