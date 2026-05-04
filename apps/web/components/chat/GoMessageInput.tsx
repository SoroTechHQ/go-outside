"use client";

import { useRef, useState, useMemo } from "react";
import { ImageSquare, LockSimple, PaperPlaneTilt, SpinnerGap, X } from "@phosphor-icons/react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { compressChatImage } from "../../lib/chat/compress-image";

type UploadState = "idle" | "compressing" | "uploading";

function useRequestState() {
  const { channel } = useChannelStateContext("GoMessageInput");
  const { client } = useChatContext("GoMessageInput");

  const channelData = channel.data as Record<string, unknown> | undefined;
  const channelState = channelData?.go_channel_state as string | undefined;
  const initiatedBy = channelData?.go_initiated_by as string | undefined;

  const isPending = channelState === "pending";
  const amSender = isPending && initiatedBy === client.userID;
  const amRecipient = isPending && !!initiatedBy && initiatedBy !== client.userID;

  const senderAlreadySent =
    amSender && channel.state.messages.some((m) => m.user?.id === client.userID);

  return {
    isPending,
    amSender,
    amRecipient,
    isLockedAsSender: amSender && senderAlreadySent,
    isLockedAsRecipient: amRecipient,
  };
}

export function GoMessageInput() {
  const { channel } = useChannelStateContext("GoMessageInput");
  const [text, setText] = useState("");
  const [pending, setPending] = useState<{ url: string; file: File } | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  const { isPending, isLockedAsSender, isLockedAsRecipient } = useRequestState();
  const isLocked = isLockedAsSender || isLockedAsRecipient;
  const noMedia = isPending;

  const busy = uploadState !== "idle";
  const canSend = (text.trim().length > 0 || pending !== null) && !busy;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) (e.target as HTMLInputElement).value = "";
    if (!file) return;

    setUploadError(null);
    setUploadState("compressing");

    try {
      const result = await compressChatImage(file);
      const localUrl = URL.createObjectURL(result.file);
      setPending({ url: localUrl, file: result.file });
      setUploadState("idle");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not process image.");
      setUploadState("idle");
    }
  }

  function clearPending() {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    setUploadError(null);
  }

  async function handleSend() {
    if (!canSend) return;

    const messageText = text.trim();
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      if (pending) {
        setUploadState("uploading");
        const { file: uploadedUrl } = await channel.sendImage(pending.file);
        URL.revokeObjectURL(pending.url);
        setPending(null);
        await channel.sendMessage({
          text: messageText || undefined,
          attachments: [{ type: "image", image_url: uploadedUrl, fallback: "Image" }],
        });
        setUploadState("idle");
      } else {
        await channel.sendMessage({ text: messageText });
      }
    } catch {
      setUploadError("Failed to send. Please try again.");
      setUploadState("idle");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // On touch devices Enter = new line; use the send button instead
    if (e.key === "Enter" && !e.shiftKey && !isTouchDevice) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  if (isLocked) {
    return (
      <div className="go-message-input go-message-input--locked">
        <div className="go-message-input__lock">
          <LockSimple size={15} weight="bold" />
          <span>
            {isLockedAsSender
              ? "Waiting for them to accept your request…"
              : "Accept this request above to start replying"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="go-message-input">
      {pending && (
        <div className="go-message-input__preview">
          <div className="go-message-input__preview-wrap">
            <img alt="Attachment preview" className="go-message-input__preview-img" src={pending.url} />
            {uploadState === "uploading" && (
              <div className="go-message-input__preview-overlay">
                <SpinnerGap className="animate-spin text-white" size={20} weight="bold" />
              </div>
            )}
            <button
              aria-label="Remove image"
              className="go-message-input__preview-remove"
              onClick={clearPending}
              type="button"
            >
              <X size={11} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="go-message-input__error">
          <span>{uploadError}</span>
          <button aria-label="Dismiss error" onClick={() => setUploadError(null)} type="button">
            <X size={12} weight="bold" />
          </button>
        </div>
      )}

      <div className="go-message-input__row">
        <button
          aria-label="Attach image"
          className="go-message-input__attach"
          disabled={busy || noMedia}
          onClick={() => fileRef.current?.click()}
          title={noMedia ? "No attachments until request is accepted" : undefined}
          type="button"
        >
          {uploadState === "compressing" ? (
            <SpinnerGap className="animate-spin" size={20} weight="bold" />
          ) : (
            <ImageSquare size={20} weight={pending ? "fill" : "regular"} />
          )}
        </button>

        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileRef}
          type="file"
        />

        <textarea
          className="go-message-input__textarea"
          disabled={uploadState === "uploading"}
          enterKeyHint={isTouchDevice ? "enter" : "send"}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          ref={textareaRef}
          rows={1}
          value={text}
        />

        <button
          aria-label="Send message"
          className={`go-message-input__send ${canSend ? "go-message-input__send--active" : ""}`}
          disabled={!canSend}
          onClick={() => void handleSend()}
          type="button"
        >
          <PaperPlaneTilt size={17} weight="bold" />
        </button>
      </div>
    </div>
  );
}
