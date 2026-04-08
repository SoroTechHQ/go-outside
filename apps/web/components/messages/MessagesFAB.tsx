"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatTeardrop, MagnifyingGlass, PaperPlaneTilt, X } from "@phosphor-icons/react";

const conversations = [
  { id: "1", name: "Kofi Mensah", preview: "You going to the rooftop thing?", time: "2m", badge: "A" },
  { id: "2", name: "Sankofa Sessions", preview: "Your tickets are confirmed ✓", time: "1h", badge: "O" },
  { id: "3", name: "Ama Asante", preview: "Are you going??", time: "3h", badge: "A" },
];

export function MessagesFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = 3;

  return (
    <>
      <motion.button
        animate={{
          boxShadow: isOpen
            ? "0 0 24px rgba(95,191,42,0.25)"
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}
        className={`fixed bottom-8 right-8 z-[60] hidden h-[52px] w-[52px] items-center justify-center rounded-full border backdrop-blur-xl transition-colors duration-200 md:flex ${
          isOpen
            ? "border-[var(--brand)]/30 bg-[var(--brand)]/20"
            : "border-white/8 bg-white/6 hover:border-[var(--brand)]/25 hover:bg-[var(--brand)]/15"
        }`}
        onClick={() => setIsOpen((value) => !value)}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              initial={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} weight="bold" className="text-[var(--brand)]" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              initial={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <ChatTeardrop size={22} weight="bold" className="text-white/60" />
            </motion.div>
          )}
        </AnimatePresence>

        {unreadCount > 0 && !isOpen ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)]"
            transition={{ duration: 2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
          >
            <span className="text-[9px] font-bold text-black">{unreadCount}</span>
          </motion.div>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card fixed bottom-24 right-6 z-[60] hidden max-h-[520px] w-[380px] flex-col overflow-hidden md:flex"
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
              <p className="font-display text-2xl italic text-white/90">Messages</p>
              <button
                className="rounded-full p-2 text-white/45 transition hover:bg-white/6 hover:text-white/80"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3">
                <MagnifyingGlass size={16} className="text-white/35" />
                <span className="text-sm text-white/30">Search conversations...</span>
              </div>
            </div>

            <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-2 py-2">
              {conversations.map((conversation, index) => (
                <motion.button
                  key={conversation.id}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.04]"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: index * 0.03, duration: 0.18 }}
                  type="button"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/15 text-sm font-semibold text-[var(--brand)]">
                    {conversation.badge}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white/90">
                        {conversation.name}
                      </p>
                      <span className="text-xs text-white/40">{conversation.time}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-white/50">{conversation.preview}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="border-t border-white/5 px-4 py-3">
              <button className="flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left text-sm text-white/72 transition hover:bg-white/[0.05]" type="button">
                <span>Start a new conversation</span>
                <PaperPlaneTilt size={16} className="text-[var(--brand)]" weight="bold" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default MessagesFAB;
