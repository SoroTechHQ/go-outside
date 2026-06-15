"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatCircleTextIcon as ChatCircleText,
  PlusIcon as Plus,
  SparkleIcon as Sparkle,
  TrashIcon as Trash,
} from "@phosphor-icons/react";
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

export default function AIDashboardClient({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const [chats, setChats] = useState<AiChatPreview[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId ?? null);

  const loadChats = async () => {
    const res = await fetch("/api/ai/chats");
    if (!res.ok) return;
    const data = (await res.json()) as { chats: AiChatPreview[] };
    setChats(data.chats);
  };

  useEffect(() => { loadChats().catch(() => undefined); }, []);

  const selectChat = (id: string | null) => {
    setActiveChatId(id);
    router.push(id ? `/ai/${id}` : "/ai");
  };

  const deleteChat = async (id: string) => {
    await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
    if (activeChatId === id) selectChat(null);
    await loadChats();
  };

  const handleChatIdChange = async (id: string | null) => {
    if (id === activeChatId) {
      await loadChats();
      return;
    }
    setActiveChatId(id);
    // Update the URL silently — no Next.js navigation, no remount, streaming stays alive
    if (id) window.history.replaceState(null, "", `/ai/${id}`);
    await loadChats();
  };

  return (
    <div className="page-grid flex" style={{ height: "calc(100svh - 72px)" }}>
      <div className="flex w-full" style={{ paddingRight: "var(--peek-panel-width, 0px)" }}>

        {/* Sidebar — desktop only */}
        <aside className="hidden w-[260px] shrink-0 flex-col gap-0 border-r border-[var(--border-subtle)] lg:flex">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
              <Sparkle size={13} weight="fill" />
            </div>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]"></span>
            <button
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
              onClick={() => selectChat(null)}
              title="New chat"
              type="button"
            >
              <Plus size={13} weight="bold" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <ChatCircleText size={20} className="mb-2 text-[var(--text-tertiary)]" weight="thin" />
                <p className="text-[11px] leading-5 text-[var(--text-tertiary)]">
                  Start a conversation to see your history here.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <div className="space-y-px p-2">
                  {chats.map((chat) => {
                    const active = chat.id === activeChatId;
                    return (
                      <motion.button
                        animate={{ opacity: 1, y: 0 }}
                        className={`group flex w-full cursor-pointer items-start gap-2 rounded-[10px] px-2.5 py-2 text-left transition ${
                          active
                            ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                        }`}
                        initial={{ opacity: 0, y: 3 }}
                        key={chat.id}
                        onClick={() => selectChat(chat.id)}
                        type="button"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[12px] font-medium leading-tight">
                              {chat.title || "Chat"}
                            </p>
                            <span className="shrink-0 text-[9px] font-medium text-[var(--text-tertiary)]">
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
                          className="hidden h-4 w-4 shrink-0 items-center justify-center text-[var(--text-tertiary)] transition hover:text-red-400 group-hover:flex"
                          onClick={(e) => { e.stopPropagation(); void deleteChat(chat.id); }}
                          type="button"
                        >
                          <Trash size={11} weight="bold" />
                        </button>
                      </motion.button>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* Chat — takes all remaining space, flush */}
        <div className="min-w-0 flex-1">
          <AICoreChat
            activeChatId={activeChatId}
            onChatIdChange={handleChatIdChange}
          />
        </div>
      </div>
    </div>
  );
}
