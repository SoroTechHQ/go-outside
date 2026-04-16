"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import type { LandingEvent } from "../../lib/landing-data";

interface LockModalProps {
  event:   LandingEvent | null;
  onClose: () => void;
}

export function LockModal({ event, onClose }: LockModalProps) {
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Focus trap
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  return (
    <AnimatePresence>
      {event !== undefined && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[4px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[420px] rounded-[24px] border border-[rgba(95,191,42,0.10)] bg-[#0D140D] p-8 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-[#6B8C6B] transition hover:text-[#F5FFF0]"
            >
              <X size={15} />
            </button>

            {/* Lock icon */}
            <div className="mb-4 flex justify-center">
              <div className="rounded-[12px] bg-[rgba(95,191,42,0.10)] p-3">
                <Lock size={40} color="#5FBF2A" />
              </div>
            </div>

            {/* Title */}
            <h2
              className="mb-2 text-center text-[22px] font-normal italic text-[#F5FFF0]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Create a free account to continue
            </h2>

            {/* Subtitle */}
            <p className="mb-6 text-center text-[14px] font-light leading-relaxed text-[#6B8C6B]">
              Save events, buy tickets, and discover what your friends are going to.
            </p>

            {/* Event preview strip */}
            {event && (
              <div className="mb-5 flex items-center gap-3 rounded-[12px] bg-[#080D08] p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px]">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-[14px] font-normal italic text-[#F5FFF0]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#6B8C6B]">{event.date}</p>
                </div>
              </div>
            )}

            {/* Primary CTA */}
            <Link
              ref={firstFocusRef}
              href="/sign-up"
              className="mb-3 flex h-12 w-full items-center justify-center rounded-full bg-[#5FBF2A] text-[14px] font-bold text-[#020702] shadow-[0_0_18px_rgba(95,191,42,0.25)] transition hover:brightness-110"
            >
              Create free account →
            </Link>

            {/* Sign in link */}
            <p className="text-center text-[13px] text-[#6B8C6B]">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#5FBF2A] underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
