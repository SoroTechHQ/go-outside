"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatCircleText, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import AICoreChat from "../../../components/ai/AICoreChat";

type AiChatPreview = {
  id: string;
  title: string | null;
  updated_at: string;
  message_count?: number;
  last_assistant_message?: string | null;
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export default function AIDashboardClient() {
  const [chats, setChats] = useState<AiChatPreview[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const loadChats = async () => {
    const res = await fetch("/api/ai/chats");
    if (!res.ok) return;
    const data = (await res.json()) as { chats: AiChatPreview[] };
    setChats(data.chats);
  };

  useEffect(() => { loadChats().catch(() => undefined); }, []);

  const deleteChat = async (id: string) => {
    await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
    if (activeChatId === id) setActiveChatId(null);
    await loadChats();
  };

  return (
    <main className="page-grid min-h-screen pb-24 md:pb-6">
      <div className="container-shell px-4 py-5 md:py-6">
        <div className="grid h-[calc(100svh-100px)] min-h-[520px] gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">

          {/* Sidebar */}
          <aside className="hidden flex-col gap-2 lg:flex">
            <button
              className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 text-[13px] font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
              onClick={() => setActiveChatId(null)}
              type="button"
            >
              <Plus size={14} weight="bold" />
              New chat
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">History</p>
                <ChatCircleText size={13} className="text-[var(--text-tertiary)]" />
              </div>

              <AnimatePresence initial={false}>
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <Sparkle size={22} className="mb-3 text-[var(--text-tertiary)]" weight="thin" />
                    <p className="text-[11px] leading-5 text-[var(--text-tertiary)]">
                      Conversations appear here once the database migration is applied.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-px p-1.5">
                    {chats.map((chat) => {
                      const active = chat.id === activeChatId;
                      return (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={`group flex cursor-pointer items-start gap-2 rounded-[12px] px-3 py-2.5 transition ${
                            active
                              ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                              : "text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          }`}
                          initial={{ opacity: 0, y: 4 }}
                          key={chat.id}
                          onClick={() => setActiveChatId(chat.id)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="truncate text-[12px] font-semibold">
                                {chat.title || "New chat"}
                              </p>
                              <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                                {timeAgo(chat.updated_at)}
                              </span>
                            </div>
                            {chat.last_assistant_message && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-secondary)]">
                                {chat.last_assistant_message}
                              </p>
                            )}
                          </div>
                          <button
                            aria-label="Delete"
                            className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] transition hover:text-red-400 group-hover:flex"
                            onClick={(e) => { e.stopPropagation(); void deleteChat(chat.id); }}
                            type="button"
                          >
                            <Trash size={11} weight="bold" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </aside>

          {/* Chat */}
          <AICoreChat
            activeChatId={activeChatId}
            onChatIdChange={async (id) => {
              setActiveChatId(id);
              await loadChats();
            }}
          />
        </div>
      </div>
    </main>
  );
}
