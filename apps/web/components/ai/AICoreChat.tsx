"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarBlank,
  Clock,
  PaperPlaneTilt,
  Sparkle,
} from "@phosphor-icons/react";

type AiEvent = {
  id?: string;
  title?: string;
  slug?: string;
  href?: string;
  banner_url?: string | null;
  start_datetime?: string | null;
  venue?: string | null;
  venue_name?: string | null;
  city?: string | null;
  category?: string | null;
  category_name?: string | null;
  price_label?: string | null;
  ticket_price_ghs?: number | null;
  short_description?: string | null;
};

type AiPick = {
  event_id: string;
  title: string;
  reason: string;
  event: AiEvent | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  picks?: AiPick[];
  followUps?: string[];
  pending?: boolean;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  picks: AiPick[] | null;
  follow_ups: string[] | null;
};

type AskResponse = {
  chat_id: string | null;
  message: string;
  picks: AiPick[];
  followUps: string[];
};

const STARTERS = [
  "What should I do tonight in Accra?",
  "Find events under GHS 100 this weekend",
  "Show me chill places with music",
];

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function eventHref(event: AiEvent | null, fallbackId: string) {
  if (event?.href) return event.href;
  if (event?.slug) return `/events/${event.slug}`;
  return `/events/${fallbackId}`;
}

function EventPickCard({ pick }: { pick: AiPick }) {
  const event = pick.event;
  const date = formatDate(event?.start_datetime);
  const venue = event?.venue_name ?? event?.venue ?? event?.city ?? "GoOutside";
  const price = event?.price_label ?? (event?.ticket_price_ghs ? `GHS ${event.ticket_price_ghs}` : "View details");

  return (
    <Link
      className="group grid grid-cols-[64px_1fr_auto] gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-left transition hover:border-[var(--brand)]/45 hover:bg-[var(--bg-card)]"
      href={eventHref(event, pick.event_id)}
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-[14px] bg-[var(--bg-muted)]">
        {event?.banner_url ? (
          <Image
            alt={event.title ?? pick.title}
            className="object-cover"
            fill
            sizes="64px"
            src={event.banner_url}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--brand)]">
            <Sparkle size={20} weight="fill" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
          {event?.title ?? pick.title}
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-tertiary)]">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarBlank size={11} weight="fill" />
              {date}
            </span>
          ) : null}
          <span className="truncate">{venue}</span>
        </div>
        <p className="mt-1 text-[12px] font-semibold text-[var(--brand)]">{price}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--text-secondary)]">
          {pick.reason}
        </p>
      </div>
      <ArrowRight
        className="self-center text-[var(--text-tertiary)] transition group-hover:text-[var(--brand)]"
        size={16}
        weight="bold"
      />
    </Link>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"
          key={i}
          style={{
            animation: "ai-dot-bounce 1.05s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

function Bubble({ message, onFollowUp }: { message: ChatMessage; onFollowUp: (text: string) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-[20px] rounded-tr-md bg-[var(--brand)] px-4 py-3 text-white shadow-[0_10px_26px_rgba(var(--brand-rgb),0.22)]">
          <p className="text-[13px] font-medium leading-6">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white">
        <Sparkle size={15} weight="fill" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="max-w-[92%] rounded-[20px] rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
          {message.pending ? (
            <TypingDots />
          ) : (
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-[var(--text-primary)]">
              {message.content}
            </p>
          )}
        </div>

        {message.picks?.length ? (
          <div className="grid gap-2">
            {message.picks.map((pick) => (
              <EventPickCard key={pick.event_id} pick={pick} />
            ))}
          </div>
        ) : null}

        {message.followUps?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.followUps.map((followUp) => (
              <button
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/45 hover:text-[var(--text-primary)]"
                key={followUp}
                onClick={() => onFollowUp(followUp)}
                type="button"
              >
                {followUp}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AICoreChat({
  activeChatId,
  compact = false,
  onChatIdChange,
}: {
  activeChatId?: string | null;
  compact?: boolean;
  onChatIdChange?: (chatId: string | null) => void;
}) {
  const [chatId, setChatId] = useState<string | null>(activeChatId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatId(activeChatId ?? null);
  }, [activeChatId]);

  useEffect(() => {
    let cancelled = false;

    async function loadChat(id: string) {
      const res = await fetch(`/api/ai/chats/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: StoredMessage[] };
      if (cancelled) return;
      setMessages(
        data.messages
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content ?? "",
            picks: message.picks ?? undefined,
            followUps: message.follow_ups ?? undefined,
          })),
      );
    }

    if (activeChatId) {
      loadChat(activeChatId).catch(() => undefined);
    } else {
      setMessages([]);
    }

    return () => {
      cancelled = true;
    };
  }, [activeChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const hasMessages = messages.length > 0;
  const shellClass = useMemo(
    () =>
      compact
        ? "h-[540px] max-h-[calc(100svh-140px)]"
        : "h-[calc(100svh-170px)] min-h-[560px]",
    [compact],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const pendingId = `pending-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: trimmed },
        { id: pendingId, role: "assistant", content: "", pending: true },
      ]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, chat_id: chatId ?? undefined }),
        });
        const data = (await res.json()) as AskResponse;

        if (data.chat_id && data.chat_id !== chatId) {
          setChatId(data.chat_id);
          onChatIdChange?.(data.chat_id);
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  id: `assistant-${Date.now()}`,
                  role: "assistant",
                  content: data.message,
                  picks: data.picks,
                  followUps: data.followUps,
                }
              : message,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  id: `error-${Date.now()}`,
                  role: "assistant",
                  content: "I couldn't reach the AI right now. Check your Groq key and try again.",
                }
              : message,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [chatId, loading, onChatIdChange],
  );

  return (
    <section className={`flex overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_18px_60px_rgba(0,0,0,0.08)] ${shellClass}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 md:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                <Sparkle size={15} weight="fill" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">GoOutside AI</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Live event tools, budgets, and recommendations</p>
              </div>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-[var(--brand-dim)] px-3 py-1 text-[11px] font-bold text-[var(--brand)] sm:inline-flex">
            <Clock size={12} weight="bold" />
            AI Core
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-5">
          <AnimatePresence initial={false}>
            {!hasMessages ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex h-full flex-col items-center justify-center text-center"
                initial={{ opacity: 0, y: 8 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--brand-dim)] text-[var(--brand)]">
                  <Sparkle size={24} weight="fill" />
                </div>
                <h2 className="mt-5 font-display text-3xl italic text-[var(--text-primary)]">
                  Plan your next move
                </h2>
                <p className="mt-3 max-w-[420px] text-sm leading-6 text-[var(--text-secondary)]">
                  Ask for events by mood, budget, day, area, or who you are going with.
                </p>
                <div className="mt-6 flex max-w-[520px] flex-wrap justify-center gap-2">
                  {STARTERS.map((starter) => (
                    <button
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/45 hover:text-[var(--text-primary)]"
                      key={starter}
                      onClick={() => sendMessage(starter)}
                      type="button"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 8 }}
                    key={message.id}
                    transition={{ duration: 0.18 }}
                  >
                    <Bubble message={message} onFollowUp={sendMessage} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-3 md:px-4"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-[16px] bg-[var(--bg-muted)] px-4 py-3 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-60"
            disabled={loading}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a plan, budget, vibe, or event..."
            value={input}
          />
          <button
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--brand)] text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || !input.trim()}
            type="submit"
          >
            <PaperPlaneTilt size={17} weight="fill" />
          </button>
        </form>
      </div>
      <style>{`
        @keyframes ai-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.38; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

export default AICoreChat;
