"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatCircleTextIcon as ChatCircleText,
  ClockCounterClockwiseIcon as ClockCounterClockwise,
  PlusIcon as Plus,
  SparkleIcon as Sparkle,
  TrashIcon as Trash,
  XIcon as X,
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

function renderChatList(
  chats: AiChatPreview[],
  activeChatId: string | null,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <ChatCircleText size={20} className="mb-2 text-[var(--text-tertiary)]" weight="thin" />
        <p className="text-[11px] leading-5 text-[var(--text-tertiary)]">
          Start a conversation to see your history here.
        </p>
      </div>
    );
  }
  return (
    <AnimatePresence initial={false}>
      <div className="space-y-1.5 p-3">
        {chats.map((chat) => {
          const active = chat.id === activeChatId;
          return (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={`group flex w-full cursor-pointer items-start gap-3 rounded-[14px] px-3.5 py-3 text-left transition ${
                active
                  ? "bg-[var(--brand-dim)] text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(var(--brand-rgb),0.18)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
              }`}
              initial={{ opacity: 0, y: 3 }}
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              type="button"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[13px] font-semibold leading-tight">
                    {chat.title || "Chat"}
                  </p>
                  <span className="shrink-0 text-[10px] font-medium text-[var(--text-tertiary)]">
                    {timeAgo(chat.updated_at)}
                  </span>
                </div>
                {chat.last_assistant_message && (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-[1.45] text-[var(--text-secondary)]">
                    {chat.last_assistant_message}
                  </p>
                )}
              </div>
              <button
                aria-label="Delete"
                className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-400 group-hover:flex"
                onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                type="button"
              >
                <Trash size={12} weight="bold" />
              </button>
            </motion.button>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

export default function AIDashboardClient({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<AiChatPreview[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId ?? null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  // URL-based prompt handoff: /ai?prompt=...&autosend=1
  const urlPrompt   = searchParams.get("prompt") ?? undefined;
  const urlAutosend = searchParams.get("autosend") === "1";

  const [handoffPrompt, setHandoffPrompt]   = useState<string | undefined>(urlPrompt);
  const [handoffAutosend, setHandoffAutosend] = useState(urlAutosend);

  const loadChats = useCallback(async () => {
    const res = await fetch("/api/ai/chats");
    if (!res.ok) return;
    const data = (await res.json()) as { chats: AiChatPreview[] };
    setChats(data.chats);
  }, []);

  useEffect(() => { loadChats().catch(() => undefined); }, [loadChats]);

  const selectChat = (id: string | null) => {
    setActiveChatId(id);
    setMobileHistoryOpen(false);
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
    if (id) window.history.replaceState(null, "", `/ai/${id}`);
    await loadChats();
  };

  const handleInitialPromptConsumed = () => {
    setHandoffPrompt(undefined);
    setHandoffAutosend(false);
    if (urlPrompt) {
      window.history.replaceState(null, "", "/ai");
    }
  };

  return (
    <div className="page-grid flex" style={{ height: "calc(100svh - 72px)" }}>

      {/* Mobile chat history bottom drawer */}
      <AnimatePresence>
        {mobileHistoryOpen && (
          <>
            <motion.div
              key="mobile-history-backdrop"
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setMobileHistoryOpen(false)}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              key="mobile-history-sheet"
              animate={{ y: 0 }}
              className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[72svh] flex-col rounded-t-[28px] border-t border-[var(--border-subtle)] bg-[var(--bg-card)] pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
              exit={{ y: "100%" }}
              initial={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
                    <Sparkle size={11} weight="fill" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">Chat history</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
                    onClick={() => selectChat(null)}
                    title="New chat"
                    type="button"
                  >
                    <Plus size={13} weight="bold" />
                  </button>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
                    onClick={() => setMobileHistoryOpen(false)}
                    type="button"
                  >
                    <X size={13} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {renderChatList(chats, activeChatId, selectChat, (id) => void deleteChat(id))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex w-full flex-col" style={{ paddingRight: "var(--peek-panel-width, 0px)" }}>

        {/* Mobile top bar — history toggle + new chat */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 lg:hidden">
          <button
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
            onClick={() => setMobileHistoryOpen(true)}
            type="button"
          >
            <ClockCounterClockwise size={13} weight="bold" />
            History
          </button>
          <button
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
            onClick={() => selectChat(null)}
            type="button"
          >
            <Plus size={13} weight="bold" />
            New chat
          </button>
          {activeChatId && (
            <span className="ml-auto truncate text-[11px] text-[var(--text-tertiary)]">
              {chats.find((c) => c.id === activeChatId)?.title ?? "Chat"}
            </span>
          )}
        </div>

        {/* Desktop sidebar + chat row */}
        <div className="flex min-h-0 flex-1">

          {/* Sidebar — desktop only */}
          <aside className="hidden w-[340px] shrink-0 flex-col gap-0 border-r border-[var(--border-subtle)] bg-[var(--bg-page)] lg:flex xl:w-[360px]">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
                <Sparkle size={14} weight="fill" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">AI chats</span>
              <button
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--brand)]/35 hover:text-[var(--brand)]"
                onClick={() => selectChat(null)}
                title="New chat"
                type="button"
              >
                <Plus size={13} weight="bold" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {renderChatList(chats, activeChatId, selectChat, (id) => void deleteChat(id))}
            </div>
          </aside>

          {/* Chat — takes all remaining space, flush */}
          <div className="min-w-0 flex-1">
            <AICoreChat
              activeChatId={activeChatId}
              onChatIdChange={handleChatIdChange}
              initialPrompt={handoffPrompt}
              autoSendInitialPrompt={handoffAutosend}
              onInitialPromptConsumed={handleInitialPromptConsumed}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
