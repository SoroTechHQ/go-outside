"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Lightning, Ticket, UsersThree } from "@phosphor-icons/react";
import { useUser } from "@clerk/nextjs";

const WELCOMED_KEY = "go_alpha_welcomed";

const PERKS = [
  {
    icon: Star,
    title: "Founding Explorer badge",
    sub:   "Permanent on your profile — nobody gets this after we open publicly.",
  },
  {
    icon: Lightning,
    title: "2× Pulse Points for 90 days",
    sub:   "Every action earns double. Your reputation head-start starts now.",
  },
  {
    icon: Ticket,
    title: "Early event access",
    sub:   "Platform-covered ticket to a partner event coming soon.",
  },
  {
    icon: UsersThree,
    title: "Direct line to the Creators",
    sub:   "Your feedback shapes the product. Nana reads everything.",
  },
];

export function AlphaWelcomeModal() {
  const { user, isLoaded } = useUser();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0); // 0 = welcome, 1 = perks, 2 = done

  useEffect(() => {
    if (!isLoaded) return;
    const alreadyWelcomed = localStorage.getItem(WELCOMED_KEY) === "true";
    if (!alreadyWelcomed) {
      // Small delay so the page loads first
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoaded]);

  function handleDone() {
    localStorage.setItem(WELCOMED_KEY, "true");
    setShow(false);
  }

  const firstName = user?.firstName ?? "Explorer";

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[201] flex items-center justify-center px-5"
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-[28px]"
              style={{
                background: "linear-gradient(160deg, #0e1a0e 0%, #090f09 100%)",
                border: "1px solid rgba(95,191,42,0.25)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(95,191,42,0.08)",
              }}
            >
              {/* Glow orbs */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#5FBF2A] opacity-[0.07] blur-[60px]" />
              <div className="pointer-events-none absolute -bottom-16 -right-8 h-40 w-40 rounded-full bg-[#2f8f45] opacity-[0.06] blur-[60px]" />

              <AnimatePresence mode="wait">

                {/* ── Step 0: Welcome ── */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                    className="relative z-10 px-8 py-10 text-center"
                  >
                    {/* Badge icon */}
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 14, delay: 0.1 }}
                      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #3d2700, #1a1000)",
                        border: "2px solid #b45309",
                        boxShadow: "0 0 24px rgba(180,83,9,0.3)",
                      }}
                    >
                      <Star size={36} weight="fill" style={{ color: "#fbbf24" }} />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#5FBF2A]"
                    >
                      Founding Explorer
                    </motion.p>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="mb-4 text-[32px] font-bold leading-[1.15] tracking-tight text-white"
                    >
                      Welcome,<br />{firstName}.
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-8 text-[15px] leading-relaxed text-white/50"
                    >
                      You&apos;re one of the first people using GoOutside.
                      That means something — you&apos;re helping shape what this becomes
                      for Accra and beyond.
                    </motion.p>

                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.38 }}
                      onClick={() => setStep(1)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
                      style={{ background: "#5FBF2A" }}
                    >
                      See what you get <ArrowRight size={16} weight="bold" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Step 1: Perks ── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                    className="relative z-10 px-8 py-8"
                  >
                    <p className="mb-6 text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5FBF2A]">
                      Your founding perks
                    </p>

                    <div className="mb-6 space-y-3">
                      {PERKS.map(({ icon: Icon, title, sub }, i) => (
                        <motion.div
                          key={title}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-4 rounded-2xl p-4"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: "rgba(95,191,42,0.12)" }}
                          >
                            <Icon size={18} weight="fill" style={{ color: "#5FBF2A" }} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-white">{title}</p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-white/40">{sub}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={handleDone}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
                      style={{ background: "#5FBF2A" }}
                    >
                      Let&apos;s go <ArrowRight size={16} weight="bold" />
                    </motion.button>

                    <p className="mt-3 text-center text-[11px] text-white/20">
                      Use the feedback button anytime to share your thoughts.
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
