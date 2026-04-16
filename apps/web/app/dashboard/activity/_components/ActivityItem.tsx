"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { AppIcon } from "@gooutside/ui";
import type { ActivityEvent } from "../../../api/activity/route";

const ACCENT_CLASSES: Record<ActivityEvent["accentTone"], string> = {
  brand:  "bg-[var(--brand)]/10 text-[var(--brand)]",
  gold:   "bg-amber-500/10 text-amber-400",
  red:    "bg-red-500/10 text-red-400",
  blue:   "bg-sky-500/10 text-sky-400",
  purple: "bg-violet-500/10 text-violet-400",
};

interface ActivityItemProps {
  item:   ActivityEvent;
  index:  number;
}

export function ActivityItem({ item, index }: ActivityItemProps) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className={`group flex items-start gap-4 rounded-[18px] border bg-[var(--bg-card)] px-4 py-3.5 transition-colors ${
        !item.isRead
          ? "border-[var(--brand)]/30 shadow-[0_0_0_1px_var(--brand)/10]"
          : "border-[var(--border-subtle)] hover:border-[var(--brand)]/20"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${ACCENT_CLASSES[item.accentTone]}`}
      >
        <AppIcon name={item.iconKey} size={18} weight="bold" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
          {item.subtitle}
        </p>
      </div>

      {/* Timestamp + unread dot */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          {timeAgo}
        </span>
        {!item.isRead && (
          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
        )}
      </div>
    </motion.div>
  );

  if (item.actionHref) {
    return (
      <Link href={item.actionHref} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}
