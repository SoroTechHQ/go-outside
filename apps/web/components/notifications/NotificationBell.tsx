"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRinging,
  Ticket,
  Users,
  CalendarBlank,
  Megaphone,
  X,
  CheckCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export type AppNotification = {
  id: string;
  type: "ticket" | "friend" | "event" | "announcement";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: Date;
  imageUrl?: string;
};

// Simulated notifications — real app would fetch from Supabase
const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "ticket",
    title: "Tickets Confirmed!",
    body: "Your 2 tickets for Afrobeats Night are ready in your wallet.",
    href: "/dashboard/tickets",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "n2",
    type: "friend",
    title: "Kofi Mensah bought tickets",
    body: "Your friend Kofi is going to Chale Wote 2025. Want to join?",
    href: "/",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&w=80&fit=crop&crop=faces",
  },
  {
    id: "n3",
    type: "event",
    title: "Reminder: Ghana Tech Summit",
    body: "Your event starts in 2 days. Don't forget to download your ticket.",
    href: "/dashboard/tickets",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "n4",
    type: "announcement",
    title: "New feature: Trending",
    body: "Discover what's hot in Ghana with our new Trending page.",
    href: "/dashboard/trending",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const ICONS = {
  ticket: Ticket,
  friend: Users,
  event: CalendarBlank,
  announcement: Megaphone,
};

const TYPE_COLORS = {
  ticket: "text-[var(--brand)]",
  friend: "text-blue-500",
  event: "text-amber-500",
  announcement: "text-purple-500",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Sync browser permission state
  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(notification: AppNotification) {
    markRead(notification.id);
    setOpen(false);
    if (notification.href) router.push(notification.href);
  }

  async function requestBrowserNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
    if (perm === "granted") {
      new Notification("GoOutside Notifications Enabled", {
        body: "You'll now receive event and friend updates.",
        icon: "/favicon.ico",
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--bg-muted)] active:scale-95"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {unreadCount > 0 ? (
          <BellRinging size={20} weight="fill" className="text-[var(--brand)]" />
        ) : (
          <Bell size={20} weight="regular" className="text-[var(--text-secondary)]" />
        )}
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-2 z-[80] w-80 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl"
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] text-[var(--brand)] hover:underline"
                    onClick={markAllRead}
                    type="button"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>

            {/* Browser notification prompt */}
            {browserPermission === "default" && (
              <div className="border-b border-[var(--border-subtle)] bg-[var(--brand-dim)] px-4 py-2.5">
                <p className="text-[12px] text-[var(--text-secondary)] mb-1.5">
                  Enable browser notifications to get updates when you're away
                </p>
                <button
                  className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                  onClick={requestBrowserNotifications}
                  type="button"
                >
                  Enable Notifications
                </button>
              </div>
            )}
            {browserPermission === "granted" && (
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--brand-dim)] px-4 py-2">
                <CheckCircle size={14} weight="fill" className="text-[var(--brand)]" />
                <p className="text-[11px] font-medium text-[var(--brand)]">Browser notifications active</p>
              </div>
            )}

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell size={28} weight="light" className="text-[var(--text-tertiary)]" />
                  <p className="text-[13px] text-[var(--text-tertiary)]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type];
                  return (
                    <button
                      key={n.id}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-muted)] ${!n.read ? "bg-[var(--brand-dim)]/40" : ""}`}
                      onClick={() => handleClick(n)}
                      type="button"
                    >
                      <div className="relative shrink-0 mt-0.5">
                        {n.imageUrl ? (
                          <img
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                            src={n.imageUrl}
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-muted)]">
                            <Icon size={16} className={TYPE_COLORS[n.type]} weight="fill" />
                          </div>
                        )}
                        {!n.read && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--brand)] border-2 border-[var(--bg-card)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-tight ${!n.read ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)] line-clamp-2">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
              <button
                className="w-full text-center text-[12px] font-medium text-[var(--brand)] hover:underline"
                onClick={() => { setOpen(false); router.push("/dashboard/notifications"); }}
                type="button"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
