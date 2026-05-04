"use client";

import { Check, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";

export function GoRequestBanner({ onDeclined }: { onDeclined?: () => void }) {
  const { channel } = useChannelStateContext("GoRequestBanner");
  const { client } = useChatContext("GoRequestBanner");
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelData = channel.data as Record<string, unknown> | undefined;
  const channelState = channelData?.go_channel_state as string | undefined;
  const initiatedBy = channelData?.go_initiated_by as string | undefined;

  if (channelState !== "pending" || !initiatedBy || initiatedBy === client.userID) return null;

  const senderMember = Object.values(channel.state.members ?? {}).find(
    (m) => m.user?.id === initiatedBy,
  );
  const senderName = senderMember?.user?.name ?? "Someone";

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/requests/${channel.id}/accept`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      // Stream broadcasts channel.updated → banner auto-disappears on re-render
    } catch {
      setError("Couldn't accept. Try again.");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/requests/${channel.id}/decline`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      onDeclined?.();
    } catch {
      setError("Couldn't decline. Try again.");
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="go-request-banner">
      <div className="go-request-banner__body">
        <p className="go-request-banner__label">Message request</p>
        <p className="go-request-banner__text">
          <strong>{senderName}</strong> wants to send you a message
        </p>
        {error && <p className="go-request-banner__error">{error}</p>}
      </div>
      <div className="go-request-banner__actions">
        <button
          className="go-request-banner__btn go-request-banner__btn--accept"
          disabled={accepting || declining}
          onClick={() => void handleAccept()}
          type="button"
        >
          <Check size={15} weight="bold" />
          {accepting ? "Accepting…" : "Accept"}
        </button>
        <button
          className="go-request-banner__btn go-request-banner__btn--decline"
          disabled={accepting || declining}
          onClick={() => void handleDecline()}
          type="button"
        >
          <X size={15} weight="bold" />
          {declining ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}
