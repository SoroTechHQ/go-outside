"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface SpinnerProps {
  size?:  "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
};

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-[var(--brand)] border-t-transparent",
          SIZE_MAP[size]
        )}
      />
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          {label}
        </span>
      )}
    </span>
  );
}

/** Full-page centered spinner — fades in after 150ms to avoid flash on fast loads */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <motion.div
      className="flex min-h-[40vh] items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
    >
      <Spinner size="lg" label={label} />
    </motion.div>
  );
}
