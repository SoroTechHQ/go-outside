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

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
  });
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

  useEffect(() => {
    loadChats().catch(() => undefined);
  }, []);

  const deleteChat = async (id: string) => {
    await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
    if (activeChatId === id) setActiveChatId(null);
    await loadChats();
  };

  return (
    <main className="page-grid min-h-screen pb-28 md:pb-12">
      <div className="container-shell px-4 py-7 md:py-9">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-dim)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              <Sparkle size={13} weight="fill" />
              AI Core
            </p>
            <h1 className="mt-4 font-display text-[2.2rem] italic leading-tight text-[var(--text-primary)] md:text-[3rem]">
              Event assistant
            </h1>
            <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--text-secondary)]">
              Ask for event plans, budget options, trending nights, or personalized picks from live GoOutside data.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
            onClick={() => setActiveChatId(null)}
            type="button"
          >
            <Plus size={16} weight="bold" />
            New chat
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden min-h-[560px] rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 lg:block">
            <div className="mb-3 flex items-center justify-between px-2 py-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Chat history
              </p>
              <ChatCircleText size={16} className="text-[var(--text-tertiary)]" />
            </div>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {chats.length === 0 ? (
                  <p className="px-2 py-6 text-sm leading-6 text-[var(--text-tertiary)]">
                    Your saved AI conversations will show up here after the database migration is applied.
                  </p>
                ) : (
                  chats.map((chat) => {
                    const active = chat.id === activeChatId;
                    return (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className={`group flex items-start gap-2 rounded-[18px] border p-3 transition ${
                          active
                            ? "border-[var(--brand)]/40 bg-[var(--brand-dim)]"
                            : "border-transparent bg-[var(--bg-surface)] hover:border-[var(--border-subtle)]"
                        }`}
                        initial={{ opacity: 0, y: 8 }}
                        key={chat.id}
                      >
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setActiveChatId(chat.id)}
                          type="button"
                        >
                          <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                            {chat.title || "New chat"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--text-secondary)]">
                            {chat.last_assistant_message || `${chat.message_count ?? 0} messages`}
                          </p>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            {formatUpdatedAt(chat.updated_at)}
                          </p>
                        </button>
                        <button
                          aria-label="Delete chat"
                          className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-400 group-hover:flex"
                          onClick={() => deleteChat(chat.id)}
                          type="button"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </aside>

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
