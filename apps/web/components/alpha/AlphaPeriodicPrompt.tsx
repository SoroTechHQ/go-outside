"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { collectBrowserInfo } from "../../lib/alpha";

const PROMPT_INTERVAL_MS  = 5 * 60 * 1000; // 5 minutes
const MAX_PROMPTS_SESSION = 3;
const SESSION_KEY         = "gooutside_alpha_prompts";

const MESSAGES = [
  "How's it going so far?",
  "Anything feel off?",
  "Found anything you love?",
];

function getPromptCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(sessionStorage.getItem(SESSION_KEY) ?? "0", 10);
}

function incrementPromptCount() {
  const next = getPromptCount() + 1;
  sessionStorage.setItem(SESSION_KEY, String(next));
}

export function AlphaPeriodicPrompt() {
  const [visible, setVisible] = useState(false);
  const [rating,  setRating]  = useState<number | null>(null);
  const [note,    setNote]    = useState("");
  const [sent,    setSent]    = useState(false);
  const promptCount = useRef(getPromptCount());
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (promptCount.current >= MAX_PROMPTS_SESSION) return;

    timerRef.current = setTimeout(() => {
      if (getPromptCount() < MAX_PROMPTS_SESSION) {
        setVisible(true);
        setRating(null);
        setNote("");
        setSent(false);
      }
    }, PROMPT_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    incrementPromptCount();
    promptCount.current += 1;

    // Schedule next if under limit
    if (promptCount.current < MAX_PROMPTS_SESSION) {
      timerRef.current = setTimeout(() => {
        setVisible(true);
        setRating(null);
        setNote("");
        setSent(false);
      }, PROMPT_INTERVAL_MS);
    }
  };

  const handleSend = async () => {
    if (!rating) return;
    setSent(true);

    await fetch("/api/alpha/feedback", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "pulse_check",
        rating,
        message:     note.trim() || `Pulse check: ${rating}/5`,
        pageUrl:     window.location.href,
        browserInfo: collectBrowserInfo(),
      }),
    });

    setTimeout(dismiss, 1500);
  };

  const messageIdx = Math.min(promptCount.current, MESSAGES.length - 1);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="fixed bottom-36 right-4 z-50 w-72 overflow-hidden rounded-2xl shadow-2xl md:bottom-20"
          style={{ background: "#141414", border: "1px solid #252525" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ background: "#5FBF2A" }}
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Alpha check-in</p>
            </div>
            <button onClick={dismiss} className="text-white/30 transition hover:text-white/60">
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pb-5">
            {!sent ? (
              <>
                <p className="mb-4 text-[15px] font-semibold text-white">
                  {MESSAGES[messageIdx]}
                </p>

                {/* Star rating */}
                <div className="mb-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className="text-2xl leading-none transition-transform hover:scale-110 active:scale-95"
                    >
                      {n <= (rating ?? 0) ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>

                {/* Optional note */}
                {rating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Anything specific? (optional)"
                      className="mb-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-white/20"
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                      onClick={handleSend}
                      className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                      style={{ background: "#5FBF2A" }}
                    >
                      Send
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-2 text-center text-sm text-white/60"
              >
                Thanks 🙌
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
