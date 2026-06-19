"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";
import {
  Bell,
  BellRinging,
  Ticket,
  Users,
  Megaphone,
  X,
  CheckCircle,
  BookmarkSimple,
  Warning,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  useMarkNotificationsRead,
} from "../../hooks/useNotifications";
import type { NotificationFeedItem } from "../../lib/notification-feed";
import { useAppBootstrap } from "../../hooks/useAppBootstrap";
import { enableBrowserPush, getSavedBrowserPushState } from "../../lib/notifications/browser-push";

const ICON_MAP: Record<string, React.ComponentType<{ size: number; weight: "fill" | "regular"; className: string }>> = {
  ticket: Ticket,
  users: Users,
  user: Users,
  bell: Bell,
  bookmark: BookmarkSimple,
  "warning-circle": Warning,
  megaphone: Megaphone,
  default: Bell,
};

const ACCENT_BG: Record<string, string> = {
  brand: "bg-[var(--brand-dim)] text-[var(--brand)]",
  gold: "bg-amber-500/10 text-amber-400",
  red: "bg-red-500/10 text-red-400",
  blue: "bg-sky-500/10 text-sky-400",
  purple: "bg-violet-500/10 text-violet-400",
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushActive, setPushActive] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { reduceMotion, springs } = useAnimationConfig();
  const { data: bootstrap } = useAppBootstrap();
  const markAllRead = useMarkNotificationsRead();
  const items = bootstrap?.notifications.items ?? [];
  const unreadCount = bootstrap?.notifications.unreadCount ?? 0;

  useEffect(() => {
    if ("Notification" in window) setBrowserPermission(Notification.permission);
    getSavedBrowserPushState()
      .then((result) => {
        setPushActive(result.ok);
        setPushMessage(result.ok ? null : result.message);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function requestBrowserNotifications() {
    setPushBusy(true);
    setPushMessage(null);
    try {
      const result = await enableBrowserPush();
      if ("Notification" in window) setBrowserPermission(Notification.permission);
      setPushActive(result.ok);
      setPushMessage(result.ok ? null : result.message);
      if (result.ok) {
        try {
          new Notification("GoOutside Notifications Enabled", {
            body: "You'll now receive event and friend updates.",
            icon: "/favicon-icon.png",
          });
        } catch {
          // Some mobile browsers only show notifications from the service worker.
        }
      }
    } finally {
      setPushBusy(false);
    }
  }

  function handleItemClick(item: NotificationFeedItem) {
    setOpen(false);
    if (item.actionHref) router.push(item.actionHref);
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--bg-muted)]"
        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
        transition={springs.snappy}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <motion.span
          animate={!reduceMotion && unreadCount > 0 ? { rotate: [0, -12, 10, -8, 6, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {unreadCount > 0 ? (
            <BellRinging size={20} weight="fill" className="text-[var(--brand)]" />
          ) : (
            <Bell size={20} weight="regular" className="text-[var(--text-secondary)]" />
          )}
        </motion.span>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springs.snappy}
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full z-[80] mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0.15 } : springs.gentle}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] text-[var(--brand)] hover:underline disabled:opacity-50"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    type="button"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)]"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>

            {!pushActive && (
              <div className="border-b border-[var(--border-subtle)] bg-[var(--brand-dim)] px-4 py-2.5">
                <p className="mb-1.5 text-[12px] text-[var(--text-secondary)]">
                  {pushMessage ?? "Enable browser notifications to get updates when you're away"}
                </p>
                <button
                  className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  disabled={pushBusy}
                  onClick={requestBrowserNotifications}
                  type="button"
                >
                  {pushBusy ? "Enabling..." : "Enable Notifications"}
                </button>
              </div>
            )}
            {pushActive && (
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--brand-dim)] px-4 py-2">
                <CheckCircle size={14} weight="fill" className="text-[var(--brand)]" />
                <p className="text-[11px] font-medium text-[var(--brand)]">Browser notifications active</p>
              </div>
            )}

            <div className="max-h-80 divide-y divide-[var(--border-subtle)] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell size={28} weight="light" className="text-[var(--text-tertiary)]" />
                  <p className="text-[13px] text-[var(--text-tertiary)]">No notifications yet</p>
                </div>
              ) : (
                items.slice(0, 8).map((item) => {
                  const Icon = ICON_MAP[item.iconKey] ?? ICON_MAP.default;
                  const accentCls = ACCENT_BG[item.accentTone] ?? ACCENT_BG.brand;
                  return (
                    <button
                      key={item.id}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-muted)] ${!item.isRead ? "bg-[var(--brand-dim)]/40" : ""}`}
                      onClick={() => handleItemClick(item)}
                      type="button"
                    >
                      <div className={`relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accentCls}`}>
                        <Icon size={16} weight="fill" className="" />
                        {!item.isRead && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-card)] bg-[var(--brand)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] leading-tight ${!item.isRead ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"}`}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--text-tertiary)]">{item.subtitle}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
              <button
                className="w-full text-center text-[12px] font-medium text-[var(--brand)] hover:underline"
                onClick={() => { setOpen(false); router.push("/notifications"); }}
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
