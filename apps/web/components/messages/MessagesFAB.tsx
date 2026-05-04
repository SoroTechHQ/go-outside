"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChatTeardrop, PaperPlaneTilt, PencilSimple, X } from "@phosphor-icons/react";

export function MessagesFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // Listen for real unread count broadcast from MessagesShell
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail ?? 0;
      setUnreadCount(count);
    };
    window.addEventListener("stream:unread", handler);
    return () => window.removeEventListener("stream:unread", handler);
  }, []);

  const openInbox = () => {
    setIsOpen(false);
    router.push("/dashboard/messages");
  };

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
        onClick={() => setIsOpen((v) => !v)}
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
            <span className="text-[9px] font-bold text-black">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </motion.div>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card fixed bottom-24 right-6 z-[60] hidden w-[320px] flex-col overflow-hidden md:flex"
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

            <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
              <ChatTeardrop size={32} weight="duotone" className="text-[var(--brand)]/50" />
              <p className="text-sm text-white/50">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
                  : "Your conversations are ready"}
              </p>
            </div>

            <div className="border-t border-white/5 px-4 py-3 flex gap-2">
              <button
                className="flex flex-1 items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left text-sm text-white/72 transition hover:bg-white/[0.05]"
                onClick={openInbox}
                type="button"
              >
                <span>Open inbox</span>
                <PaperPlaneTilt size={16} className="text-[var(--brand)]" weight="bold" />
              </button>
              <button
                aria-label="Compose new message"
                className="flex items-center justify-center rounded-2xl bg-[var(--brand)]/15 px-4 py-3 text-[var(--brand)] transition hover:bg-[var(--brand)]/25"
                onClick={() => { setIsOpen(false); router.push("/dashboard/messages"); }}
                type="button"
              >
                <PencilSimple size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default MessagesFAB;
