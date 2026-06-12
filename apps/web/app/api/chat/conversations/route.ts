import { currentUser } from "@clerk/nextjs/server";
import type { Channel as StreamChannel } from "stream-chat";
import { getStreamServerClient } from "../../../../lib/stream";
import { jsonError, jsonNoStore } from "../../../../lib/api-security";

type ConversationPreview = {
  cid: string;
  id: string;
  image: string | null;
  lastMessage: string;
  title: string;
  updatedAt: string | null;
};

function getChannelUsers(channel: StreamChannel, currentUserId: string) {
  return Object.values(channel.state.members ?? {})
    .map((member) => member.user)
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .sort((left, right) => {
      if (left.id === currentUserId) return 1;
      if (right.id === currentUserId) return -1;
      return 0;
    });
}

function getConversationTitle(channel: StreamChannel, currentUserId: string) {
  const channelData = channel.data as Record<string, unknown> | undefined;
  const explicitName = typeof channelData?.name === "string" ? channelData.name.trim() : "";
  if (explicitName) return explicitName;

  const users = getChannelUsers(channel, currentUserId).filter((user) => user.id !== currentUserId);
  return users.map((user) => user.name || "Guest").slice(0, 3).join(", ") || "Conversation";
}

function getConversationImage(channel: StreamChannel, currentUserId: string) {
  const otherUser = getChannelUsers(channel, currentUserId).find((user) => user.id !== currentUserId);
  const image = otherUser?.image;
  return typeof image === "string" && image ? image : null;
}

function getLastMessage(channel: StreamChannel) {
  const last = channel.state.messages?.[channel.state.messages.length - 1];
  const text = last?.text?.trim();
  if (text) return text;
  if (last?.attachments?.length) return "Sent an attachment";
  return "No messages yet";
}

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  try {
    const stream = getStreamServerClient();
    const channels = await stream.queryChannels(
      {
        members: { $in: [clerk.id] },
        type: "messaging",
        $or: [
          { go_channel_state: "active" },
          { go_channel_state: { $exists: false } },
          { go_channel_state: "pending", go_initiated_by: clerk.id },
        ],
      } as Record<string, unknown>,
      { last_message_at: -1 },
      { limit: 6, state: true, watch: false },
    );

    const conversations: ConversationPreview[] = channels.map((channel) => ({
      cid: channel.cid,
      id: channel.id ?? channel.cid,
      image: getConversationImage(channel, clerk.id),
      lastMessage: getLastMessage(channel),
      title: getConversationTitle(channel, clerk.id),
      updatedAt: (channel.state.last_message_at ?? channel.data?.updated_at ?? null) as string | null,
    }));

    return jsonNoStore({ conversations });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return jsonError(500, "Could not load conversations");
  }
}
