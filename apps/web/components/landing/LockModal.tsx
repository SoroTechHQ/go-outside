"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CalendarBlank, Ticket } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import type { LandingEvent } from "../../lib/landing-data";

interface LockModalProps {
  event:   LandingEvent | null;
  onClose: () => void;
}

export function LockModal({ event, onClose }: LockModalProps) {
  const primaryRef = useRef<HTMLAnchorElement>(null);

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
    primaryRef.current?.focus();
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[6px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[400px] overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Event image hero */}
            {event && (
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Price badge */}
                <div className="absolute bottom-3 left-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold shadow-lg ${
                      event.isFree
                        ? "bg-[#2f8f45] text-white"
                        : "bg-white text-[#0f110f]"
                    }`}
                  >
                    <Ticket size={13} weight="fill" />
                    {event.isFree ? "Free entry" : `From ${event.price}`}
                  </span>
                </div>

                {/* Category pill */}
                <div className="absolute right-4 bottom-3">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {event.category}
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {event && (
                <div className="mb-5">
                  <h2
                    className="mb-3 text-[20px] font-bold leading-snug text-[#0f110f]"
                  >
                    {event.title}
                  </h2>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[13px] text-[#6f6f6f]">
                      <CalendarBlank size={13} className="shrink-0 text-[#2f8f45]" />
                      {event.date}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-[13px] text-[#6f6f6f]">
                        <MapPin size={13} className="shrink-0 text-[#2f8f45]" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="mb-5 h-px bg-black/[0.06]" />

              <p className="mb-4 text-center text-[13px] font-light leading-relaxed text-[#6f6f6f]">
                Sign in to buy tickets, save this event, and see which friends are going.
              </p>

              {/* Primary CTA — sign in */}
              <Link
                ref={primaryRef}
                href="/sign-in"
                className="mb-2.5 flex h-12 w-full items-center justify-center rounded-full bg-[#2f8f45] text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(47,143,69,0.30)] transition hover:bg-[#256f36]"
              >
                Sign in to get tickets
              </Link>

              {/* Secondary CTA — sign up */}
              <Link
                href="/sign-up"
                className="flex h-12 w-full items-center justify-center rounded-full border border-black/[0.10] text-[14px] font-medium text-[#0f110f] transition hover:bg-black/[0.03]"
              >
                New here? Create free account
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
