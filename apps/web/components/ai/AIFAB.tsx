"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowsOutSimple, Sparkle, X } from "@phosphor-icons/react";
import AICoreChat from "./AICoreChat";

export function AIFAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/ai" || pathname.startsWith("/ai/") || pathname === "/dashboard/ai") {
    return null;
  }

  return (
    <>
      <motion.button
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={`fixed bottom-8 right-8 z-[60] hidden h-[56px] w-[56px] items-center justify-center rounded-full border backdrop-blur-xl transition md:flex ${
          open
            ? "border-[var(--brand)]/35 bg-[var(--brand-dim)] text-[var(--brand)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-glass)] text-[var(--brand)] shadow-[0_12px_34px_rgba(0,0,0,0.18)] hover:border-[var(--brand)]/40"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 80 }}
              initial={{ opacity: 0, rotate: -80 }}
              key="close"
            >
              <X size={22} weight="bold" />
            </motion.span>
          ) : (
            <motion.span
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -80 }}
              initial={{ opacity: 0, rotate: 80 }}
              key="sparkle"
            >
              <Sparkle size={24} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed bottom-24 right-6 z-[60] hidden w-[420px] max-w-[calc(100vw-48px)] md:block"
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-2 flex justify-end">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)] backdrop-blur transition hover:text-[var(--text-primary)]"
                href="/ai"
                onClick={() => setOpen(false)}
              >
                <ArrowsOutSimple size={13} weight="bold" />
                Open tab
              </Link>
            </div>
            <AICoreChat compact />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default AIFAB;
