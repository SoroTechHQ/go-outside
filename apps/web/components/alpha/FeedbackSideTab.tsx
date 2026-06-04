"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Smiley, Lightbulb, Heart, ArrowRight } from "@phosphor-icons/react";

const QUICK_TYPES = [
  { key: "bug",     label: "Bug",      Icon: Bug,       color: "#ef4444" },
  { key: "ux",      label: "Feels Off", Icon: Smiley,   color: "#f59e0b" },
  { key: "feature", label: "Idea",      Icon: Lightbulb, color: "#3b82f6" },
  { key: "delight", label: "Love It",   Icon: Heart,     color: "#10b981" },
];

export function FeedbackSideTab() {
  const router   = useRouter();
  const [open,   setOpen]   = useState(false);
  const [hovered, setHovered] = useState(false);

  const goToFeedback = useCallback((type?: string) => {
    const page = encodeURIComponent(window.location.href);
    const url  = type
      ? `/feedback?page=${page}&type=${type}`
      : `/feedback?page=${page}`;
    router.push(url);
  }, [router]);

  return (
    <>
      {/* Backdrop (close popout when clicking outside) */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Side tab + popout */}
      <div className="fixed right-0 top-1/2 z-50 -translate-y-1/2 flex items-center">

        {/* Popout card */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="popout"
              initial={{ opacity: 0, x: 16, scale: 0.96 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 16, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="mr-2 w-56 overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: "#0f110f", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {/* Header */}
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[13px] font-bold text-white">Quick feedback</p>
                <p className="text-[11px] text-white/40">What are you seeing right now?</p>
              </div>

              {/* Type buttons */}
              <div className="p-2 space-y-1">
                {QUICK_TYPES.map(({ key, label, Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => goToFeedback(key)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:brightness-125 active:scale-[0.98]"
                    style={{ background: `${color}10`, border: `1px solid ${color}22` }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${color}20`, color }}
                    >
                      <Icon size={14} weight="fill" />
                    </span>
                    <span className="text-[13px] font-medium text-white">{label}</span>
                  </button>
                ))}
              </div>

              {/* Full form link */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => goToFeedback()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition hover:brightness-110"
                  style={{ background: "#2f8f45", color: "#fff" }}
                >
                  Open full form <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The tab itself */}
        <motion.button
          onClick={() => setOpen(v => !v)}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{ x: open ? 0 : hovered ? -3 : 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="relative flex flex-col items-center gap-1.5 rounded-l-xl py-4 px-2.5 shadow-xl"
          style={{
            background:  open ? "#2f8f45" : "#0f110f",
            border:      `1px solid ${open ? "transparent" : "rgba(95,191,42,0.30)"}`,
            borderRight: "none",
            cursor:      "pointer",
            writingMode: "vertical-rl",
          }}
          aria-label="Open feedback"
        >
          {/* Pulse dot */}
          {!open && (
            <span
              className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full"
              style={{ background: "#5FBF2A", boxShadow: "0 0 6px #5FBF2A" }}
            />
          )}

          {/* Icon */}
          <Bug
            size={15}
            weight="fill"
            style={{ color: open ? "#fff" : "#5FBF2A", transform: "rotate(90deg)" }}
          />

          {/* Label */}
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{
              color:         open ? "#fff" : "#5FBF2A",
              letterSpacing: "0.1em",
              transform:     "rotate(180deg)",
            }}
          >
            Feedback
          </span>
        </motion.button>

      </div>
    </>
  );
}
