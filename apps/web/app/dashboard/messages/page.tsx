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
import { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Channel as StreamChannel, UserFilters, UserResponse, UserSort } from "stream-chat";
import {
  Channel,
  ChannelList,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
  useChatContext,
  useCreateChatClient,
  type ChannelPreviewUIComponentProps,
} from "stream-chat-react";

import { useMediaQuery } from "../../../hooks/useMediaQuery";

type StreamSessionResponse = {
  starterChannelCid?: string;
  token: string;
  user: { id: string; image: string | null; name: string };
};

type ChatIdentity = { id: string; image?: string; name: string };

type ChatUserSummary = {
  id: string;
  image?: string;
  name: string;
  online?: boolean;
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

function formatPresenceCopy(channel: StreamChannel, currentUserId?: string) {
  const users = getChannelUsers(channel, currentUserId);
  const onlineCount = users.filter((user) => Boolean(user.online)).length;
  const memberLabel = users.length === 1 ? "member" : "members";
  return `${users.length} ${memberLabel}, ${onlineCount} online`;
}

function buildChannelId(userA: string, userB: string) {
  return [userA, userB]
    .sort()
    .join("__")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
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

function ConversationPreview(
  props: ChannelPreviewUIComponentProps & { onOpenChannel: (channel: StreamChannel) => void },
) {
  const { active, channel, latestMessagePreview, onOpenChannel, onSelect, unread } = props;
  const { client } = useChatContext("ConversationPreview");
  const participant = getPrimaryParticipant(channel, client.userID);
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
          <p className="go-stream-conversation__title">{getConversationTitle(channel, client.userID)}</p>
          <span className="go-stream-conversation__time">{formatConversationTime(channel)}</span>
        </div>
        <p className="go-stream-conversation__preview">{previewText}</p>
      </div>

      {unread ? <span className="go-stream-conversation__unread">{unread > 99 ? "99+" : unread}</span> : null}
    </button>
  );
}

function ConversationHeader({
  onBack,
  showBackButton,
}: {
  onBack: () => void;
  showBackButton: boolean;
}) {
  const { channel } = useChannelStateContext("ConversationHeader");
  const { client } = useChatContext("ConversationHeader");
  const participant = getPrimaryParticipant(channel, client.userID);

  return (
    <div className="go-stream-thread-header">
      <div className="go-stream-thread-header__identity">
        {showBackButton ? (
          <button
            aria-label="Back to messages"
            className="go-stream-thread-header__back"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
        ) : null}

        <div className="go-stream-conversation__avatar go-stream-conversation__avatar--header">
          {participant?.image ? (
            <img alt={participant.name || "Conversation"} src={participant.image} />
          ) : (
            <span>{(participant?.name || getConversationTitle(channel, client.userID)).slice(0, 1).toUpperCase()}</span>
          )}
          {participant?.online ? <span className="go-stream-conversation__online" /> : null}
        </div>

        <div className="min-w-0">
          <p className="go-stream-thread-header__title">{getConversationTitle(channel, client.userID)}</p>
          <p className="go-stream-thread-header__meta">{formatPresenceCopy(channel, client.userID)}</p>
        </div>
      </div>
    </div>
  );
}

function ComposeConversation({
  currentUserId,
  isMobile,
  onClose,
  onStartConversation,
  open,
}: {
  currentUserId: string;
  isMobile: boolean;
  onClose: () => void;
  onStartConversation: (user: ChatUserSummary) => Promise<void>;
  open: boolean;
}) {
  const { client } = useChatContext("ComposeConversation");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [results, setResults] = useState<ChatUserSummary[]>([]);
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

    const loadUsers = async () => {
      setLoadingUsers(true);
      setError(null);

      try {
        const query = deferredSearch.trim();
        const filters: UserFilters = query
          ? {
              $and: [
                { $nor: [{ id: currentUserId }] },
                {
                  $or: [
                    { name: { $autocomplete: query } },
                    { username: { $autocomplete: query } },
                    { id: { $autocomplete: query } },
                  ],
                },
              ],
            }
          : { $nor: [{ id: currentUserId }] };
        const sort: UserSort = [{ online: -1 }, { last_active: -1 }, { name: 1 }];

        const response = await client.queryUsers(filters, sort, { limit: 12, presence: true });
        if (cancelled) return;

        setResults(
          response.users.map((user: UserResponse) => ({
            id: user.id,
            image: user.image || undefined,
            name: user.name || user.username || user.id,
            online: Boolean(user.online),
          })),
        );
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load people to message.");
        setResults([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [client, currentUserId, deferredSearch, open]);

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
              {search.trim() ? "No matching people found." : "No one is available to message yet."}
            </p>
          ) : null}

          {!loadingUsers && !error
            ? results.map((user) => {
                const disabled = creatingId === user.id;

                return (
                  <button
                    key={user.id}
                    className="go-stream-compose__result"
                    disabled={Boolean(creatingId)}
                    onClick={async () => {
                      setCreatingId(user.id);
                      setError(null);

                      try {
                        await onStartConversation(user);
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
                    <ComposeUserAvatar user={user} />
                    <div className="go-stream-compose__result-copy">
                      <p>{user.name}</p>
                      <span>{user.online ? "Online now" : "Tap to open a new message"}</span>
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
  const dmOpenedRef = useRef(false);

  // Auto-open DM channel when navigated from a profile page
  useEffect(() => {
    if (!dmUserId || !client || dmUserId === identity.id || dmOpenedRef.current) return;
    dmOpenedRef.current = true;

    const openDm = async () => {
      const channelId = buildChannelId(identity.id, dmUserId);
      const channel = client.channel("messaging", channelId, {
        created_by_id: identity.id,
        members: [identity.id, dmUserId],
      });

      try {
        await channel.create();
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (!msg.includes("already exists")) throw err;
      }

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
    }
  }, [activeChannel?.cid]);

  useEffect(() => {
    if (!isMobile) {
      setMobilePane("list");
    }
  }, [isMobile]);

  const handleOpenChannel = useCallback(
    (channel: StreamChannel) => {
      setSelectedChannelCid(channel.cid);
      if (isMobile) {
        setMobilePane("thread");
      }
    },
    [isMobile],
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
      const channelId = buildChannelId(identity.id, user.id);
      const channel = client.channel("messaging", channelId, {
        created_by_id: identity.id,
        members: [identity.id, user.id],
      });

      try {
        await channel.create();
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (!message.includes("already exists")) {
          throw error;
        }
      }

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

      <section className="go-stream-chat__thread">
        {activeChannel ? (
          <Channel EmptyStateIndicator={ChannelMessagesEmptyState}>
            <Window>
              <ConversationHeader
                onBack={() => setMobilePane("list")}
                showBackButton={isMobile && mobilePane === "thread"}
              />
              <MessageList />
              <MessageInput additionalTextareaProps={{ placeholder: "Message…" }} focus />
            </Window>
            <Thread />
          </Channel>
        ) : (
          <ChannelMessagesEmptyState />
        )}
      </section>

      <ComposeConversation
        currentUserId={identity.id}
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

  if (bootError) return <MessagesConfigError detail={bootError} />;
  if (!client) return <MessagesLoadingState label="Connecting to chat…" />;

  return (
    <main className="page-grid go-stream-page">
      <div className="go-stream-frame h-full overflow-hidden">
        <div className="go-stream-inner h-full overflow-hidden">
          <Chat client={client}>
            <MessagesShell dmUserId={dmUserId} identity={identity} starterChannelCid={starterChannelCid} />
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
