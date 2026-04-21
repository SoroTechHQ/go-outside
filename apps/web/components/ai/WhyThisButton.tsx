"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle, X } from "@phosphor-icons/react";

type WhyThisButtonProps = {
  eventId: string;
  variant?: "overlay" | "inline";
};

export function WhyThisButton({ eventId, variant = "overlay" }: WhyThisButtonProps) {
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function fetchExplanation() {
    if (explanation) { setOpen(true); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res  = await fetch("/api/ai/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId }),
      });
      const data = await res.json() as { explanation?: string };
      setExplanation(data.explanation ?? "Looks like a great match for your vibe!");
    } catch {
      setExplanation("Looks like a great match for your vibe!");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "overlay") {
    return (
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); void fetchExplanation(); }}
          className="flex items-center gap-1 rounded-full border border-[var(--brand)]/30 bg-[var(--brand-dim)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/15 active:scale-95"
          type="button"
        >
          <Sparkle size={10} weight="fill" />
          Why this?
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-full right-0 z-30 mb-2 w-[260px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                  <Sparkle size={10} weight="fill" />
                  Why this for you
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
                  type="button"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="mt-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
                    <span className="text-[12px] text-[var(--text-tertiary)]">Thinking…</span>
                  </div>
                ) : (
                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{explanation}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant (for event detail pages)
  return (
    <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
        <Sparkle size={12} weight="fill" />
        Why this for you?
      </div>

      {!open ? (
        <button
          onClick={() => void fetchExplanation()}
          className="mt-2 text-[13px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          type="button"
        >
          See why GoOutside recommends this →
        </button>
      ) : loading ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
          <span className="text-[13px] text-[var(--text-tertiary)]">Personalising your recommendation…</span>
        </div>
      ) : (
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{explanation}</p>
      )}
    </div>
  );
}
