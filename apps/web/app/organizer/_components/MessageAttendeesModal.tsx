"use client";

import { useState, useEffect } from "react";
import { X, PaperPlaneTilt, Users } from "@phosphor-icons/react";

interface MessageAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  attendeeCount: number;
}

export function MessageAttendeesModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  attendeeCount,
}: MessageAttendeesModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setMessage("");
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  async function handleSend() {
    if (!message.trim()) {
      setError("Message is required.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json() as { sent?: number; error?: string; message?: string };
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Failed to send message.");
      } else {
        setResult({ sent: data.sent ?? 0 });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              Message attendees
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)] truncate max-w-[260px]">
              {eventName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Audience indicator */}
          <div className="flex items-center gap-2.5 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5">
            <Users size={16} className="shrink-0 text-[var(--brand)]" />
            <p className="text-[13px] text-[var(--text-secondary)]">
              Sending to{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {attendeeCount} ticket holder{attendeeCount !== 1 ? "s" : ""}
              </span>{" "}
              via in-app notification
            </p>
          </div>

          {/* Result state */}
          {result ? (
            <div className="rounded-[16px] border border-green-500/20 bg-green-500/8 p-4 text-center">
              <p className="text-[15px] font-semibold text-green-600 dark:text-green-400">
                Message sent!
              </p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Notified {result.sent} attendee{result.sent !== 1 ? "s" : ""}.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-full bg-[var(--brand)] px-5 py-2 text-[13px] font-semibold text-black hover:bg-[#4fa824]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                  Subject <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                  placeholder={`Update about ${eventName}`}
                  className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="What do you want to tell your attendees?"
                  className="w-full resize-none rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
                />
                <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
                  {message.length}/500
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-[12px] border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-[13px] text-red-500">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !message.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97] disabled:opacity-50"
                >
                  <PaperPlaneTilt size={14} weight="fill" />
                  {isSending ? "Sending…" : "Send message"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
