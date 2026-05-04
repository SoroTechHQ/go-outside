"use client";

import { useRef, useState } from "react";
import { ImageSquare, PaperPlaneTilt, SpinnerGap, X } from "@phosphor-icons/react";
import { useChannelStateContext } from "stream-chat-react";
import { compressChatImage } from "../../lib/chat/compress-image";

type UploadState = "idle" | "compressing" | "uploading";

export function GoMessageInput() {
  const { channel } = useChannelStateContext("GoMessageInput");
  const [text, setText] = useState("");
  const [pending, setPending] = useState<{ url: string; file: File } | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-grow
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
          disabled={busy}
          onClick={() => fileRef.current?.click()}
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
