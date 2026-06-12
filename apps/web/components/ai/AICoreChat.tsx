"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  CalendarBlank,
  Copy,
  MagnifyingGlass,
  PaperPlaneTilt,
  Sparkle,
  TrendUp,
  Users,
  CurrencyCircleDollar,
  Check,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { cn } from "../../lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type AiEvent = {
  id?: string;
  title?: string;
  slug?: string;
  href?: string;
  banner_url?: string | null;
  start_datetime?: string | null;
  venue_name?: string | null;
  city?: string | null;
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
  toolNamesUsed?: string[];
  pending?: boolean;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  picks: AiPick[] | null;
  follow_ups: string[] | null;
  tool_names_used?: string[] | null;
};

type AskResponse = {
  chat_id: string | null;
  message: string;
  picks: AiPick[];
  followUps: string[];
  tool_names_used?: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STARTERS = [
  { label: "What's happening tonight in Accra?", icon: CalendarBlank },
  { label: "Events under GHS 100 this weekend", icon: CurrencyCircleDollar },
  { label: "Live music near Osu", icon: TrendUp },
  { label: "What are my friends going to?", icon: Users },
  { label: "Free events in Accra", icon: Sparkle },
  { label: "What's trending right now", icon: MagnifyingGlass },
];

const TOOL_LABELS: Record<string, string> = {
  search_events: "Searched events",
  get_budget_options: "Checked budget",
  get_trending_events: "Got trending",
  get_user_profile: "Loaded profile",
  get_event_details: "Got event details",
  get_friends_activity: "Checked friends",
  get_organizer_events: "Found organizer",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCard({ pick }: { pick: AiPick }) {
  const ev = pick.event;
  const date = formatDate(ev?.start_datetime);
  const venue = ev?.venue_name ?? ev?.city ?? null;
  const price = ev?.price_label ?? (ev?.ticket_price_ghs ? `GHS ${ev.ticket_price_ghs}` : null);

  return (
    <Link
      className="group flex items-start gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--brand)]/40 hover:bg-[var(--bg-card)]"
      href={eventHref(ev, pick.event_id)}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[var(--bg-muted)]">
        {ev?.banner_url ? (
          <Image alt={ev.title ?? pick.title} className="object-cover" fill sizes="48px" src={ev.banner_url} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkle size={16} weight="fill" className="text-[var(--brand)]" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{ev?.title ?? pick.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-tertiary)]">
          {date && <span className="inline-flex items-center gap-1"><CalendarBlank size={10} weight="fill" />{date}</span>}
          {venue && <span className="truncate">{venue}</span>}
          {price && <span className="font-semibold text-[var(--brand)]">{price}</span>}
        </div>
        {pick.reason && (
          <p className="mt-1 line-clamp-1 text-[11px] text-[var(--text-secondary)]">{pick.reason}</p>
        )}
      </div>
      <ArrowRight size={14} weight="bold" className="mt-0.5 shrink-0 text-[var(--text-tertiary)] transition group-hover:text-[var(--brand)]" />
    </Link>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"
          style={{ animation: "ai-dot 1.05s ease-in-out infinite", animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }}
      type="button"
      title="Copy"
    >
      {done ? <Check size={11} weight="bold" className="text-[var(--brand)]" /> : <Copy size={11} weight="bold" />}
    </button>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-[18px] rounded-tr-[5px] bg-[var(--brand)] px-4 py-2.5 text-white">
        <p className="text-[13px] leading-[1.65]">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({
  message,
  onFollowUp,
  onRetry,
}: {
  message: ChatMessage;
  onFollowUp: (text: string) => void;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-2.5">
      {/* Tool badges */}
      {message.toolNamesUsed?.length ? (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {message.toolNamesUsed.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]"
            >
              <Sparkle size={8} weight="fill" />
              {TOOL_LABELS[t] ?? t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      {/* Message bubble */}
      <div className="group relative">
        <div className="rounded-[18px] rounded-tl-[5px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
          {message.pending ? (
            <TypingDots />
          ) : (
            <p className="whitespace-pre-wrap text-[13px] leading-[1.75] text-[var(--text-primary)]">
              {message.content}
            </p>
          )}
        </div>

        {!message.pending && (
          <div className="absolute -bottom-5 left-1 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <CopyBtn text={message.content} />
            {onRetry && (
              <button
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
                onClick={onRetry}
                type="button"
                title="Retry"
              >
                <ArrowClockwise size={11} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Event picks */}
      {message.picks?.length ? (
        <div className="grid gap-2">
          {message.picks.map((p) => <EventCard key={p.event_id} pick={p} />)}
        </div>
      ) : null}

      {/* Follow-ups */}
      {message.followUps?.length ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.followUps.map((f) => (
            <button
              key={f}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]"
              onClick={() => onFollowUp(f)}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMsg = useRef("");

  useEffect(() => { setChatId(activeChatId ?? null); }, [activeChatId]);

  useEffect(() => {
    let dead = false;
    if (activeChatId) {
      fetch(`/api/ai/chats/${activeChatId}`)
        .then((r) => r.json())
        .then((data: { messages: StoredMessage[] }) => {
          if (dead) return;
          setMessages(
            data.messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content ?? "",
                picks: m.picks ?? undefined,
                followUps: m.follow_ups ?? undefined,
                toolNamesUsed: m.tool_names_used ?? undefined,
              })),
          );
        })
        .catch(() => undefined);
    } else {
      setMessages([]);
    }
    return () => { dead = true; };
  }, [activeChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    lastUserMsg.current = trimmed;
    const pendingId = `p-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: trimmed },
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
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: `a-${Date.now()}`,
                role: "assistant" as const,
                content: data.message,
                picks: data.picks,
                followUps: data.followUps,
                toolNamesUsed: data.tool_names_used,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: `e-${Date.now()}`, role: "assistant" as const, content: "Something went wrong. Check your Groq API key and try again." }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [chatId, loading, onChatIdChange]);

  const retryLast = useCallback(() => {
    if (!lastUserMsg.current) return;
    setMessages((prev) => prev.slice(0, -2));
    sendMessage(lastUserMsg.current);
  }, [sendMessage]);

  const hasMessages = messages.length > 0;
  const shellHeight = compact ? "h-[520px] max-h-[calc(100svh-140px)]" : "h-[calc(100svh-160px)] min-h-[520px]";

  return (
    <section className={cn("flex flex-col overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)]", shellHeight)}>
      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {!hasMessages ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center px-6 text-center"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--brand-dim)]">
                <Sparkle size={24} weight="fill" className="text-[var(--brand)]" />
              </div>
              <h2 className="font-display text-[1.65rem] italic leading-tight text-[var(--text-primary)]">
                What are you planning?
              </h2>
              <p className="mt-2 max-w-[340px] text-[13px] leading-6 text-[var(--text-secondary)]">
                Ask about events, budgets, friends&apos; plans, or trending spots across Ghana.
              </p>
              <div className="mt-7 grid max-w-[520px] grid-cols-2 gap-2 sm:grid-cols-3">
                {STARTERS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      className="flex items-start gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-left text-[12px] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--text-primary)]"
                      onClick={() => sendMessage(s.label)}
                      type="button"
                    >
                      <Icon size={13} className="mt-0.5 shrink-0 text-[var(--brand)]" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5 px-5 py-5 pb-8">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  {msg.role === "user" ? (
                    <UserBubble content={msg.content} />
                  ) : (
                    <AssistantBubble
                      message={msg}
                      onFollowUp={sendMessage}
                      onRetry={i === messages.length - 1 && !loading ? retryLast : undefined}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="flex items-end gap-2 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-1 py-1">
          <textarea
            ref={textareaRef}
            className="min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask for events, a budget, or a vibe..."
            rows={1}
            value={input}
          />
          <button
            aria-label="Send"
            className={cn(
              "mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition",
              input.trim()
                ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]",
            )}
            disabled={loading || !input.trim()}
            onClick={() => sendMessage(input)}
            type="button"
          >
            {loading ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" style={{ animation: "ai-spin 0.65s linear infinite" }} />
            ) : (
              <ArrowUp size={15} weight="bold" />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ai-dot { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-4px);opacity:1} }
        @keyframes ai-spin { to{transform:rotate(360deg)} }
      `}</style>
    </section>
  );
}

export default AICoreChat;
