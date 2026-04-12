"use client";

import { useState, useRef, useEffect } from "react";
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
  }, [activeId]);

  function openConv(conv: Conversation) {
    setConvos((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c)),
    );
    setActiveId(conv.id);
    setShowThread(true);
  }

  const unreadRequests = convos.filter((c) => c.tab === "requests" && c.unread > 0).length;

  return (
    <main className="page-grid h-screen overflow-hidden">
      <div className="flex h-full">

        {/* ── Left: conversation list ──────────────────────────────── */}
        <div
          className={`flex flex-col border-r shrink-0 ${showThread ? "hidden md:flex" : "flex"} w-full md:w-[320px] lg:w-[340px]`}
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Header */}
          <div className="px-5 pt-7 pb-4">
            <div className="flex items-center justify-between mb-5">
              <h1
                className="text-[22px] font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Messages
              </h1>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <DotsThree size={20} weight="bold" />
              </button>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2.5 px-3.5 h-10 rounded-2xl mb-3"
              style={{ background: "var(--bg-muted)" }}
            >
              <MagnifyingGlass size={14} weight="bold" style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-2xl"
              style={{ background: "var(--bg-muted)" }}
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 h-8 rounded-xl text-[12px] font-semibold capitalize transition-all relative"
                  style={{
                    background: tab === t ? "var(--bg-card)" : "transparent",
                    color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t}
                  {t === "requests" && unreadRequests > 0 && (
                    <span
                      className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ background: "#e85d8a" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <ChatCircleDots size={36} style={{ color: "var(--text-tertiary)" }} />
                <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  No {tab} messages
                </p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeId}
                  onClick={() => openConv(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: thread pane ──────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${showThread ? "flex" : "hidden md:flex"}`}
          style={{ background: "var(--bg-card)" }}
        >
          {active ? (
            <>
              {/* Thread header */}
              <div
                className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  onClick={() => setShowThread(false)}
                  className="md:hidden w-9 h-9 rounded-full flex items-center justify-center -ml-1 transition-colors hover:bg-[var(--bg-muted)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>

                <Avatar initials={active.initials} color={active.color} online={active.online} size={40} />

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
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
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Icon size={18} weight="regular" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                  <span className="text-[11px] font-medium px-2" style={{ color: "var(--text-tertiary)" }}>
                    Today
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                </div>

                {active.messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
              >
                <ChatCircleDots size={28} weight="light" />
              </div>
              <div>
                <p className="text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Your messages
                </p>
                <p className="text-[14px] mt-1" style={{ color: "var(--text-tertiary)" }}>
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
