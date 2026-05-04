"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useChannelStateContext, useChatContext, useTypingContext } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";

type GoConversationType =
  | "friend_dm"
  | "organizer_chat"
  | "message_request"
  | "follower_dm"
  | "event_group";

function getPrimaryParticipant(channel: StreamChannel, currentUserId?: string) {
  const members = Object.values(channel.state.members ?? {})
    .map((m) => m.user)
    .filter((u): u is NonNullable<typeof u> => Boolean(u));
  return members.find((u) => u.id !== currentUserId) ?? members[0];
}

function getConversationTitle(channel: StreamChannel, currentUserId?: string): string {
  const members = Object.values(channel.state.members ?? {})
    .map((m) => m.user)
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const channelNameValue = (channel.data as { name?: unknown } | undefined)?.name;
  if (typeof channelNameValue === "string" && channelNameValue.trim()) {
    return channelNameValue.trim();
  }

  if (members.length <= 2) {
    return getPrimaryParticipant(channel, currentUserId)?.name ?? "New conversation";
  }

  return members
    .filter((u) => u.id !== currentUserId)
    .map((u) => u.name ?? "Guest")
    .slice(0, 3)
    .join(", ");
}

export function GoChannelHeader({
  onBack,
  showBackButton,
}: {
  onBack: () => void;
  showBackButton: boolean;
}) {
  const { channel } = useChannelStateContext("GoChannelHeader");
  const { client } = useChatContext("GoChannelHeader");
  const { typing } = useTypingContext("GoChannelHeader");

  const participant = getPrimaryParticipant(channel, client.userID);
  const title = getConversationTitle(channel, client.userID);

  // Typing indicator in header subtitle
  const typingUsers = Object.values(typing ?? {}).filter(
    (t) => t.user?.id !== client.userID && !t.parent_id,
  );
  const isTyping = typingUsers.length > 0;
  const typingLabel = isTyping
    ? typingUsers.length === 1
      ? `${typingUsers[0].user?.name ?? "Someone"} is typing…`
      : "Several people are typing…"
    : null;

  const presenceSubtitle = participant?.online ? "Online now" : "Last seen recently";
  const subtitle = typingLabel ?? presenceSubtitle;

  const convType = (channel.data as { go_conversation_type?: GoConversationType } | undefined)
    ?.go_conversation_type;
  const isOrganizer = convType === "organizer_chat";

  return (
    <div className={`go-stream-thread-header${isOrganizer ? " go-stream-thread-header--organizer" : ""}`}>
      <div className="go-stream-thread-header__identity">
        {showBackButton && (
          <button
            aria-label="Back to messages"
            className="go-stream-thread-header__back"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
        )}

        <div className="go-stream-conversation__avatar go-stream-conversation__avatar--header">
          {participant?.image ? (
            <img alt={participant.name ?? title} src={participant.image} />
          ) : (
            <span>{title.slice(0, 1).toUpperCase()}</span>
          )}
          {participant?.online && <span className="go-stream-conversation__online" />}
          {isOrganizer && (
            <span aria-label="Verified organizer" className="go-stream-conversation__verified" />
          )}
        </div>

        <div className="min-w-0">
          <div className="go-stream-thread-header__name-row">
            <p className="go-stream-thread-header__title">{title}</p>
            {isOrganizer && (
              <span className="go-stream-thread-header__organizer-pill">ORGANIZER</span>
            )}
          </div>
          <p
            className={`go-stream-thread-header__meta${isTyping ? " go-stream-thread-header__meta--typing" : ""}`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
