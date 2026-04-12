"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  DotsThree,
  Checks,
  Check,
  ChatCircleDots,
  VideoCamera,
  Phone,
  Info,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  Smiley,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  text: string;
  mine: boolean;
  time: string;
  read?: boolean;
};

type Conversation = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  lastMessage: string;
  time: string;
  unread: number;
  tab: "primary" | "general" | "requests";
  online: boolean;
  messages: Message[];
};

// ─── Demo data ────────────────────────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Kofi Mensah",
    handle: "@kofi.mensah",
    initials: "KM",
    color: "#4a7ae8",
    lastMessage: "Bro are you going to Afrobeats Night?",
    time: "2m",
    unread: 2,
    tab: "primary",
    online: true,
    messages: [
      { id: "m1", text: "Bro are you going to Afrobeats Night on Friday?", mine: false, time: "12:01 PM" },
      { id: "m2", text: "I was thinking about it, who else is going?", mine: true, time: "12:03 PM", read: true },
      { id: "m3", text: "Ama and Kweku for sure. Abena might come too", mine: false, time: "12:04 PM" },
      { id: "m4", text: "Tickets are GHS 120. Worth it trust me", mine: false, time: "12:04 PM" },
      { id: "m5", text: "Okay I'm in. Let me grab tickets now", mine: true, time: "12:06 PM", read: true },
      { id: "m6", text: "Bro are you going to Afrobeats Night?", mine: false, time: "2:30 PM" },
    ],
  },
  {
    id: "2",
    name: "Ama Owusu",
    handle: "@ama.owusu",
    initials: "AO",
    color: "#e85d8a",
    lastMessage: "The Chale Wote lineup just dropped 🔥",
    time: "14m",
    unread: 1,
    tab: "primary",
    online: true,
    messages: [
      { id: "m1", text: "Have you seen the Chale Wote lineup?", mine: false, time: "10:00 AM" },
      { id: "m2", text: "Not yet, what's on it?", mine: true, time: "10:02 AM", read: true },
      { id: "m3", text: "Wiyaala, M.anifest, and like 20 other artists. It's going to be mad", mine: false, time: "10:03 AM" },
      { id: "m4", text: "Okay we need to plan this properly", mine: true, time: "10:05 AM", read: true },
      { id: "m5", text: "Agreed. Let's go as a group, last year was too scattered", mine: false, time: "10:06 AM" },
      { id: "m6", text: "The Chale Wote lineup just dropped 🔥", mine: false, time: "2:16 PM" },
    ],
  },
  {
    id: "3",
    name: "Kweku Asante",
    handle: "@kweku.asante",
    initials: "KA",
    color: "#bf9150",
    lastMessage: "Ghana Tech Summit is next week 💻",
    time: "1h",
    unread: 0,
    tab: "primary",
    online: false,
    messages: [
      { id: "m1", text: "Ghana Tech Summit is next week 💻", mine: false, time: "1:00 PM" },
      { id: "m2", text: "Are you speaking or just attending?", mine: true, time: "1:05 PM", read: true },
      { id: "m3", text: "Attending. You should come, the networking is solid", mine: false, time: "1:07 PM" },
      { id: "m4", text: "I'll check it out on GoOutside", mine: true, time: "1:10 PM", read: true },
    ],
  },
  {
    id: "4",
    name: "Abena Boateng",
    handle: "@abena.boo",
    initials: "AB",
    color: "#2f8f45",
    lastMessage: "Perfect! Thanks so much 🙏",
    time: "3h",
    unread: 0,
    tab: "primary",
    online: false,
    messages: [
      { id: "m1", text: "Hey can you send me the event flyer?", mine: false, time: "9:00 AM" },
      { id: "m2", text: "Sure, one sec", mine: true, time: "9:01 AM", read: true },
      { id: "m3", text: "📎 afrobeats_night_flyer.jpg", mine: true, time: "9:01 AM", read: true },
      { id: "m4", text: "Perfect! Thanks so much 🙏", mine: false, time: "9:03 AM" },
    ],
  },
  {
    id: "5",
    name: "Nana Yaa",
    handle: "@nana.yaa",
    initials: "NY",
    color: "#7c3aed",
    lastMessage: "The food at that event was 🔥",
    time: "5h",
    unread: 0,
    tab: "general",
    online: false,
    messages: [
      { id: "m1", text: "Did you try the jollof at the food festival?", mine: false, time: "8:00 AM" },
      { id: "m2", text: "Yes!! That was unreal", mine: true, time: "8:10 AM", read: true },
      { id: "m3", text: "The food at that event was 🔥", mine: false, time: "8:12 AM" },
    ],
  },
  {
    id: "6",
    name: "Efua Mensah",
    handle: "@efuamensah",
    initials: "EM",
    color: "#0891b2",
    lastMessage: "Following! See you at the event 👋",
    time: "1d",
    unread: 0,
    tab: "requests",
    online: false,
    messages: [
      { id: "m1", text: "Hey! Saw you're going to Afrobeats Night too. Following!", mine: false, time: "Yesterday" },
      { id: "m2", text: "Following! See you at the event 👋", mine: false, time: "Yesterday" },
    ],
  },
];

const TABS = ["primary", "general", "requests"] as const;
type Tab = (typeof TABS)[number];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  initials,
  color,
  online,
  size = 44,
}: {
  initials: string;
  color: string;
  online?: boolean;
  size?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-full font-semibold select-none"
        style={{
          width: size,
          height: size,
          background: `${color}18`,
          border: `1.5px solid ${color}33`,
          fontSize: size * 0.33,
          color,
        }}
      >
        {initials}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[color:var(--bg-card)] bg-[#22c55e]"
          style={{ width: 11, height: 11 }}
        />
      )}
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────
function ConvItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all text-left"
      style={{
        background: active ? "var(--bg-muted)" : "transparent",
      }}
    >
      <Avatar initials={conv.initials} color={conv.color} online={conv.online} size={46} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[13.5px] truncate"
            style={{
              color: "var(--text-primary)",
              fontWeight: conv.unread > 0 ? 650 : 500,
            }}
          >
            {conv.name}
          </p>
          <span
            className="text-[11px] shrink-0"
            style={{ color: conv.unread > 0 ? "var(--brand)" : "var(--text-tertiary)" }}
          >
            {conv.time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className="text-[12.5px] truncate"
            style={{
              color: "var(--text-tertiary)",
              fontWeight: conv.unread > 0 ? 500 : 400,
            }}
          >
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span
              className="shrink-0 flex items-center justify-center rounded-full text-white font-bold"
              style={{ width: 18, height: 18, background: "var(--brand)", fontSize: 10 }}
            >
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  return (
    <div className={`flex items-end gap-2 ${msg.mine ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className="max-w-[70%] px-4 py-2.5 text-[14px] leading-relaxed"
        style={
          msg.mine
            ? {
                background: "var(--brand)",
                color: "white",
                borderRadius: "20px 20px 6px 20px",
              }
            : {
                background: "var(--bg-muted)",
                color: "var(--text-primary)",
                borderRadius: "20px 20px 20px 6px",
              }
        }
      >
        {msg.text}
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0 pb-0.5">
        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {msg.time}
        </span>
        {msg.mine && (
          <span style={{ color: msg.read ? "var(--brand)" : "var(--text-tertiary)" }}>
            {msg.read ? <Checks size={13} weight="bold" /> : <Check size={13} weight="bold" />}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Compose bar ─────────────────────────────────────────────────────────────
function ComposeBar({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  }, [text, onSend]);

  return (
    <div
      className="shrink-0 border-t px-3 py-2"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-card)",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        marginBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-end gap-2">
        <button
          aria-label="Attach"
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-muted)] active:scale-95"
          style={{ color: "var(--text-tertiary)" }}
          type="button"
        >
          <Plus size={18} weight="bold" />
        </button>

        <div
          className="flex flex-1 items-center rounded-[20px] px-4 py-2.5 text-[14px]"
          style={{ background: "var(--bg-muted)" }}
        >
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Message…"
            style={{ color: "var(--text-primary)" }}
            value={text}
          />
          <button
            aria-label="Emoji"
            className="ml-1 shrink-0 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            type="button"
          >
            <Smiley size={18} weight="regular" />
          </button>
        </div>

        <button
          aria-label="Send"
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          onClick={submit}
          style={{
            background: text.trim() ? "var(--brand)" : "var(--bg-muted)",
            color: text.trim() ? "white" : "var(--text-tertiary)",
            transition: "background 0.18s ease, transform 0.1s ease",
          }}
          type="button"
        >
          <PaperPlaneTilt size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("primary");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [search, setSearch] = useState("");
  const [convos, setConvos] = useState(CONVERSATIONS);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = convos.find((c) => c.id === activeId) ?? null;
  const filtered = convos.filter(
    (c) =>
      c.tab === tab &&
      (search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, convos]);

  function openConv(conv: Conversation) {
    setConvos((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c)),
    );
    setActiveId(conv.id);
    setShowThread(true);
  }

  function sendMessage(text: string) {
    if (!activeId) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text,
      mine: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, time: "now" }
          : c,
      ),
    );
  }

  const unreadRequests = convos.filter((c) => c.tab === "requests" && c.unread > 0).length;

  return (
    <main className="page-grid overflow-hidden" style={{ height: "100dvh" }}>
      <div className="flex h-full">

        {/* ── Left: conversation list ──────────────────────────────── */}
        <div
          className={`flex shrink-0 flex-col border-r ${showThread ? "hidden md:flex" : "flex"} w-full md:w-[320px] lg:w-[340px]`}
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Header */}
          <div className="px-4 pb-3 pt-6 md:px-5 md:pt-7">
            <div className="mb-4 flex items-center justify-between">
              <h1
                className="text-[20px] font-bold tracking-tight md:text-[22px]"
                style={{ color: "var(--text-primary)" }}
              >
                Messages
              </h1>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: "var(--text-tertiary)" }}
                type="button"
              >
                <DotsThree size={20} weight="bold" />
              </button>
            </div>

            {/* Search */}
            <div
              className="mb-3 flex h-10 items-center gap-2.5 rounded-2xl px-3.5"
              style={{ background: "var(--bg-muted)" }}
            >
              <MagnifyingGlass size={14} weight="bold" style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                className="flex-1 bg-transparent text-[13px] outline-none"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                style={{ color: "var(--text-primary)" }}
                value={search}
              />
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 rounded-2xl p-1"
              style={{ background: "var(--bg-muted)" }}
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  className="relative h-8 flex-1 rounded-xl text-[12px] font-semibold capitalize transition-all"
                  onClick={() => setTab(t)}
                  style={{
                    background: tab === t ? "var(--bg-card)" : "transparent",
                    color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                  type="button"
                >
                  {t}
                  {t === "requests" && unreadRequests > 0 && (
                    <span
                      className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full"
                      style={{ background: "#e85d8a" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div
            className="flex-1 overflow-y-auto px-3"
            style={{ paddingBottom: "max(96px, calc(72px + env(safe-area-inset-bottom)))" }}
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <ChatCircleDots size={36} style={{ color: "var(--text-tertiary)" }} />
                <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  No {tab} messages
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvItem
                  key={conv.id}
                  active={conv.id === activeId}
                  conv={conv}
                  onClick={() => openConv(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: thread pane ──────────────────────────────────── */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${showThread ? "flex" : "hidden md:flex"}`}
          style={{ background: "var(--bg-card)" }}
        >
          {active ? (
            <>
              {/* Thread header */}
              <div
                className="flex shrink-0 items-center gap-2 border-b px-4 py-3 md:px-5 md:py-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-muted)] active:scale-95"
                  onClick={() => setShowThread(false)}
                  style={{ color: "var(--text-secondary)" }}
                  type="button"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>

                <Avatar color={active.color} initials={active.initials} online={active.online} size={38} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {active.name}
                  </p>
                  <p className="text-[12px]" style={{ color: active.online ? "#22c55e" : "var(--text-tertiary)" }}>
                    {active.online ? "Active now" : active.handle}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  {[
                    { Icon: Phone, label: "Call" },
                    { Icon: VideoCamera, label: "Video" },
                    { Icon: Info, label: "Info" },
                  ].map(({ Icon, label }) => (
                    <button
                      key={label}
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-muted)] active:scale-95"
                      style={{ color: "var(--text-tertiary)" }}
                      type="button"
                    >
                      <Icon size={18} weight="regular" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5 md:px-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                  <span className="px-2 text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    Today
                  </span>
                  <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
                </div>

                {active.messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Compose bar */}
              <ComposeBar onSend={sendMessage} />
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border-2"
                style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
              >
                <ChatCircleDots size={28} weight="light" />
              </div>
              <div>
                <p className="text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Your messages
                </p>
                <p className="mt-1 text-[14px]" style={{ color: "var(--text-tertiary)" }}>
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
