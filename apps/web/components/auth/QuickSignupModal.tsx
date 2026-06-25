"use client";

import { useState } from "react";
import { useSignUp, useSignIn } from "@clerk/nextjs/legacy";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { X, EnvelopeSimple, LockSimple, ArrowRight, CheckCircle, Warning } from "@phosphor-icons/react";
import Image from "next/image";

type Step = "details" | "verify" | "done";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
  eventTitle?: string;
};

export function QuickSignupModal({ onSuccess, onClose, eventTitle }: Props) {
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep]         = useState<Step>("details");
  const [mode, setMode]         = useState<"signup" | "signin">("signup");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp || !signIn) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const su = await signUp!.create({ emailAddress: email, password });
        await su.prepareEmailAddressVerification({ strategy: "email_code" });
        setStep("verify");
      } else {
        const result = await signIn!.create({ identifier: email, password });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          setStep("done");
          setTimeout(onSuccess, 300);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Mark as quick signup — skips onboarding, allows checkout immediately
        await fetch("/api/auth/quick-signup", { method: "POST" });

        setStep("done");
        setTimeout(onSuccess, 600);
      }
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Incorrect code. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl md:rounded-3xl bg-[var(--bg-card)] shadow-2xl pb-safe"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-hover)]"
        >
          <X size={14} weight="bold" />
        </button>

        <div className="px-6 pt-5 pb-7">
          {/* Logo */}
          <div className="mb-5">
            <Image src="/logo-full.png" alt="GoOutside" width={100} height={30} className="h-7 w-auto object-contain" />
          </div>

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="text-[1.35rem] font-bold leading-snug text-[var(--text-primary)]">
                  {mode === "signup" ? "Create your account" : "Welcome back"}
                </h2>
                {eventTitle && mode === "signup" && (
                  <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                    to get tickets for <span className="font-semibold text-[var(--text-secondary)]">{eventTitle}</span>
                  </p>
                )}

                <form onSubmit={handleDetails} className="mt-5 space-y-3">
                  <div className="relative">
                    <EnvelopeSimple size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-3 pl-9 pr-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[#4a9f63] transition"
                    />
                  </div>
                  <div className="relative">
                    <LockSimple size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-3 pl-9 pr-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[#4a9f63] transition"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-[12px] text-red-500">
                      <Warning size={14} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a9f63] py-3.5 text-[14px] font-bold text-white transition hover:bg-[#3d8f55] disabled:opacity-60"
                  >
                    {loading ? "Please wait…" : mode === "signup" ? "Continue" : "Sign in"}
                    {!loading && <ArrowRight size={15} weight="bold" />}
                  </button>
                </form>

                <p className="mt-4 text-center text-[12px] text-[var(--text-tertiary)]">
                  {mode === "signup" ? "Already have an account?" : "New to GoOutside?"}{" "}
                  <button
                    onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
                    className="font-semibold text-[#4a9f63] hover:underline"
                  >
                    {mode === "signup" ? "Sign in" : "Create account"}
                  </button>
                </p>

                <p className="mt-3 text-center text-[11px] text-[var(--text-tertiary)]">
                  By continuing, you agree to our{" "}
                  <a href="/terms" target="_blank" className="underline">Terms</a> and{" "}
                  <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
                </p>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="text-[1.35rem] font-bold text-[var(--text-primary)]">Check your email</h2>
                <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                  We sent a 6-digit code to <span className="font-semibold text-[var(--text-secondary)]">{email}</span>
                </p>

                <form onSubmit={handleVerify} className="mt-5 space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-3.5 text-center text-[1.6rem] font-bold tracking-[0.3em] text-[var(--text-primary)] outline-none focus:border-[#4a9f63] transition"
                  />

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-[12px] text-red-500">
                      <Warning size={14} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a9f63] py-3.5 text-[14px] font-bold text-white transition hover:bg-[#3d8f55] disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & continue"}
                    {!loading && <ArrowRight size={15} weight="bold" />}
                  </button>
                </form>

                <button
                  onClick={() => { setStep("details"); setError(null); setCode(""); }}
                  className="mt-4 w-full text-center text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  ← Use a different email
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4a9f63]/15 mb-4">
                  <CheckCircle size={28} weight="fill" className="text-[#4a9f63]" />
                </div>
                <h2 className="text-[1.2rem] font-bold text-[var(--text-primary)]">You're in</h2>
                <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">Opening ticket selection…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
