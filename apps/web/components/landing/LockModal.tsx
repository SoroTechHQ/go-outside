"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import type { LandingEvent } from "../../lib/landing-data";

interface LockModalProps {
  event:   LandingEvent | null;
  onClose: () => void;
}

export function LockModal({ event, onClose }: LockModalProps) {
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[420px] rounded-[24px] border border-black/[0.08] bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-[#6f6f6f] transition hover:text-[#0f110f]"
            >
              <X size={15} />
            </button>

            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="rounded-[12px] bg-[rgba(47,143,69,0.10)] p-3">
                <Ticket size={40} color="#2f8f45" />
              </div>
            </div>

            {/* Title */}
            <h2
              className="mb-2 text-center text-[22px] font-normal italic text-[#0f110f]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Ready to go out?
            </h2>

            {/* Subtitle */}
            <p className="mb-6 text-center text-[14px] font-light leading-relaxed text-[#6f6f6f]">
              Create a free account to save events, get tickets, and see what your friends are attending.
            </p>

            {/* Event preview strip */}
            {event && (
              <div className="mb-5 flex items-center gap-3 rounded-[12px] bg-[#f8faf8] p-3">
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
                    className="truncate text-[14px] font-normal italic text-[#0f110f]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#6f6f6f]">{event.date}</p>
                </div>
              </div>
            )}

            {/* Primary CTA */}
            <Link
              ref={firstFocusRef}
              href="/sign-up"
              className="mb-3 flex h-12 w-full items-center justify-center rounded-full bg-[#2f8f45] text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(47,143,69,0.30)] transition hover:bg-[#256f36]"
            >
              Create an account →
            </Link>

            {/* Sign in link */}
            <p className="text-center text-[13px] text-[#6f6f6f]">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#2f8f45] underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
