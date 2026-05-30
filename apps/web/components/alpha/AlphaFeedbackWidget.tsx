"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, ChatCircleDots } from "@phosphor-icons/react";
import { FEEDBACK_TYPES, collectBrowserInfo, getCaptureLogs, type AlphaFeedbackType } from "../../lib/alpha";

type Step = "type" | "detail" | "submitting" | "done";

async function captureScreenshot(): Promise<string | null> {
  try {
    // Dynamic import to avoid SSR issues and keep the initial bundle small
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(document.body, {
      allowTaint: true,
      useCORS: true,
      scale: 0.5,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function AlphaFeedbackWidget() {
  const [open, setOpen]             = useState(false);
  const [step, setStep]             = useState<Step>("type");
  const [type, setType]             = useState<AlphaFeedbackType | null>(null);
  const [message, setMessage]       = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing]   = useState(false);
  const [includeShot, setIncludeShot] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    setStep("type");
    setType(null);
    setMessage("");
    setIncludeShot(true);
    setCapturing(true);
    const shot = await captureScreenshot();
    setScreenshot(shot);
    setCapturing(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setStep("type");
      setType(null);
      setMessage("");
      setScreenshot(null);
    }, 300);
  }, []);

  const handleSelectType = useCallback((t: AlphaFeedbackType) => {
    setType(t);
    setStep("detail");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!type || !message.trim()) return;
    setStep("submitting");

    await fetch("/api/alpha/feedback", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        message: message.trim(),
        screenshotDataUrl: includeShot ? screenshot : undefined,
        pageUrl:     window.location.href,
        browserInfo: collectBrowserInfo(),
        consoleLogs: getCaptureLogs(),
      }),
    });

    setStep("done");
    setTimeout(handleClose, 2200);
  }, [type, message, screenshot, includeShot, handleClose]);

  const selectedType = FEEDBACK_TYPES.find((f) => f.key === type);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleOpen}
            className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full px-3.5 py-2.5 shadow-xl transition-transform active:scale-95 md:bottom-6"
            style={{
              background:   "#0f110f",
              border:       "1px solid rgba(95,191,42,0.3)",
              color:        "#5FBF2A",
              boxShadow:    "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(95,191,42,0.1)",
            }}
            aria-label="Share feedback"
          >
            <ChatCircleDots size={16} weight="fill" />
            <span className="text-xs font-semibold">Feedback</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal backdrop + sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-[24px] pb-safe"
              style={{ background: "#141414", border: "1px solid #222" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/10" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                {step === "detail" ? (
                  <button
                    onClick={() => setStep("type")}
                    className="flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white/80"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <p className="text-sm font-semibold text-white">Share feedback</p>
                )}
                <button
                  onClick={handleClose}
                  className="rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 pb-6">
                <AnimatePresence mode="wait">

                  {/* Step: type selection */}
                  {step === "type" && (
                    <motion.div
                      key="type-step"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p className="mb-4 text-sm text-white/50">What kind of feedback?</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {FEEDBACK_TYPES.map((ft) => (
                          <button
                            key={ft.key}
                            onClick={() => handleSelectType(ft.key)}
                            className="flex flex-col items-start gap-1.5 rounded-xl p-4 text-left transition hover:brightness-110 active:scale-[0.97]"
                            style={{ background: "#1e1e1e", border: `1px solid ${ft.color}22` }}
                          >
                            <span className="text-xl">{ft.emoji}</span>
                            <span className="text-[13px] font-semibold text-white">{ft.label}</span>
                            <span className="text-[11px] text-white/40">{ft.description}</span>
                          </button>
                        ))}
                      </div>

                      {/* Screenshot preview (taken in background) */}
                      {capturing && (
                        <p className="mt-4 text-center text-xs text-white/30">Capturing screenshot…</p>
                      )}
                    </motion.div>
                  )}

                  {/* Step: detail */}
                  {step === "detail" && selectedType && (
                    <motion.div
                      key="detail-step"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-lg">{selectedType.emoji}</span>
                        <span className="text-sm font-semibold text-white">{selectedType.label}</span>
                      </div>

                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          type === "bug"     ? "What happened? What did you expect?" :
                          type === "ux"      ? "What felt confusing or off?" :
                          type === "feature" ? "What would you love to see?" :
                          "What made you smile?"
                        }
                        rows={4}
                        className="w-full resize-none rounded-xl bg-[#1e1e1e] px-4 py-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition focus:ring-white/25"
                        style={{ caretColor: "#5FBF2A" }}
                      />

                      {/* Screenshot toggle */}
                      {screenshot && (
                        <div className="mt-3 flex items-start gap-3">
                          <img
                            src={screenshot}
                            alt="Screenshot"
                            className="h-14 w-20 flex-none rounded-lg object-cover opacity-70"
                          />
                          <div className="flex flex-1 flex-col gap-1">
                            <p className="text-[12px] font-medium text-white/60">Screenshot attached</p>
                            <button
                              onClick={() => setIncludeShot((v) => !v)}
                              className="text-left text-[11px] text-white/30 underline transition hover:text-white/50"
                            >
                              {includeShot ? "Remove screenshot" : "Include screenshot"}
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40"
                        style={{ background: "#5FBF2A" }}
                      >
                        Send feedback
                      </button>
                    </motion.div>
                  )}

                  {/* Step: submitting */}
                  {step === "submitting" && (
                    <motion.div
                      key="submitting-step"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-8 text-white/50"
                    >
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                      <p className="text-sm">Sending…</p>
                    </motion.div>
                  )}

                  {/* Step: done */}
                  {step === "done" && (
                    <motion.div
                      key="done-step"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-8 text-center"
                    >
                      <span className="text-4xl">🙌</span>
                      <p className="text-base font-semibold text-white">Got it, thanks.</p>
                      <p className="text-sm text-white/40">Nana will see this shortly.</p>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
