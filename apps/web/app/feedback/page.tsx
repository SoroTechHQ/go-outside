"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Warning,
  Lightbulb,
  Heart,
  Star,
  ArrowRight,
  ArrowLeft,
  UploadSimple,
  X,
  CheckCircle,
  Link as LinkIcon,
  Info,
  Sun,
  Moon,
  ChatCircleDots,
} from "@phosphor-icons/react";
import Link from "next/link";
import { collectBrowserInfo } from "../../lib/alpha";

/* ── Types ─────────────────────────────────────────────────────────────── */

type FeedbackType = "bug" | "ux" | "feature" | "delight" | "pulse_check";
type Severity     = "critical" | "high" | "medium" | "low";
type Phase        = "form" | "submitting" | "done";

/* ── Constants ─────────────────────────────────────────────────────────── */

const TYPES: {
  key:         FeedbackType;
  label:       string;
  Icon:        React.ElementType;
  desc:        string;
  color:       string;
  placeholder: string;
}[] = [
  { key: "bug",         label: "Bug Report",      Icon: Bug,       color: "#ef4444", desc: "Something broke or doesn't work",       placeholder: "Describe what happened. Include the page, what you clicked, and what went wrong." },
  { key: "ux",          label: "Feels Off",        Icon: Warning,   color: "#f59e0b", desc: "Confusing, awkward, or unclear UI",     placeholder: "I was trying to... but it felt confusing because..." },
  { key: "feature",     label: "Idea / Feature",   Icon: Lightbulb, color: "#3b82f6", desc: "Something you'd love to see",           placeholder: "Describe the feature or improvement. What problem does it solve?" },
  { key: "delight",     label: "Love It",          Icon: Heart,     color: "#10b981", desc: "Something that worked great",           placeholder: "Tell us what you loved. Specific moments are the most helpful." },
  { key: "pulse_check", label: "General Check-in", Icon: Star,      color: "#8b5cf6", desc: "Overall impressions & rating",          placeholder: "How is your experience so far? What's working, what isn't?" },
];

const SEVERITIES: { key: Severity; label: string; desc: string; color: string }[] = [
  { key: "critical", label: "Critical", desc: "App crashes, can't proceed",          color: "#ef4444" },
  { key: "high",     label: "High",     desc: "Major feature broken",                color: "#f59e0b" },
  { key: "medium",   label: "Medium",   desc: "Something looks wrong",               color: "#3b82f6" },
  { key: "low",      label: "Low",      desc: "Cosmetic — typo, colour, spacing",    color: "#6b7280" },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StepDot({ active, done, n }: { active: boolean; done: boolean; n: number; dark: boolean }) {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all"
      style={{
        background: done ? "#2f8f45" : active ? "#0f110f" : "#e5e7eb",
        color:      done || active ? "#fff" : "#9ca3af",
      }}
    >
      {done ? <CheckCircle size={13} weight="fill" /> : n}
    </span>
  );
}

/* ── Theme tokens ──────────────────────────────────────────────────────── */

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("go_feedback_dark");
    if (saved === "1") setDark(true);
  }, []);
  const toggle = () => setDark(v => {
    const next = !v;
    localStorage.setItem("go_feedback_dark", next ? "1" : "0");
    return next;
  });
  return { dark, toggle };
}

/* ── Main page ─────────────────────────────────────────────────────────── */

export default function FeedbackPage() {
  const { dark, toggle } = useTheme();

  const [phase,      setPhase]      = useState<Phase>("form");
  const [step,       setStep]       = useState<1 | 2 | 3>(1);
  const [type,       setType]       = useState<FeedbackType | null>(null);
  const [severity,   setSeverity]   = useState<Severity | null>(null);
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [pageUrl,    setPageUrl]    = useState("");
  const [linkUrl,    setLinkUrl]    = useState("");
  const [title,      setTitle]      = useState("");
  const [message,    setMessage]    = useState("");
  const [stepsRepro, setStepsRepro] = useState("");
  const [expected,   setExpected]   = useState("");
  const [actual,     setActual]     = useState("");
  const [rating,     setRating]     = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error,      setError]      = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    const t = params.get("type") as FeedbackType | null;
    if (p) setPageUrl(decodeURIComponent(p));
    if (t && TYPES.some(x => x.key === t)) {
      setType(t);
      setStep(2); // skip straight to details
    }
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Screenshot must be under 10 MB."); return; }
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  }, []);

  const removeShot = useCallback(() => {
    setScreenshot(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [previewUrl]);

  const canStep2 = type !== null;
  const canStep3 = message.trim().length >= 10;

  const handleSubmit = useCallback(async () => {
    if (!type || !message.trim()) return;
    setPhase("submitting");
    setError("");

    let screenshotDataUrl: string | undefined;
    if (screenshot) {
      try { screenshotDataUrl = await fileToDataUrl(screenshot); } catch { /* skip */ }
    }

    const parts: string[] = [];
    if (title.trim())      parts.push(`Summary: ${title.trim()}`);
    if (type === "bug" && severity) parts.push(`Severity: ${severity.toUpperCase()}`);
    parts.push(message.trim());
    if (stepsRepro.trim()) parts.push(`\n--- Steps to Reproduce ---\n${stepsRepro.trim()}`);
    if (expected.trim())   parts.push(`\n--- Expected ---\n${expected.trim()}`);
    if (actual.trim())     parts.push(`\n--- Actual ---\n${actual.trim()}`);

    try {
      const res = await fetch("/api/alpha/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating:            rating > 0 ? rating : undefined,
          message:           parts.join("\n\n"),
          screenshotDataUrl,
          pageUrl:           pageUrl || window.location.href,
          linkUrl:           linkUrl.trim() || undefined,
          browserInfo: {
            ...collectBrowserInfo(),
            testerName:  name.trim()  || undefined,
            testerEmail: email.trim() || undefined,
            severity:    type === "bug" ? (severity ?? undefined) : undefined,
            title:       title.trim() || undefined,
          },
        }),
      });
      if (res.ok) { setPhase("done"); }
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Try again.");
        setPhase("form");
      }
    } catch {
      setError("Network error. Check your connection.");
      setPhase("form");
    }
  }, [type, severity, title, message, stepsRepro, expected, actual, rating, pageUrl, linkUrl, screenshot, name, email]);

  const selectedType = TYPES.find(t => t.key === type);

  /* ── Theme values ── */
  const bg       = dark ? "#0c0c0c" : "#ffffff";
  const bgCard   = dark ? "rgba(255,255,255,0.04)" : "#f9fafb";
  const border   = dark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const textPrim = dark ? "#f0f0f0" : "#0f110f";
  const textMid  = dark ? "#a0a0a0" : "#6b7280";
  const textMute = dark ? "rgba(255,255,255,0.25)" : "#9ca3af";
  const inputBg  = dark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const focusBorder = dark ? "rgba(95,191,42,0.5)" : "#2f8f45";

  const inputCls = "w-full rounded-xl px-4 text-[14px] outline-none transition";
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrim, caretColor: "#2f8f45" };
  const onFocus  = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.borderColor = focusBorder;
  const onBlur   = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.borderColor = border;

  /* ── Done state ── */
  if (phase === "done") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-16 transition-colors" style={{ background: bg }}>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.1 }} className="mb-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(47,143,69,0.12)", border: "1px solid rgba(47,143,69,0.3)" }}>
              <CheckCircle size={32} weight="fill" style={{ color: "#2f8f45" }} />
            </span>
          </motion.div>
          <h1 className="mb-3 text-[28px] font-bold" style={{ color: textPrim }}>Feedback received.</h1>
          <p className="mb-8 text-[15px] leading-relaxed" style={{ color: textMid }}>
            Nana will review this shortly. You're helping shape what GoOutside becomes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/home" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110" style={{ background: "#2f8f45" }}>
              Back to the app <ArrowRight size={14} weight="bold" />
            </Link>
            <button
              onClick={() => { setPhase("form"); setStep(1); setType(null); setSeverity(null); setTitle(""); setMessage(""); setStepsRepro(""); setExpected(""); setActual(""); setRating(0); setScreenshot(null); setPreviewUrl(null); setPageUrl(""); setLinkUrl(""); }}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition"
              style={{ background: bgCard, color: textMid, border: `1px solid ${border}` }}
            >
              Submit another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="relative min-h-svh transition-colors duration-200" style={{ background: bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>

      {/* Subtle glow (dark mode only) */}
      {dark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#2f8f45] opacity-[0.05] blur-[120px]" />
        </div>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10" style={{ borderBottom: `1px solid ${border}` }}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mini.png" alt="GoOutside" width={28} height={28} style={{ objectFit: "contain", borderRadius: "6px" }} />
          <span className="text-[15px] font-bold tracking-tight" style={{ color: textPrim }}>GoOutside</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-[13px] font-medium transition" style={{ color: textMid }}>
            Testing guide →
          </Link>
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full transition"
            style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: dark ? "#e0e0e0" : "#6b7280", border: `1px solid ${border}` }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={14} weight="fill" /> : <Moon size={14} weight="fill" />}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-16 pt-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: dark ? "rgba(47,143,69,0.10)" : "#f0f9f2", border: `1px solid ${dark ? "rgba(47,143,69,0.25)" : "#c8e8ce"}` }}>
            <ChatCircleDots size={14} weight="fill" style={{ color: "#2f8f45" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#2f8f45" }}>Alpha Program — Feedback Form</span>
          </div>
          <h1 className="mb-3 text-[34px] font-bold leading-tight tracking-tight md:text-[42px]" style={{ color: textPrim }}>
            Tell us what you found.
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: textMid }}>
            Bugs, UX gripes, ideas, or moments of delight. Every submission goes directly to Nana.
          </p>
        </motion.div>

        {/* Step dots */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="mb-8 flex items-center justify-center gap-3">
          {[{ n: 1, label: "Type" }, { n: 2, label: "Details" }, { n: 3, label: "Context" }].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <StepDot n={n} active={step === n} done={step > n} dark={dark} />
                <span className="hidden text-[12px] font-medium sm:inline" style={{ color: step === n ? textPrim : textMute }}>{label}</span>
              </div>
              {i < 2 && <div className="h-px w-8 rounded-full" style={{ background: step > n + 1 ? "#2f8f45" : border }} />}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Type ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              <p className="mb-4 text-[14px] font-medium" style={{ color: textMid }}>What kind of feedback is this?</p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TYPES.map(({ key, label, Icon, desc, color }) => {
                  const sel = type === key;
                  return (
                    <button key={key} type="button" onClick={() => setType(sel ? null : key)}
                      className="flex items-start gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                      style={{ background: sel ? `${color}10` : bgCard, border: `1px solid ${sel ? `${color}40` : border}` }}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
                        <Icon size={17} weight={sel ? "fill" : "regular"} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: textPrim }}>{label}</p>
                        <p className="mt-0.5 text-[12px]" style={{ color: textMid }}>{desc}</p>
                      </div>
                      {sel && <CheckCircle size={17} weight="fill" style={{ color, flexShrink: 0, marginTop: 3 }} />}
                    </button>
                  );
                })}
              </div>

              {/* Severity picker */}
              <AnimatePresence>
                {type === "bug" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-5">
                      <p className="mb-3 text-[13px] font-medium" style={{ color: textMid }}>How severe is it?</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {SEVERITIES.map(({ key, label, desc, color }) => {
                          const sel = severity === key;
                          return (
                            <button key={key} type="button" onClick={() => setSeverity(sel ? null : key)}
                              className="flex flex-col gap-1 rounded-xl p-3 text-left transition-all"
                              style={{ background: sel ? `${color}10` : bgCard, border: `1px solid ${sel ? `${color}35` : border}` }}
                            >
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color, background: `${color}18` }}>{label}</span>
                              <span className="text-[11px] leading-snug" style={{ color: textMid }}>{desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="button" onClick={() => setStep(2)} disabled={!canStep2}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                style={{ background: "#2f8f45" }}
              >
                Continue <ArrowRight size={15} weight="bold" />
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && selectedType && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] transition" style={{ color: textMid }}>
                  <ArrowLeft size={13} /> Back
                </button>
                <span style={{ color: border }}>·</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ background: `${selectedType.color}12`, color: selectedType.color, border: `1px solid ${selectedType.color}28` }}>
                  <selectedType.Icon size={12} weight="fill" />
                  {selectedType.label}{type === "bug" && severity && ` · ${severity}`}
                </span>
              </div>

              {/* Page URL — top of step so it sets context */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                  Page where it happened <span className="normal-case font-normal" style={{ color: textMute }}>(paste the URL)</span>
                </label>
                <input type="url" value={pageUrl} onChange={e => setPageUrl(e.target.value)}
                  placeholder="e.g. gooutside.club/home or /dashboard/rewards"
                  className={`${inputCls} h-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                  Title <span className="normal-case font-normal" style={{ color: textMute }}>(optional)</span>
                </label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="One-line summary" maxLength={120}
                  className={`${inputCls} h-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                  Description <span className="text-[#ef4444]">*</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={selectedType.placeholder} rows={5}
                  className={`${inputCls} resize-none py-3`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <p className="mt-1 text-right text-[11px]" style={{ color: message.length < 10 ? textMute : "#2f8f45" }}>
                  {message.length} chars{message.length < 10 && ` (${10 - message.length} more needed)`}
                </p>
              </div>

              {/* Steps + Expected/Actual (bug+ux) */}
              {(type === "bug" || type === "ux") && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                      Steps to reproduce <span className="normal-case font-normal" style={{ color: textMute }}>(recommended)</span>
                    </label>
                    <textarea value={stepsRepro} onChange={e => setStepsRepro(e.target.value)}
                      placeholder={"1. Go to /home\n2. Tap search\n3. Type 'afrobeats'\n→ Infinite spinner"}
                      rows={4} className={`${inputCls} resize-none py-3`} style={{ ...inputStyle, fontFamily: "inherit" }}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>Expected</label>
                      <textarea value={expected} onChange={e => setExpected(e.target.value)} placeholder="What should happen?"
                        rows={3} className={`${inputCls} resize-none py-3`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>Actual</label>
                      <textarea value={actual} onChange={e => setActual(e.target.value)} placeholder="What actually happened?"
                        rows={3} className={`${inputCls} resize-none py-3`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                </>
              )}

              {/* Star rating (pulse_check) */}
              {type === "pulse_check" && (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>Overall rating</label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition hover:scale-110"
                        style={{ background: rating >= n ? "rgba(245,158,11,0.12)" : bgCard, border: `1px solid ${rating >= n ? "rgba(245,158,11,0.35)" : border}` }}>
                        <Star weight={rating >= n ? "fill" : "regular"} style={{ color: rating >= n ? "#f59e0b" : textMute }} />
                      </button>
                    ))}
                    {rating > 0 && <span className="text-[13px] font-medium" style={{ color: "#f59e0b" }}>{["","Poor","Fair","Good","Great","Excellent"][rating]}</span>}
                  </div>
                </div>
              )}

              {/* Screenshot — right here on the details step */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                  Screenshot <span className="normal-case font-normal" style={{ color: textMute }}>(optional, max 10 MB)</span>
                </label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

                {!screenshot ? (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition hover:opacity-80"
                    style={{ background: bgCard, border: `1.5px dashed ${border}` }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(47,143,69,0.12)", color: "#2f8f45" }}>
                      <UploadSimple size={16} weight="bold" />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: dark ? "#c0c0c0" : "#374151" }}>Attach a screenshot</p>
                      <p className="text-[11px]" style={{ color: textMute }}>PNG, JPG, WebP — max 10 MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-xl" style={{ border: `1px solid rgba(47,143,69,0.35)` }}>
                    {previewUrl && <img src={previewUrl} alt="Screenshot preview" className="max-h-48 w-full object-cover" />}
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.04)", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#e5e7eb"}` }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} weight="fill" style={{ color: "#2f8f45" }} />
                        <span className="text-[12px] font-medium" style={{ color: textMid }}>{screenshot.name}</span>
                        <span className="text-[11px]" style={{ color: textMute }}>({(screenshot.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={removeShot}
                        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:opacity-70"
                        style={{ color: textMid }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  <Warning size={15} className="mt-0.5 shrink-0" />{error}
                </div>
              )}

              <button type="button" onClick={() => setStep(3)} disabled={!canStep3}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                style={{ background: "#2f8f45" }}>
                Continue <ArrowRight size={15} weight="bold" />
              </button>
            </motion.div>
          )}

          {/* ── Step 3: About you ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="space-y-4">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[13px] transition" style={{ color: textMid }}>
                <ArrowLeft size={13} /> Back
              </button>

              {/* Link / recording */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                  Link / recording <span className="normal-case font-normal" style={{ color: textMute }}>(optional — Loom, screen recording, GitHub issue)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textMute }}>
                    <LinkIcon size={15} />
                  </div>
                  <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://loom.com/share/... or https://github.com/..."
                    className={`${inputCls} h-11 pl-9`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Name + email */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                    Name <span className="normal-case font-normal" style={{ color: textMute }}>(optional)</span>
                  </label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Kofi Mensah" autoComplete="name"
                    className={`${inputCls} h-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: textMid }}>
                    Email <span className="normal-case font-normal" style={{ color: textMute }}>(optional)</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                    className={`${inputCls} h-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Browser info note */}
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: dark ? "rgba(59,130,246,0.07)" : "#eff6ff", border: `1px solid ${dark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}` }}>
                <Info size={14} style={{ color: "#3b82f6", marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: dark ? "#93c5fd" : "#1d4ed8" }}>
                  Browser info (device, OS, screen size) is attached automatically to help us reproduce issues.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  <Warning size={15} className="mt-0.5 shrink-0" />{error}
                </div>
              )}

              <button type="button" onClick={handleSubmit} disabled={!canStep3 || phase === "submitting"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                style={{ background: "#2f8f45" }}>
                {phase === "submitting" ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                ) : (
                  <>Send feedback <ArrowRight size={15} weight="bold" /></>
                )}
              </button>

              <p className="text-center text-[11px]" style={{ color: textMute }}>Sent directly to the GoOutside team. No spam, no third-party tracking.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-8 text-center">
        <p className="text-[12px]" style={{ color: textMute }}>
          © {new Date().getFullYear()} GoOutside · Alpha Program ·{" "}
          <Link href="/docs" className="underline transition hover:opacity-70">Testing Guide</Link>
        </p>
      </div>
    </div>
  );
}
