"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, WhatsappLogo, TwitterLogo, Link, CheckCircle, Confetti } from "@phosphor-icons/react";
import { useState } from "react";

interface ShareEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventSlug: string;
  justPublished?: boolean;
}

export function ShareEventModal({ isOpen, onClose, eventTitle, eventSlug, justPublished = false }: ShareEventModalProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const eventUrl = `https://www.gooutside.club/events/${eventSlug}`;

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  function copyLink() {
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const whatsappText = encodeURIComponent(`Check out this event: ${eventTitle} — ${eventUrl}`);
  const twitterText = encodeURIComponent(`Just published an event on @GoOutsideGH — ${eventTitle} 🎉`);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative z-10 w-full max-w-sm rounded-t-[28px] rounded-b-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
            >
              <X size={15} />
            </button>

            {justPublished ? (
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/12">
                  <Confetti size={24} weight="fill" className="text-[var(--brand)]" />
                </div>
                <p className="mt-3 text-[16px] font-bold text-[var(--text-primary)]">Your event is live!</p>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Share it with your community to start selling tickets.</p>
              </div>
            ) : (
              <p className="mb-5 text-[15px] font-bold text-[var(--text-primary)]">Share event</p>
            )}

            <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{eventTitle}</p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">{eventUrl}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 px-4 py-3 text-[13px] font-semibold text-[#25D366] transition hover:bg-[#25D366]/18"
              >
                <WhatsappLogo size={17} weight="fill" />
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(eventUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-black/8 dark:bg-white/8 px-4 py-3 text-[13px] font-semibold text-[var(--text-primary)] transition hover:bg-black/14 dark:hover:bg-white/14"
              >
                <TwitterLogo size={17} weight="fill" />
                X / Twitter
              </a>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)]/40"
            >
              {copied ? (
                <>
                  <CheckCircle size={15} weight="fill" className="text-[var(--brand)]" />
                  <span className="text-[var(--brand)]">Link copied!</span>
                </>
              ) : (
                <>
                  <Link size={15} />
                  Copy link
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
