"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  PaperPlaneTilt,
  X,
  CalendarBlank,
  ArrowRight,
} from "@phosphor-icons/react";
import type { AssistantPick } from "../../lib/ai-assistant";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  picks?: AssistantPick[];
  followUps?: string[];
};

type ApiMessage = { role: "user" | "assistant"; content: string };

// ── Mini event card inside chat ───────────────────────────────────────────────

function ChatEventCard({ pick }: { pick: AssistantPick }) {
  const router = useRouter();
  const ev = pick.event;
  if (!ev) return null;

  const date = ev.start_datetime
    ? new Date(ev.start_datetime).toLocaleDateString("en-GH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <button
      type="button"
      onClick={() => router.push(ev.href)}
      className="group flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-left transition hover:border-[#5FBF2A]/40 hover:shadow-sm active:scale-[0.99] w-full"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
        {ev.banner_url && (
          <Image
            src={ev.banner_url}
            alt={ev.title}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[var(--text-primary)] line-clamp-1 leading-tight">
          {ev.title}
        </p>
        {date && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <CalendarBlank size={9} weight="fill" />
            {date}
          </p>
        )}
        <p className="mt-0.5 text-[11px] font-semibold text-[#5FBF2A]">{ev.price_label}</p>
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] line-clamp-1 leading-snug">
          {pick.reason}
        </p>
      </div>
      <ArrowRight
        size={13}
        className="shrink-0 self-center text-[var(--text-tertiary)] transition group-hover:text-[#5FBF2A]"
      />
    </button>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"
          style={{
            animation: "chat-dot-bounce 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({
  msg,
  onFollowUp,
}: {
  msg: ChatMessage;
  onFollowUp: (text: string) => void;
}) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-[#5FBF2A] px-4 py-2.5">
          <p className="text-[13px] font-medium text-white leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* AI header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3E9E1A] to-[#5FBF2A]">
          <Sparkle size={11} weight="fill" className="text-white" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          GoOutside AI
        </span>
      </div>

      {/* Message text */}
      <div className="ml-8 max-w-[85%] rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5">
        <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{msg.content}</p>
      </div>

      {/* Event picks */}
      {msg.picks && msg.picks.length > 0 && (
        <div className="ml-8 space-y-2">
          {msg.picks.map((pick) => (
            <ChatEventCard key={pick.event_id} pick={pick} />
          ))}
        </div>
      )}

      {/* Follow-up chips */}
      {msg.followUps && msg.followUps.length > 0 && (
        <div className="ml-8 flex flex-wrap gap-1.5">
          {msg.followUps.map((fu) => (
            <button
              key={fu}
              type="button"
              onClick={() => onFollowUp(fu)}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[11px] text-[var(--text-secondary)] transition hover:border-[#5FBF2A]/40 hover:text-[var(--text-primary)] active:scale-95"
            >
              {fu}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AIChatPanel({
  initialQuery,
  onDismiss,
}: {
  initialQuery: string;
  onDismiss?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // useRef prevents double-fire in React StrictMode (unmount/remount resets useState but not useRef)
  const hasFiredRef = useRef(false);
  const historyRef = useRef<ApiMessage[]>([]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const trimmed = text.trim();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const loadingMsg: ChatMessage = {
      id: `l-${Date.now()}`,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    historyRef.current = [...historyRef.current, { role: "user", content: trimmed }];

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyRef.current.slice(-8),
        }),
      });

      const data = (await res.json()) as {
        message: string;
        picks: AssistantPick[];
        followUps: string[];
      };

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.message,
        picks: data.picks,
        followUps: data.followUps,
      };

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: data.message },
      ];

      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMsg.id);
        return [...withoutLoading, assistantMsg];
      });
    } catch {
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMsg.id);
        return [
          ...withoutLoading,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Couldn't reach the AI right now. Try again in a moment.",
          },
        ];
      });
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loading]);

  // Fire initial query exactly once on mount (ref survives StrictMode remount)
  useEffect(() => {
    if (initialQuery && !hasFiredRef.current) {
      hasFiredRef.current = true;
      sendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  const handleFollowUp = (text: string) => sendMessage(text);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#3E9E1A] to-[#5FBF2A]">
            <Sparkle size={13} weight="fill" className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            AI Assistant
          </span>
          <span className="rounded-full bg-[#f0fae6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3E9E1A]">
            Personalized
          </span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="overflow-y-auto px-4 py-4 space-y-4"
        style={{ maxHeight: "calc(50svh - 56px - 60px)", minHeight: "160px" }}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 py-8 text-center"
            >
              <Sparkle size={28} className="text-[#5FBF2A]" weight="fill" />
              <p className="text-[13px] text-[var(--text-secondary)]">
                Ask me anything — I know your vibe.
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                "Show me free events tonight" · "Rooftop cocktails this weekend"
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.content === "" && msg.role === "assistant" ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3E9E1A] to-[#5FBF2A]">
                    <Sparkle size={11} weight="fill" className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5">
                    <TypingDots />
                  </div>
                </div>
              ) : (
                <Bubble msg={msg} onFollowUp={handleFollowUp} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up…"
          disabled={loading}
          className="flex-1 rounded-xl bg-[var(--bg-muted)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-60 caret-[#5FBF2A]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5FBF2A] text-white transition hover:bg-[#4da823] active:scale-95 disabled:opacity-50"
        >
          <PaperPlaneTilt size={15} weight="fill" />
        </button>
      </form>

      <style>{`
        @keyframes chat-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default AIChatPanel;
