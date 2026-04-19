"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { ChatCircleDots, SpinnerGap } from "@phosphor-icons/react";
import { startTransition, useEffectEvent, useState } from "react";
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
} from "stream-chat-react";

type StreamSessionResponse = {
  starterChannelCid?: string;
  token: string;
  user: {
    id: string;
    image: string | null;
    name: string;
  };
};

type ChatIdentity = {
  id: string;
  image?: string;
  name: string;
};

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY ?? "";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002").replace(/\/$/, "");

function buildDisplayName(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return "GoOutside User";

  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(" ").trim();

  return fullName || user.username || user.primaryEmailAddress?.emailAddress || "GoOutside User";
}

function MessagesLoadingState({ label }: { label: string }) {
  return (
    <main className="page-grid overflow-hidden" style={{ height: "100dvh" }}>
      <div className="container-shell flex h-full items-center justify-center px-4 py-8">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
            <SpinnerGap className="animate-spin" size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-[var(--text-primary)]">Loading messages</p>
            <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">{label}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function MessagesConfigError({ detail }: { detail: string }) {
  return (
    <main className="page-grid overflow-hidden" style={{ height: "100dvh" }}>
      <div className="container-shell flex h-full items-center justify-center px-4 py-8">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
            <ChatCircleDots size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-[var(--text-primary)]">Chat is not configured</p>
            <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">{detail}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ChannelListEmptyState() {
  return (
    <div className="go-stream-empty">
      <ChatCircleDots size={28} weight="duotone" />
      <div>
        <p className="go-stream-empty__title">No conversations yet</p>
        <p className="go-stream-empty__copy">
          Event chats will appear here after tickets are purchased or an organizer messages you.
        </p>
      </div>
    </div>
  );
}

function ChannelMessagesEmptyState() {
  return (
    <div className="go-stream-empty go-stream-empty--thread">
      <ChatCircleDots size={28} weight="duotone" />
      <div>
        <p className="go-stream-empty__title">Start the conversation</p>
        <p className="go-stream-empty__copy">
          Send the first message to coordinate attendees, ask the organizer a question, or plan the night.
        </p>
      </div>
    </div>
  );
}

function StreamMessagesView({
  identity,
  getClerkToken,
}: {
  getClerkToken: ReturnType<typeof useAuth>["getToken"];
  identity: ChatIdentity;
}) {
  const [bootError, setBootError] = useState<string | null>(null);
  const [starterChannelCid, setStarterChannelCid] = useState<string | undefined>();

  const tokenProvider = useEffectEvent(async () => {
    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error("Your session expired. Sign in again to open chat.");
    }

    const response = await fetch(`${API_BASE_URL}/chat/token`, {
      body: JSON.stringify({
        image: identity.image ?? null,
        name: identity.name,
      }),
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as Partial<StreamSessionResponse> & {
      error?: string;
    } | null;

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
  });

  const client = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    tokenOrProvider: tokenProvider,
    userData: identity,
  });

  if (bootError) {
    return <MessagesConfigError detail={bootError} />;
  }

  if (!client) {
    return <MessagesLoadingState label="Connecting you to Stream Chat." />;
  }

  return (
    <main className="page-grid overflow-hidden" style={{ height: "100dvh" }}>
      <div className="container-shell h-full px-0 py-0 md:px-4 md:py-6">
        <div className="go-stream-frame h-full overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-card)] md:rounded-[32px] md:border shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <Chat client={client}>
            <div className="go-stream-chat">
              <aside className="go-stream-chat__sidebar">
                <div className="go-stream-sidebar__header">
                  <div>
                    <p className="go-stream-sidebar__eyebrow">Inbox</p>
                    <h1 className="go-stream-sidebar__title">Messages</h1>
                  </div>
                  <p className="go-stream-sidebar__copy">
                    Real-time event chats, attendee DMs, and organizer replies.
                  </p>
                </div>

                <ChannelList
                  EmptyStateIndicator={ChannelListEmptyState}
                  LoadingIndicator={LoadingIndicator}
                  customActiveChannel={starterChannelCid}
                  filters={{ members: { $in: [identity.id] }, type: "messaging" }}
                  options={{ limit: 20, presence: true, state: true, watch: true }}
                  setActiveChannelOnMount
                  sort={{ last_message_at: -1 }}
                />
              </aside>

              <section className="go-stream-chat__thread">
                <Channel EmptyStateIndicator={ChannelMessagesEmptyState}>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                    <MessageInput />
                  </Window>
                  <Thread />
                </Channel>
              </section>
            </div>
          </Chat>
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  if (!STREAM_API_KEY) {
    return (
      <MessagesConfigError detail="Add NEXT_PUBLIC_STREAM_API_KEY in the web app env and restart the frontend." />
    );
  }

  if (!authLoaded || !userLoaded) {
    return <MessagesLoadingState label="Checking your session." />;
  }

  if (!user) {
    return <MessagesConfigError detail="You need an active account session before chat can connect." />;
  }

  return (
    <StreamMessagesView
      getClerkToken={getToken}
      identity={{
        id: user.id,
        image: user.imageUrl || undefined,
        name: buildDisplayName(user),
      }}
    />
  );
}
