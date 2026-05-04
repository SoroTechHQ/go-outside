import type { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getStreamServerClient } from "../../../../../../lib/stream";
import { jsonError, jsonNoStore } from "../../../../../../lib/api-security";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const { channelId } = await params;
  const serverClient = getStreamServerClient();

  try {
    const channels = await serverClient.queryChannels(
      { id: channelId, type: "messaging", members: { $in: [clerk.id] } } as Record<string, unknown>,
      {},
      { limit: 1, state: true },
    );

    if (!channels.length) return jsonError(404, "Channel not found");

    const channel = channels[0];
    const data = channel.data as Record<string, unknown>;

    if (data.go_channel_state !== "pending") {
      return jsonError(400, "Channel is not pending");
    }

    if (data.go_initiated_by === clerk.id) {
      return jsonError(403, "Cannot accept your own request");
    }

    await channel.updatePartial({ set: { go_channel_state: "active" } as Record<string, unknown> });

    return jsonNoStore({ success: true });
  } catch (err) {
    console.error("[POST /api/chat/requests/accept]", err);
    return jsonError(500, "Could not accept request");
  }
}
