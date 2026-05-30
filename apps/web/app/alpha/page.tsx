"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Lightning, Ticket, Envelope } from "@phosphor-icons/react";
import Link from "next/link";

const PERKS = [
  { icon: Star,      label: "Founding Explorer badge", sub: "Permanent on your profile. Nobody gets this after launch." },
  { icon: Lightning, label: "2× Pulse Points, 90 days", sub: "Your reputation head-start from day one." },
  { icon: Ticket,    label: "Early event access",       sub: "Platform-covered ticket to a partner event." },
  { icon: Envelope,  label: "Direct line to the Creators",      sub: "Every piece of feedback goes straight to the founder." },
];

type Phase = "form" | "submitting" | "done";

export default function AlphaPage() {
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [phase,  setPhase]  = useState<Phase>("form");
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase("submitting");
    setError("");

    try {
      const res = await fetch("/api/alpha/join", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      if (res.ok) {
        setPhase("done");
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Try again.");
        setPhase("form");
      }
    } catch {
      setError("Network error. Try again.");
      setPhase("form");
    }
  }

  return (
    <div
      className="relative flex min-h-svh flex-col overflow-hidden"
      style={{ background: "#070d07" }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#2f8f45] opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-[#5FBF2A] opacity-[0.04] blur-[100px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f110f]" style={{ border: "1px solid rgba(95,191,42,0.3)" }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="#5FBF2A" />
              <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">GoOutside</span>
        </Link>
        <Link href="/sign-in" className="text-[13px] font-medium text-white/40 transition hover:text-white/70">
          Already have an account →
        </Link>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <div
              className="flex items-center gap-2.5 rounded-full px-4 py-2"
              style={{
                background: "rgba(95,191,42,0.08)",
                border: "1px solid rgba(95,191,42,0.25)",
              }}
            >
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ background: "#5FBF2A", boxShadow: "0 0 8px #5FBF2A" }}
              />
              <span className="text-[12px] font-semibold text-[#5FBF2A]">
                Founding Explorer program — limited spots
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-5 text-center text-[42px] font-bold leading-[1.1] tracking-tight text-white md:text-[52px]"
          >
            Use GoOutside<br />
            <span style={{ color: "#5FBF2A" }}>before anyone else.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mb-10 text-center text-[16px] leading-relaxed text-white/45"
          >
            We&apos;re hand-picking the first people to use GoOutside in Accra.
            Get early access, a permanent Founding Explorer badge, and double Pulse Points from day one.
          </motion.p>

          {/* Perks row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 grid grid-cols-2 gap-2.5"
          >
            {PERKS.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(95,191,42,0.12)" }}>
                  <Icon size={16} weight="fill" style={{ color: "#5FBF2A" }} />
                </div>
                <p className="mb-0.5 text-[13px] font-semibold text-white">{label}</p>
                <p className="text-[11px] leading-relaxed text-white/35">{sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Form / Done state */}
          <AnimatePresence mode="wait">
            {phase !== "done" ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: 0.26 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-12 w-full rounded-xl px-4 text-[14px] text-white placeholder-white/25 outline-none transition"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    caretColor: "#5FBF2A",
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-12 w-full rounded-xl px-4 text-[14px] text-white placeholder-white/25 outline-none transition"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    caretColor: "#5FBF2A",
                  }}
                />

                {error && (
                  <p className="text-[12px] text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={phase === "submitting" || !email.trim()}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "#5FBF2A", height: "52px" }}
                >
                  {phase === "submitting" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Request early access <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-white/20">
                  No spam. One email with your access link, that&apos;s it.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(95,191,42,0.07)", border: "1px solid rgba(95,191,42,0.2)" }}
              >
                <div className="mb-4 flex justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="text-5xl"
                  >
                    🎉
                  </motion.span>
                </div>
                <p className="mb-2 text-[20px] font-bold text-white">You&apos;re in.</p>
                <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                  Check your email — your access link is on its way.
                  Once you create your account, your Founding Explorer badge activates automatically.
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition hover:brightness-110"
                  style={{ background: "#5FBF2A" }}
                >
                  Create account now <ArrowRight size={14} weight="bold" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 text-center">
        <p className="text-[12px] text-white/20">© {new Date().getFullYear()} GoOutside · Accra, Ghana</p>
      </div>
    </div>
  );
}
