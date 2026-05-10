"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@gooutside/ui";

export type AdminBtnVariant = "primary" | "danger" | "warning" | "ghost" | "info";

const variantStyles: Record<AdminBtnVariant, string> = {
  // Green — Activate, Approve, Verify, Publish, Create
  primary:
    "bg-[var(--brand)] text-[#071209] border border-[var(--brand)] hover:opacity-85",
  // Red/coral — Suspend, Reject, Refund, Delete
  danger:
    "bg-[rgba(251,113,133,0.14)] text-[var(--accent-coral)] border border-[rgba(251,113,133,0.32)] hover:bg-[rgba(251,113,133,0.24)]",
  // Amber — Feature, Flag, Review
  warning:
    "bg-[rgba(251,191,36,0.12)] text-[var(--accent-amber)] border border-[rgba(251,191,36,0.28)] hover:bg-[rgba(251,191,36,0.22)]",
  // Muted — View, Edit, Dismiss
  ghost:
    "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
  // Cyan — Lens, Analytics, behavioral
  info:
    "bg-[rgba(56,189,248,0.1)] text-[var(--accent-cyan)] border border-[rgba(56,189,248,0.22)] hover:bg-[rgba(56,189,248,0.18)]",
};

const base =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap select-none active:scale-[0.97]";

type AdminBtnProps = {
  children: ReactNode;
  variant?: AdminBtnVariant;
  disabled?: boolean;
  isPending?: boolean;
  pendingLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

type AdminLinkProps = {
  children: ReactNode;
  variant?: AdminBtnVariant;
  href: string;
  target?: string;
  rel?: string;
  className?: string;
};

export function AdminBtn({
  children,
  variant = "ghost",
  disabled,
  isPending,
  pendingLabel,
  onClick,
  type = "button",
  className,
}: AdminBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled ?? isPending}
      className={cn(base, variantStyles[variant], className)}
    >
      {isPending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function AdminLinkBtn({
  children,
  variant = "ghost",
  href,
  target,
  rel,
  className,
}: AdminLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(base, variantStyles[variant], className)}
    >
      {children}
    </Link>
  );
}
