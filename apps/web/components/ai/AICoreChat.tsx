"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  ArrowUpIcon as ArrowUp,
  CalendarBlankIcon as CalendarBlank,
  CalendarPlusIcon as CalendarPlus,
  CopyIcon as Copy,
  MagnifyingGlassIcon as MagnifyingGlass,
  SparkleIcon as Sparkle,
  TrendUpIcon as TrendUp,
  UsersIcon as Users,
  CurrencyCircleDollarIcon as CurrencyCircleDollar,
  CheckIcon as Check,
  ArrowClockwiseIcon as ArrowClockwise,
  MapPinIcon as MapPin,
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
  price_label?: string | null;
  ticket_price_ghs?: number | null;
  short_description?: string | null;
  venues?: { name?: string; city?: string } | Array<{ name?: string; city?: string }> | null;
  ticket_types?: Array<{ price?: number; is_active?: boolean }> | null;
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
  streaming?: boolean;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  picks: AiPick[] | null;
  follow_ups: string[] | null;
  tool_names_used?: string[] | null;
};

// ─── Starter icon cycle (assigned by index) ──────────────────────────────────

const STARTER_ICONS = [CalendarBlank, CurrencyCircleDollar, TrendUp, Users, Sparkle, MagnifyingGlass];

const FALLBACK_STARTERS = [
  "What's on tonight in Accra?",
  "Events under GHS 100 this weekend",
  "Live music near Osu",
  "What are my friends going to?",
  "Free events in Accra",
  "What's trending right now",
];

const TOOL_LABELS: Record<string, string> = {
  search_events:        "Searched events",
  get_budget_options:   "Checked budget",
  get_trending_events:  "Got trending",
  get_user_profile:     "Loaded your profile",
  get_event_details:    "Got event details",
  get_friends_activity: "Checked friends",
  get_organizer_events: "Found organizer",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" });
}

function getVenue(ev: AiEvent | null): string | null {
  if (!ev) return null;
  if (ev.venue_name) return ev.venue_name;
  const v = Array.isArray(ev.venues) ? ev.venues[0] : ev.venues;
  return v?.name ?? ev.city ?? null;
}

function getPrice(ev: AiEvent | null): string | null {
  if (!ev) return null;
  if (ev.price_label) return ev.price_label;
  if (ev.ticket_price_ghs !== undefined && ev.ticket_price_ghs !== null) {
    return ev.ticket_price_ghs === 0 ? "Free" : `GHS ${ev.ticket_price_ghs}`;
  }
  const tickets = ev.ticket_types;
  if (tickets?.length) {
    const active = tickets.filter(t => t.is_active !== false).map(t => t.price ?? 0);
    if (active.length) {
      const min = Math.min(...active);
      return min === 0 ? "Free" : `GHS ${min}`;
    }
  }
  return null;
}

function eventHref(ev: AiEvent | null, fallback: string) {
  if (ev?.href) return ev.href;
  if (ev?.slug) return `/events/${ev.slug}`;
  return `/events/${fallback}`;
}

function googleCalendarUrl(ev: AiEvent | null, title: string): string | null {
  if (!ev?.start_datetime) return null;
  const start = new Date(ev.start_datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3h estimate
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const venue = getVenue(ev);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title ?? title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(venue ? { location: venue } : {}),
    ...(ev.short_description ? { details: ev.short_description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Event Pick Card ──────────────────────────────────────────────────────────

function EventCard({ pick }: { pick: AiPick }) {
  const ev = pick.event;
  const date = fmtDate(ev?.start_datetime);
  const venue = getVenue(ev);
  const price = getPrice(ev);
  const calUrl = googleCalendarUrl(ev, pick.title);

  return (
    <div className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--bg-card)]">
      <Link
        className="flex items-start gap-3 p-3.5 pr-[3.25rem]"
        href={eventHref(ev, pick.event_id)}
      >
        <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--bg-muted)]">
          {ev?.banner_url ? (
            <Image alt={ev.title ?? pick.title} className="object-cover" fill sizes="52px" src={ev.banner_url} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sparkle size={16} weight="fill" className="text-[var(--brand)]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">
            {ev?.title ?? pick.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[var(--text-secondary)]">
            {date && (
              <span className="inline-flex items-center gap-1">
                <CalendarBlank size={10} weight="fill" />
                {date}
              </span>
            )}
            {venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={10} weight="fill" />
                {venue}
              </span>
            )}
            {price && (
              <span className={cn("font-semibold", price === "Free" ? "text-emerald-500" : "text-[var(--brand)]")}>
                {price}
              </span>
            )}
          </div>
          {pick.reason && (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.5] text-[var(--text-tertiary)]">{pick.reason}</p>
          )}
        </div>
      </Link>

      {/* Actions row */}
      <div className="absolute right-3 top-3 flex flex-col items-center gap-1.5">
        <Link
          href={eventHref(ev, pick.event_id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--brand)]"
          title="View event"
        >
          <ArrowRight size={13} weight="bold" />
        </Link>
        {calUrl && (
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-emerald-500"
            title="Add to Google Calendar"
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarPlus size={13} weight="bold" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Loaders ─────────────────────────────────────────────────────────────────

function ToolsLoader({ names }: { names: string[] }) {
  return (
    <div className="space-y-2">
      {names.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {names.map((t) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/20 bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]"
            >
              <Sparkle size={8} weight="fill" />
              {TOOL_LABELS[t] ?? t.replace(/_/g, " ")}
            </motion.span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 py-1">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]">
          <Sparkle size={12} weight="fill" className="text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"
              style={{ animation: "ai-pulse 1.1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      type="button"
      title="Copy"
    >
      {done
        ? <Check size={11} weight="bold" className="text-[var(--brand)]" />
        : <Copy size={11} weight="bold" />}
    </button>
  );
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-tr-[6px] bg-[var(--brand)] px-4 py-3 text-white shadow-[0_4px_16px_rgba(var(--brand-rgb),0.18)]">
        <p className="text-sm leading-relaxed">{content}</p>
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
  onFollowUp: (t: string) => void;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-3">
      {message.toolNamesUsed?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {message.toolNamesUsed.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/20 bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]"
            >
              <Sparkle size={8} weight="fill" />
              {TOOL_LABELS[t] ?? t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      <div className="group relative">
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {message.content}
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-[var(--brand)]" />
          )}
        </p>
        {!message.streaming && message.content && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <CopyBtn text={message.content} />
            {onRetry && (
              <button
                className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
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

      {!message.streaming && message.picks?.length ? (
        <div className="grid gap-2.5">
          {message.picks.map((p) => <EventCard key={p.event_id} pick={p} />)}
        </div>
      ) : null}

      {!message.streaming && message.followUps?.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {message.followUps.map((f) => (
            <button
              key={f}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
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
  initialPrompt,
  autoSendInitialPrompt = false,
  onInitialPromptConsumed,
}: {
  activeChatId?: string | null;
  compact?: boolean;
  onChatIdChange?: (id: string | null) => void;
  initialPrompt?: string;
  autoSendInitialPrompt?: boolean;
  onInitialPromptConsumed?: () => void;
}) {
  const [chatId, setChatId] = useState<string | null>(activeChatId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [starters, setStarters] = useState<string[]>(FALLBACK_STARTERS);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMsg = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  // Ref guard prevents double-fire in React StrictMode and ensures we only
  // auto-send the initial prompt once even if the component re-renders.
  const initialPromptFiredRef = useRef(false);

  useEffect(() => { setChatId(activeChatId ?? null); }, [activeChatId]);

  useEffect(() => {
    fetch("/api/ai/suggestions")
      .then((r) => r.json())
      .then((data: { suggestions?: string[] }) => {
        if (data.suggestions?.length) setStarters(data.suggestions);
      })
      .catch(() => undefined);
  }, []);

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
  }, [messages, loading, activeTools]);

  // Auto-send or prefill the initial prompt from URL handoff (e.g. /ai?prompt=...&autosend=1)
  useEffect(() => {
    if (!initialPrompt || initialPromptFiredRef.current) return;
    // Don't fire if an existing chat is being loaded — wait until messages settle
    if (activeChatId) return;
    initialPromptFiredRef.current = true;
    if (autoSendInitialPrompt) {
      // Small delay so the component is fully mounted and streaming is ready
      const t = setTimeout(() => {
        sendMessage(initialPrompt);
        onInitialPromptConsumed?.();
      }, 80);
      return () => clearTimeout(t);
    } else {
      setInput(initialPrompt);
      onInitialPromptConsumed?.();
    }
    // sendMessage is stable via useCallback; including it would cause infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, autoSendInitialPrompt, activeChatId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    lastUserMsg.current = trimmed;
    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
      { id: assistantMsgId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setLoading(true);
    setActiveTools([]);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, chat_id: chatId ?? undefined }),
        signal: abort.signal,
      });

      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const handleEvent = (raw: string) => {
        if (!raw.startsWith("data: ")) return;
        let ev: Record<string, unknown>;
        try { ev = JSON.parse(raw.slice(6)) as Record<string, unknown>; } catch { return; }
        const t = ev.type as string;

        if (t === "chat_id") {
          const id = ev.chat_id as string | null;
          if (id && id !== chatId) { setChatId(id); onChatIdChange?.(id); }
        } else if (t === "tools") {
          const names = (ev.names as string[]) ?? [];
          setActiveTools(names);
          setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, toolNamesUsed: names } : m));
        } else if (t === "token") {
          setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + (ev.text as string) } : m));
        } else if (t === "done") {
          const picks = (ev.picks ?? []) as AiPick[];
          const followUps = (ev.followUps ?? []) as string[];
          const cid = ev.chat_id as string | null;
          // Don't call onChatIdChange again — chat_id event already handled it.
          // Just ensure local state is in sync.
          if (cid) setChatId((prev) => prev ?? cid);
          setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, streaming: false, picks, followUps } : m));
          setActiveTools([]);
          setLoading(false);
        } else if (t === "error") {
          setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: (ev.message as string) || "Something went wrong.", streaming: false } : m));
          setActiveTools([]);
          setLoading(false);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) if (line.startsWith("data: ")) handleEvent(line);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: "Couldn't reach the server. Try again.", streaming: false } : m));
      setActiveTools([]);
      setLoading(false);
    }
  }, [chatId, loading, onChatIdChange]);

  const retryLast = useCallback(() => {
    if (!lastUserMsg.current) return;
    setMessages((prev) => prev.slice(0, -2));
    sendMessage(lastUserMsg.current);
  }, [sendMessage]);

  const hasMessages = messages.length > 0;
  const shellClass = compact
    ? "h-[520px] max-h-[calc(100svh-140px)] rounded-[22px] border border-[var(--border-subtle)]"
    : "h-full";

  return (
    <div className={cn("flex flex-col bg-[var(--bg-page)]", shellClass)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {!hasMessages ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--brand)]">
                <Sparkle size={22} weight="fill" className="text-white" />
              </div>
              <h2 className="font-display text-[1.55rem] italic leading-snug text-[var(--text-primary)]">
                What are you planning?
              </h2>
              <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Ask about events, budget, or what&apos;s happening. Pulls live data from GoOutside.
              </p>
              <div className="mt-6 grid max-w-[480px] grid-cols-2 gap-2">
                {starters.map((label, i) => {
                  const Icon = STARTER_ICONS[i % STARTER_ICONS.length];
                  return (
                    <button
                      key={label}
                      className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3 text-left text-[12px] leading-snug text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                      onClick={() => sendMessage(label)}
                      type="button"
                    >
                      <Icon size={13} className="mt-0.5 shrink-0 text-[var(--brand)]" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-10 md:px-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {msg.role === "user" ? (
                    <UserBubble content={msg.content} />
                  ) : msg.streaming && !msg.content ? (
                    <ToolsLoader names={activeTools} />
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

      <div className={cn(
        "shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 pb-4 pt-3 md:px-6",
        compact && "pb-3 pt-2",
      )}>
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-1 py-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow focus-within:border-[var(--brand)]/40 focus-within:shadow-[0_4px_20px_rgba(var(--brand-rgb),0.08)]">
            <textarea
              ref={textareaRef}
              className="min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about events, budget, or what's happening..."
              rows={1}
              value={input}
            />
            <button
              aria-label="Send"
              className={cn(
                "mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim()
                  ? "bg-[var(--brand)] text-white shadow-[0_2px_8px_rgba(var(--brand-rgb),0.3)] hover:bg-[var(--brand-hover)]"
                  : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
              )}
              disabled={loading || !input.trim()}
              onClick={() => sendMessage(input)}
              type="button"
            >
              {loading ? (
                <span
                  className="h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-t-transparent"
                  style={{ animation: "ai-spin 0.6s linear infinite" }}
                />
              ) : (
                <ArrowUp size={14} weight="bold" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--text-tertiary)]">
            Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ai-pulse { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-3.5px);opacity:1} }
        @keyframes ai-spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default AICoreChat;
