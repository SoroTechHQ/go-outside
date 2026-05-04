"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ChatCircleDots,
  MagnifyingGlass,
  PencilSimple,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import React, { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Channel as StreamChannel } from "stream-chat";
import type { ChatContact } from "../../api/chat/contacts/route";
import {
  Channel,
  ChannelList,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  TypingIndicator,
  Window,
  useCreateChatClient,
  useChatContext,
  type ChannelPreviewUIComponentProps,
} from "stream-chat-react";

import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { GoMessageInput } from "../../../components/chat/GoMessageInput";
import { GoChannelHeader } from "../../../components/chat/GoChannelHeader";
import { requestPushPermission, subscribeToPush } from "../../../lib/notifications/push";

type GoConversationType =
  | "friend_dm"
  | "organizer_chat"
  | "message_request"
  | "follower_dm"
  | "event_group";

type GoChannelData = {
  go_conversation_type?: GoConversationType;
  go_other_user_verified?: boolean;
};

function getChannelConversationType(channel: StreamChannel): GoConversationType {
  return (channel.data as GoChannelData | undefined)?.go_conversation_type ?? "friend_dm";
}

function getStreamTheme(type: GoConversationType): React.CSSProperties {
  const base: React.CSSProperties = {
    "--str-chat__primary-color":                          "#5FBF2A",
    "--str-chat__own-message-bubble-background-color":    "#5FBF2A",
    "--str-chat__own-message-bubble-color":               "#ffffff",
    "--str-chat__message-bubble-background-color":        "#1e1e1e",
    "--str-chat__message-bubble-color":                   "#f0f0f0",
    "--str-chat__border-radius-md":                       "18px",
    "--str-chat__border-radius-sm":                       "12px",
  } as React.CSSProperties;

  if (type === "message_request") {
    return {
      ...base,
      "--str-chat__own-message-bubble-background-color": "#3a3a3a",
      "--str-chat__own-message-bubble-color":            "#ffffff",
    } as React.CSSProperties;
  }

  if (type === "organizer_chat") {
    return {
      ...base,
      "--str-chat__message-bubble-background-color": "#161e12",
    } as React.CSSProperties;
  }

  return base;
}

const CONV_TYPE_BADGE: Record<string, { label: string; color: string } | undefined> = {
  organizer_chat:  { label: "Organizer",   color: "#5FBF2A" },
  message_request: { label: "Request",     color: "#f59e0b" },
  follower_dm:     { label: "Follows you", color: "#60a5fa" },
  event_group:     { label: "Event",       color: "#a78bfa" },
};

type StreamSessionResponse = {
  starterChannelCid?: string;
  token: string;
  user: { id: string; image: string | null; name: string };
};

type ChatIdentity = { id: string; image?: string; name: string };

type ChatUserSummary = {
  id: string;
  image?: string | null;
  name: string;
  username?: string | null;
  online?: boolean;
  relationship?: ChatContact["relationship"];
};

type MobilePane = "list" | "thread" | "compose";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY ?? "";

function buildDisplayName(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return "GoOutside User";
  const fullName = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.primaryEmailAddress?.emailAddress || "GoOutside User";
}

function getChannelUsers(channel: StreamChannel, currentUserId?: string) {
  const users = Object.values(channel.state.members ?? {})
    .map((member) => member.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user));

  if (!currentUserId) return users;

  return users.sort((left, right) => {
    if (left.id === currentUserId) return 1;
    if (right.id === currentUserId) return -1;
    return 0;
  });
}

function getPrimaryParticipant(channel: StreamChannel, currentUserId?: string) {
  const users = getChannelUsers(channel, currentUserId);
  return users.find((user) => user.id !== currentUserId) ?? users[0];
}

function getConversationTitle(channel: StreamChannel, currentUserId?: string) {
  const users = getChannelUsers(channel, currentUserId);
  const channelNameValue = (channel.data as { name?: unknown } | undefined)?.name;
  const channelName = typeof channelNameValue === "string" ? channelNameValue.trim() : "";

  if (channelName) return channelName;
  if (users.length <= 2) return getPrimaryParticipant(channel, currentUserId)?.name || "New conversation";

  return users
    .filter((user) => user.id !== currentUserId)
    .map((user) => user.name || "Guest")
    .slice(0, 3)
    .join(", ");
}

function getLastMessageText(channel: StreamChannel) {
  const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
  const text = lastMessage?.text?.trim();
  if (text) return text;
  if (lastMessage?.attachments?.length) return "Sent an attachment";
  return "No messages yet";
}

function formatConversationTime(channel: StreamChannel) {
  const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
  const rawDate = lastMessage?.created_at ?? channel.data?.updated_at ?? channel.state.last_message_at;
  if (!rawDate) return "";

  const date = new Date(rawDate);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}


function MessagesLoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-[var(--bg-base)]">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.07)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
          <SpinnerGap className="animate-spin" size={24} weight="bold" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[var(--text-primary)]">Loading messages</p>
          <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MessagesPageSkeleton() {
  return (
    <main className="page-grid go-stream-page">
      <div className="go-stream-frame h-full overflow-hidden">
        <div className="go-stream-chat">
          <aside className="go-stream-chat__sidebar">
            <div className="go-stream-sidebar__header">
              <div className="h-7 w-28 animate-pulse rounded-lg bg-white/8" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/8" />
                  <div className="h-3 w-40 animate-pulse rounded bg-white/6" />
                </div>
              </div>
            ))}
          </aside>
          <section className="go-stream-chat__thread">
            <ChannelMessagesEmptyState />
          </section>
        </div>
      </div>
    </main>
  );
}

function MessagesConfigError({ detail }: { detail: string }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-[var(--bg-base)]">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.07)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
          <ChatCircleDots size={24} weight="bold" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[var(--text-primary)]">Chat unavailable</p>
          <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ChannelListEmptyState() {
  return (
    <div className="go-stream-empty">
      <div className="go-stream-empty__icon">
        <ChatCircleDots size={26} weight="duotone" />
      </div>
      <div>
        <p className="go-stream-empty__title">No conversations yet</p>
        <p className="go-stream-empty__copy">
          Your DMs will show up here. Tap compose to start a new conversation.
        </p>
      </div>
    </div>
  );
}

function ChannelMessagesEmptyState() {
  return (
    <div className="go-stream-empty go-stream-empty--thread">
      <div className="go-stream-empty__icon">
        <ChatCircleDots size={26} weight="duotone" />
      </div>
      <div>
        <p className="go-stream-empty__title">Pick a conversation</p>
        <p className="go-stream-empty__copy">
          Choose a thread from your inbox or start a new message.
        </p>
      </div>
    </div>
  );
}

function ComposeUserAvatar({ user }: { user: ChatUserSummary }) {
  return (
    <div className="go-stream-user-avatar">
      {user.image ? <img alt={user.name} src={user.image} /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}
      {user.online ? <span className="go-stream-user-avatar__status" /> : null}
    </div>
  );
}

function ConversationTypeBadge({ type }: { type: GoConversationType }) {
  const config = CONV_TYPE_BADGE[type];
  if (!config) return null;
  return (
    <span
      className="go-stream-conv-badge"
      style={{ color: config.color, background: `${config.color}18`, border: `1px solid ${config.color}30` }}
    >
      {config.label}
    </span>
  );
}

function ConversationPreview(
  props: ChannelPreviewUIComponentProps & { onOpenChannel: (channel: StreamChannel) => void },
) {
  const { active, channel, latestMessagePreview, onOpenChannel, onSelect, unread } = props;
  const { client } = useChatContext("ConversationPreview");
  const participant = getPrimaryParticipant(channel, client.userID);
  const convType = getChannelConversationType(channel);
  const previewText =
    typeof latestMessagePreview === "string" && latestMessagePreview.trim()
      ? latestMessagePreview
      : getLastMessageText(channel);

  return (
    <button
      className={`go-stream-conversation ${active ? "go-stream-conversation--active" : ""}`}
      onClick={(event) => {
        onSelect?.(event);
        onOpenChannel(channel);
      }}
      type="button"
    >
      <div className="go-stream-conversation__avatar">
        {participant?.image ? (
          <img alt={participant.name || "Conversation"} src={participant.image} />
        ) : (
          <span>{(participant?.name || getConversationTitle(channel, client.userID)).slice(0, 1).toUpperCase()}</span>
        )}
        {participant?.online ? <span className="go-stream-conversation__online" /> : null}
      </div>

      <div className="go-stream-conversation__body">
        <div className="go-stream-conversation__topline">
          <div className="go-stream-conversation__title-row">
            <p className="go-stream-conversation__title">{getConversationTitle(channel, client.userID)}</p>
            <ConversationTypeBadge type={convType} />
          </div>
          <span className="go-stream-conversation__time">{formatConversationTime(channel)}</span>
        </div>
        <p className="go-stream-conversation__preview">{previewText}</p>
      </div>

      {unread ? <span className="go-stream-conversation__unread">{unread > 99 ? "99+" : unread}</span> : null}
    </button>
  );
}


const RELATIONSHIP_LABEL: Record<ChatContact["relationship"], string | null> = {
  mutual:    null,
  following: "Following",
  follower:  "Follows you",
  none:      "Not connected · sends as request",
};

function ComposeConversation({
  isMobile,
  onClose,
  onStartConversation,
  open,
}: {
  isMobile: boolean;
  onClose: () => void;
  onStartConversation: (user: ChatUserSummary) => Promise<void>;
  open: boolean;
}) {
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [results, setResults] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setError(null);
      setCreatingId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadContacts = async () => {
      setLoadingUsers(true);
      setError(null);

      try {
        const q = deferredSearch.trim();
        const url = q ? `/api/chat/contacts?q=${encodeURIComponent(q)}` : "/api/chat/contacts";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not load contacts.");
        const json = (await res.json()) as { contacts: ChatContact[] };
        if (cancelled) return;
        setResults(json.contacts);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load people to message.");
        setResults([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    void loadContacts();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, open]);

  if (!open) return null;

  return (
    <div className={`go-stream-compose ${isMobile ? "go-stream-compose--mobile" : ""}`}>
      <div className="go-stream-compose__card">
        <div className="go-stream-compose__header">
          <div className="flex items-center gap-3">
            {isMobile ? (
              <button
                aria-label="Back to inbox"
                className="go-stream-thread-header__back"
                onClick={onClose}
                type="button"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            ) : null}
            <div>
              <p className="go-stream-sidebar__eyebrow">Compose</p>
              <h2 className="go-stream-compose__title">New message</h2>
            </div>
          </div>

          <button aria-label="Close compose" className="go-stream-compose__close" onClick={onClose} type="button">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="go-stream-compose__search">
          <MagnifyingGlass size={18} weight="bold" />
          <input
            autoFocus
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people by name"
            type="text"
            value={search}
          />
        </div>

        <div className="go-stream-compose__results">
          {loadingUsers ? (
            <div className="go-stream-compose__state">
              <SpinnerGap className="animate-spin" size={18} weight="bold" />
              <span>Finding people…</span>
            </div>
          ) : null}

          {!loadingUsers && error ? <p className="go-stream-compose__state">{error}</p> : null}

          {!loadingUsers && !error && results.length === 0 ? (
            <p className="go-stream-compose__state">
              {search.trim()
                ? "No users found with that username or name."
                : "Follow people to see them here, or search by username."}
            </p>
          ) : null}

          {!loadingUsers && !error
            ? results.map((contact) => {
                const disabled = creatingId === contact.id;
                const relationLabel = RELATIONSHIP_LABEL[contact.relationship];
                const isRequest = contact.relationship === "none";

                return (
                  <button
                    key={contact.id}
                    className={`go-stream-compose__result${isRequest ? " go-stream-compose__result--request" : ""}`}
                    disabled={Boolean(creatingId)}
                    onClick={async () => {
                      setCreatingId(contact.id);
                      setError(null);

                      try {
                        await onStartConversation({
                          id: contact.id,
                          name: contact.name,
                          image: contact.image ?? undefined,
                          username: contact.username,
                          relationship: contact.relationship,
                        });
                      } catch (conversationError) {
                        setError(
                          conversationError instanceof Error
                            ? conversationError.message
                            : "Could not start that conversation.",
                        );
                      } finally {
                        setCreatingId(null);
                      }
                    }}
                    type="button"
                  >
                    <ComposeUserAvatar user={{ id: contact.id, name: contact.name, image: contact.image ?? undefined }} />
                    <div className="go-stream-compose__result-copy">
                      <p>
                        {contact.name}
                        {contact.username ? (
                          <span className="go-stream-compose__result-username"> @{contact.username}</span>
                        ) : null}
                      </p>
                      <span className={isRequest ? "go-stream-compose__result-label--request" : ""}>
                        {relationLabel ?? "Friends"}
                      </span>
                    </div>
                    {disabled ? <SpinnerGap className="animate-spin" size={16} weight="bold" /> : null}
                  </button>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}

function MessagesShell({
  dmUserId,
  identity,
  starterChannelCid,
}: {
  dmUserId?: string;
  identity: ChatIdentity;
  starterChannelCid?: string;
}) {
  const { channel: activeChannel, client, setActiveChannel } = useChatContext("MessagesShell");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [selectedChannelCid, setSelectedChannelCid] = useState<string | undefined>(starterChannelCid);
  const [activeConvType, setActiveConvType] = useState<GoConversationType>("friend_dm");
  const dmOpenedRef = useRef(false);

  // Broadcast unread count to BottomNav via CustomEvent
  useEffect(() => {
    if (!client) return;
    const broadcast = () => {
      const total = Object.values(client.activeChannels ?? {}).reduce(
        (sum, ch) => sum + (ch.countUnread?.() ?? 0), 0
      );
      window.dispatchEvent(new CustomEvent("stream:unread", { detail: total }));
    };
    const unsub = client.on("notification.message_new", broadcast);
    const unsub2 = client.on("message.read", broadcast);
    return () => { unsub.unsubscribe(); unsub2.unsubscribe(); };
  }, [client]);

  // In-tab browser notification for messages arriving while user is on another tab/page
  useEffect(() => {
    if (!client) return;
    const sub = client.on("notification.message_new", (event) => {
      if (activeChannel?.cid === event.cid) return;
      if (Notification.permission !== "granted") return;
      const sender = (event.message?.user as { name?: string } | undefined)?.name ?? "Someone";
      const text = (event.message as { text?: string } | undefined)?.text?.trim();
      const attachments = (event.message as { attachments?: unknown[] } | undefined)?.attachments;
      const body = text || (attachments?.length ? "Sent a file" : "New message");
      new Notification(`${sender} · GoOutside`, {
        body,
        icon: "/favicon-icon.png",
        tag: event.channel_id,
      });
    });
    return () => sub.unsubscribe();
  }, [client, activeChannel?.cid]);

  // Auto-open DM channel when navigated from a profile page
  useEffect(() => {
    if (!dmUserId || !client || dmUserId === identity.id || dmOpenedRef.current) return;
    dmOpenedRef.current = true;

    const openDm = async () => {
      // Distinct channel — Stream deduplicates by member set, no ID collision risk
      const channel = client.channel("messaging", {
        members: [identity.id, dmUserId],
      });
      await channel.watch();
      setActiveChannel(channel);
      startTransition(() => {
        setSelectedChannelCid(channel.cid);
        if (isMobile) setMobilePane("thread");
      });
    };

    openDm().catch(console.error);
  }, [dmUserId, client, identity.id, isMobile, setActiveChannel]);

  useEffect(() => {
    if (starterChannelCid && !selectedChannelCid) {
      setSelectedChannelCid(starterChannelCid);
    }
  }, [selectedChannelCid, starterChannelCid]);

  useEffect(() => {
    if (activeChannel?.cid) {
      setSelectedChannelCid(activeChannel.cid);
      setActiveConvType(getChannelConversationType(activeChannel));
    }
  }, [activeChannel?.cid]);

  useEffect(() => {
    if (!isMobile) {
      setMobilePane("list");
    }
  }, [isMobile]);

  const handleOpenChannel = useCallback(
    (channel: StreamChannel) => {
      setActiveChannel(channel);
      setSelectedChannelCid(channel.cid);
      if (isMobile) {
        setMobilePane("thread");
      }
    },
    [isMobile, setActiveChannel],
  );

  const handleOpenCompose = useCallback(() => {
    setComposeOpen(true);
    if (isMobile) {
      setMobilePane("compose");
    }
  }, [isMobile]);

  const handleCloseCompose = useCallback(() => {
    setComposeOpen(false);
    if (isMobile) {
      setMobilePane("list");
    }
  }, [isMobile]);

  const handleStartConversation = useCallback(
    async (user: ChatUserSummary) => {
      const isConnected = user.relationship && user.relationship !== "none";
      const convType: GoConversationType = isConnected ? "friend_dm" : "message_request";

      // Distinct channel — Stream deduplicates by member set
      const channel = client.channel("messaging", {
        members: [identity.id, user.id],
        go_conversation_type: convType,
        go_channel_state: isConnected ? "active" : "pending",
        ...(user.username ? { go_other_username: user.username } : {}),
      } as Parameters<typeof client.channel>[1]);
      await channel.watch();
      setActiveChannel(channel);

      startTransition(() => {
        setSelectedChannelCid(channel.cid);
        setComposeOpen(false);
        if (isMobile) {
          setMobilePane("thread");
        }
      });
    },
    [client, identity.id, isMobile, setActiveChannel],
  );

  const rootStateClass =
    isMobile && composeOpen
      ? "go-stream-chat--mobile-compose"
      : isMobile && mobilePane === "thread"
        ? "go-stream-chat--mobile-thread"
        : "";

  return (
    <div className={`go-stream-chat ${rootStateClass}`}>
      <aside className="go-stream-chat__sidebar">
        <div className="go-stream-sidebar__header">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="go-stream-sidebar__eyebrow">Inbox</p>
              <h1 className="go-stream-sidebar__title">Messages</h1>
            </div>
            <button
              aria-label="Compose message"
              className="go-stream-sidebar__compose"
              onClick={handleOpenCompose}
              type="button"
            >
              <PencilSimple size={17} weight="bold" />
            </button>
          </div>
        </div>

        <ChannelList
          EmptyStateIndicator={ChannelListEmptyState}
          LoadingIndicator={LoadingIndicator}
          Preview={(previewProps) => (
            <ConversationPreview {...previewProps} onOpenChannel={handleOpenChannel} />
          )}
          customActiveChannel={selectedChannelCid ?? starterChannelCid}
          filters={{ members: { $in: [identity.id] }, type: "messaging" }}
          options={{ limit: 20, presence: true, state: true, watch: true }}
          setActiveChannelOnMount={!isMobile}
          sort={{ last_message_at: -1 }}
        />
      </aside>

      <section
        className={`go-stream-chat__thread go-conv-${activeConvType}`}
        style={getStreamTheme(activeConvType)}
      >
        {activeChannel ? (
          <Channel key={activeChannel.cid} EmptyStateIndicator={ChannelMessagesEmptyState}>
            <Window>
              <GoChannelHeader
                onBack={() => setMobilePane("list")}
                showBackButton={isMobile && mobilePane === "thread"}
              />
              <MessageList
                messageActions={["delete", "edit", "flag", "markUnread", "mute", "react", "quote"]}
                reactionDetailsSort={[{ field: "count", direction: -1 }]}
              />
              <TypingIndicator />
              <MessageInput Input={GoMessageInput} />
            </Window>
          </Channel>
        ) : (
          <ChannelMessagesEmptyState />
        )}
      </section>

      <ComposeConversation
        isMobile={isMobile}
        onClose={handleCloseCompose}
        onStartConversation={handleStartConversation}
        open={composeOpen}
      />
    </div>
  );
}

function StreamMessagesView({
  dmUserId,
  identity,
  getClerkToken,
}: {
  dmUserId?: string;
  getClerkToken: ReturnType<typeof useAuth>["getToken"];
  identity: ChatIdentity;
}) {
  const [bootError, setBootError] = useState<string | null>(null);
  const [starterChannelCid, setStarterChannelCid] = useState<string | undefined>();

  const tokenProvider = useCallback(async () => {
    const clerkToken = await getClerkToken();
    if (!clerkToken) throw new Error("Your session expired. Sign in again to open chat.");

    const response = await fetch("/api/chat/token", {
      body: JSON.stringify({ image: identity.image ?? null, name: identity.name }),
      headers: { Authorization: `Bearer ${clerkToken}`, "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as
      | (Partial<StreamSessionResponse> & { error?: string })
      | null;

    if (!response.ok || !payload?.token) {
      const message = payload?.error ?? "Could not start chat right now.";
      startTransition(() => setBootError(message));
      throw new Error(message);
    }

    startTransition(() => {
      setBootError(null);
      setStarterChannelCid(payload.starterChannelCid);
    });

    return payload.token;
  }, [getClerkToken, identity.image, identity.name]);

  const client = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: tokenProvider,
    userData: identity,
  });

  // Register service worker and subscribe to push once the Stream client is ready
  useEffect(() => {
    if (!client) return;
    if (!("serviceWorker" in navigator)) return;

    const setup = async () => {
      await navigator.serviceWorker.register("/sw.js").catch(() => {});
      const granted = await requestPushPermission();
      if (!granted) return;
      const clerkToken = await getClerkToken();
      if (!clerkToken) return;
      await subscribeToPush(clerkToken).catch(() => {});
    };

    void setup();
  }, [client, getClerkToken]);

  if (bootError) return <MessagesConfigError detail={bootError} />;
  if (!client) return <MessagesPageSkeleton />;

  // Don't auto-select the welcome channel when navigating from a profile (?dm=) — the DM effect handles it
  const effectiveStarterCid = dmUserId ? undefined : starterChannelCid;

  return (
    <main className="page-grid go-stream-page">
      <div className="go-stream-frame h-full overflow-hidden">
        <div className="go-stream-inner h-full overflow-hidden">
          <Chat client={client}>
            <MessagesShell dmUserId={dmUserId} identity={identity} starterChannelCid={effectiveStarterCid} />
          </Chat>
        </div>
      </div>
    </main>
  );
}

function MessagesPageInner() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const searchParams = useSearchParams();
  const dmUserId = searchParams.get("dm") ?? undefined;

  if (!STREAM_API_KEY) {
    return <MessagesConfigError detail="Add NEXT_PUBLIC_STREAM_API_KEY in the web app env and restart." />;
  }
  if (!authLoaded || !userLoaded) {
    return <MessagesLoadingState label="Checking your session…" />;
  }
  if (!user) {
    return <MessagesConfigError detail="Sign in to access your messages." />;
  }

  return (
    <StreamMessagesView
      dmUserId={dmUserId}
      getClerkToken={getToken}
      identity={{ id: user.id, image: user.imageUrl || undefined, name: buildDisplayName(user) }}
    />
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingState label="Loading…" />}>
      <MessagesPageInner />
    </Suspense>
  );
}
