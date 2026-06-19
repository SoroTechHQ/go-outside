"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  ArrowUpIcon as ArrowUp,
  CalendarBlankIcon as CalendarBlank,
  CopyIcon as Copy,
  MagnifyingGlassIcon as MagnifyingGlass,
  MapPinIcon as MapPin,
  NavigationArrowIcon as NavigationArrow,
  SparkleIcon as Sparkle,
  TicketIcon as TicketIcon,
  TrendUpIcon as TrendUp,
  UsersIcon as Users,
  CurrencyCircleDollarIcon as CurrencyCircleDollar,
  CheckIcon as Check,
  ArrowClockwiseIcon as ArrowClockwise,
  XIcon as X,
  CalendarIcon as CalendarIcon,
} from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { GetTicketModal, type EventForTicket } from "../tickets/GetTicketModal";
import type { TicketTier } from "../cart/CartContext";

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
  ticket_types?: Array<{ id?: string; name?: string; price?: number; price_type?: string; is_active?: boolean }> | null;
};

type AiPick = {
  event_id: string;
  title: string;
  reason: string;
  actions?: string[];
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

// ─── Starter icon cycle ───────────────────────────────────────────────────────

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
  get_user_calendar:    "Checked your calendar",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getVenue(ev: AiEvent | null): string | null {
  if (!ev) return null;
  if (ev.venue_name) return ev.venue_name;
  const v = Array.isArray(ev.venues) ? ev.venues[0] : ev.venues;
  return v?.name ?? null;
}

function getCity(ev: AiEvent | null): string | null {
  if (!ev) return null;
  if (ev.city) return ev.city;
  const v = Array.isArray(ev.venues) ? ev.venues[0] : ev.venues;
  return v?.city ?? null;
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

function googleMapsUrl(venue: string | null, city: string | null): string | null {
  const parts = [venue, city].filter(Boolean).join(", ");
  if (!parts) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

function buildTicketTiers(ev: AiEvent | null): TicketTier[] {
  if (!ev?.ticket_types) return [];
  return ev.ticket_types
    .filter(t => t.is_active !== false && t.id && t.name)
    .map(t => ({
      id: t.id!,
      name: t.name!,
      price: t.price ?? 0,
      priceType: (t.price_type === "free" || t.price === 0 ? "free" : "paid") as "free" | "paid",
    }));
}

// ─── Inline event detail modal (for "View Details") ──────────────────────────

function AiEventModal({
  pick,
  onClose,
  onGetTickets,
}: {
  pick: AiPick;
  onClose: () => void;
  onGetTickets: (pick: AiPick) => void;
}) {
  const ev = pick.event;
  const date = fmtDate(ev?.start_datetime);
  const time = fmtTime(ev?.start_datetime);
  const venue = getVenue(ev);
  const city = getCity(ev);
  const price = getPrice(ev);
  const href = eventHref(ev, pick.event_id);
  const mapsUrl = googleMapsUrl(venue, city);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center md:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl md:rounded-3xl bg-[var(--bg-card)] shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Banner */}
        {ev?.banner_url ? (
          <div className="relative h-44 w-full overflow-hidden">
            <Image src={ev.banner_url} alt={ev.title ?? pick.title} fill className="object-cover" sizes="480px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-20 w-full bg-gradient-to-br from-[var(--brand-dim)] to-[var(--bg-surface)]" />
        )}

        {/* Close */}
        <button
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          onClick={onClose}
          type="button"
        >
          <X size={14} weight="bold" />
        </button>

        {/* Content */}
        <div className="px-5 pb-6 pt-3">
          <h2 className="text-[19px] font-bold leading-snug text-[var(--text-primary)]">
            {ev?.title ?? pick.title}
          </h2>

          <div className="mt-2.5 space-y-1.5">
            {date && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                <CalendarBlank size={13} weight="fill" className="text-[var(--brand)] shrink-0" />
                {date}{time ? ` · ${time}` : ""}
              </div>
            )}
            {(venue || city) && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                <MapPin size={13} weight="fill" className="text-[var(--brand)] shrink-0" />
                {[venue, city].filter(Boolean).join(", ")}
              </div>
            )}
            {price && (
              <p className={cn("text-[16px] font-bold mt-2", price === "Free" ? "text-emerald-500" : "text-[var(--brand)]")}>
                {price}
              </p>
            )}
          </div>

          {ev?.short_description && (
            <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
              {ev.short_description}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand)] py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
              onClick={() => { onClose(); onGetTickets(pick); }}
              type="button"
            >
              <TicketIcon size={15} weight="bold" />
              Get Tickets
            </button>
            <Link
              href={href}
              className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)]"
            >
              Full page
              <ArrowRight size={13} weight="bold" />
            </Link>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--brand)]"
                title="Get directions"
              >
                <NavigationArrow size={16} weight="bold" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Event Pick Card ──────────────────────────────────────────────────────────

function EventCard({
  pick,
  onGetTickets,
  onViewDetails,
}: {
  pick: AiPick;
  onGetTickets: (pick: AiPick) => void;
  onViewDetails: (pick: AiPick) => void;
}) {
  const ev = pick.event;
  const date = fmtDate(ev?.start_datetime);
  const venue = getVenue(ev);
  const city = getCity(ev);
  const price = getPrice(ev);
  const actions = pick.actions ?? ["get_tickets", "view_details", "get_directions"];
  const mapsUrl = googleMapsUrl(venue, city);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--bg-card)]">
      {/* Main content — clickable link */}
      <Link className="flex items-start gap-3 p-3.5" href={eventHref(ev, pick.event_id)}>
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

      {/* Action row */}
      <div className="flex gap-1.5 border-t border-[var(--border-subtle)] px-3.5 py-2.5">
        {actions.includes("get_tickets") && (
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-2 text-[12px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
            onClick={(e) => { e.preventDefault(); onGetTickets(pick); }}
            type="button"
          >
            <TicketIcon size={12} weight="bold" />
            Get Tickets
          </button>
        )}
        {actions.includes("view_details") && (
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] active:scale-[0.98]"
            onClick={(e) => { e.preventDefault(); onViewDetails(pick); }}
            type="button"
          >
            <ArrowRight size={12} weight="bold" />
            View Details
          </button>
        )}
        {actions.includes("get_directions") && mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--brand)]"
            title="Get directions"
            onClick={(e) => e.stopPropagation()}
          >
            <NavigationArrow size={13} weight="bold" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function ToolsLoader({ names }: { names: string[] }) {
  return (
    <div className="space-y-2.5">
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
        <motion.div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle size={12} weight="fill" className="text-white" />
        </motion.div>
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
  onGetTickets,
  onViewDetails,
}: {
  message: ChatMessage;
  onFollowUp: (t: string) => void;
  onRetry?: () => void;
  onGetTickets: (pick: AiPick) => void;
  onViewDetails: (pick: AiPick) => void;
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
          {message.picks.map((p) => (
            <EventCard
              key={p.event_id}
              pick={p}
              onGetTickets={onGetTickets}
              onViewDetails={onViewDetails}
            />
          ))}
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

// ─── Calendar message renderer (for get_user_calendar results) ────────────────

function CalendarCard({ pick }: { pick: AiPick }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-dim)]">
        <CalendarIcon size={16} weight="fill" className="text-[var(--brand)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{pick.title}</p>
        {pick.event?.start_datetime && (
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {fmtDate(pick.event.start_datetime)}{pick.event?.venues ? ` · ${getVenue(pick.event)}` : ""}
          </p>
        )}
      </div>
      <Link href={eventHref(pick.event, pick.event_id)} className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--brand)]">
        <ArrowRight size={14} weight="bold" />
      </Link>
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
  const [ticketPick, setTicketPick] = useState<AiPick | null>(null);
  const [detailPick, setDetailPick] = useState<AiPick | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMsg = useRef("");
  const abortRef = useRef<AbortController | null>(null);
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

  useEffect(() => {
    if (!initialPrompt || initialPromptFiredRef.current) return;
    if (activeChatId) return;
    initialPromptFiredRef.current = true;
    if (autoSendInitialPrompt) {
      const t = setTimeout(() => {
        sendMessage(initialPrompt);
        onInitialPromptConsumed?.();
      }, 80);
      return () => clearTimeout(t);
    } else {
      setInput(initialPrompt);
      onInitialPromptConsumed?.();
    }
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

  function handleGetTickets(pick: AiPick) {
    const tiers = buildTicketTiers(pick.event);
    if (!tiers.length) {
      // No ticket data yet — navigate to the event page
      window.open(eventHref(pick.event, pick.event_id), "_blank");
      return;
    }
    setTicketPick(pick);
  }

  const hasMessages = messages.length > 0;
  const shellClass = compact
    ? "h-[520px] max-h-[calc(100svh-140px)] rounded-[22px] border border-[var(--border-subtle)]"
    : "h-full";

  // Build EventForTicket from the active pick when ticket modal is open
  const eventForTicket: EventForTicket | null = ticketPick ? {
    id: ticketPick.event_id,
    title: ticketPick.event?.title ?? ticketPick.title,
    date: fmtDate(ticketPick.event?.start_datetime) ?? "",
    time: fmtTime(ticketPick.event?.start_datetime) ?? undefined,
    venue: getVenue(ticketPick.event) ?? "",
    city: getCity(ticketPick.event) ?? undefined,
    imageUrl: ticketPick.event?.banner_url ?? undefined,
    organizer: "GoOutside",
    ticketTypes: buildTicketTiers(ticketPick.event),
  } : null;

  return (
    <>
      {/* Inline ticket modal */}
      <AnimatePresence>
        {ticketPick && eventForTicket && (
          <GetTicketModal
            key="ai-ticket-modal"
            event={eventForTicket}
            onClose={() => setTicketPick(null)}
          />
        )}
      </AnimatePresence>

      {/* Inline event detail modal */}
      <AnimatePresence>
        {detailPick && (
          <AiEventModal
            key="ai-detail-modal"
            pick={detailPick}
            onClose={() => setDetailPick(null)}
            onGetTickets={(p) => { setDetailPick(null); handleGetTickets(p); }}
          />
        )}
      </AnimatePresence>

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
                <motion.div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--brand)]"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkle size={22} weight="fill" className="text-white" />
                </motion.div>
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
                    ) : msg.toolNamesUsed?.includes("get_user_calendar") && msg.picks?.length ? (
                      // Calendar tool response — show compact calendar cards
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed text-[var(--text-primary)]">{msg.content}</p>
                        <div className="grid gap-2">
                          {msg.picks.map((p) => <CalendarCard key={p.event_id} pick={p} />)}
                        </div>
                      </div>
                    ) : (
                      <AssistantBubble
                        message={msg}
                        onFollowUp={sendMessage}
                        onRetry={i === messages.length - 1 && !loading ? retryLast : undefined}
                        onGetTickets={handleGetTickets}
                        onViewDetails={(p) => setDetailPick(p)}
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
    </>
  );
}

export default AICoreChat;
