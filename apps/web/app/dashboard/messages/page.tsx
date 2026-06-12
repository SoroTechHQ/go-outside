"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

type PreviewConversation = {
  cid: string;
  id: string;
  image: string | null;
  lastMessage: string;
  title: string;
};

function MessagesRouteFallback() {
  const [conversations, setConversations] = useState<PreviewConversation[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/chat/conversations")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { conversations?: PreviewConversation[] } | null) => {
        if (!cancelled) setConversations(payload?.conversations ?? []);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasConversations = conversations.length > 0;

  return (
    <main className="page-grid go-stream-page">
      <div className="go-stream-frame h-full overflow-hidden">
        <div className="go-stream-chat">
          <aside className="go-stream-chat__sidebar">
            <div className="go-stream-sidebar__header">
              <div className="h-7 w-28 animate-pulse rounded-lg bg-[var(--bg-surface)]" />
            </div>
            {hasConversations
              ? conversations.map((conversation) => (
                <div key={conversation.cid} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                    {conversation.image ? (
                      <img alt="" className="h-full w-full object-cover" src={conversation.image} />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                      {conversation.title}
                    </p>
                    <p className="truncate text-[12px] text-[var(--text-tertiary)]">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              ))
              : [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--bg-surface)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-[var(--bg-surface)]" />
                    <div className="h-3 w-40 animate-pulse rounded bg-[var(--border-subtle)]" />
                  </div>
                </div>
              ))}
          </aside>
          <section className="go-stream-chat__thread">
            <div className="go-stream-empty go-stream-empty--thread">
              <div className="go-stream-empty__icon" />
              <div>
                <p className="go-stream-empty__title">Loading messages</p>
                <p className="go-stream-empty__copy">Opening your inbox…</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const MessagesClient = dynamic(() => import("./MessagesClient"), {
  ssr: false,
  loading: () => <MessagesRouteFallback />,
});

export default function MessagesPage() {
  return <MessagesClient />;
}
