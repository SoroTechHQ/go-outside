import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const variants = {
  primary:
    "bg-[var(--neon)] text-[#020702] shadow-[0_0_18px_rgba(184,255,60,0.25)] hover:brightness-[1.02]",
  ghost:
    "border border-[var(--border-card)] bg-transparent text-[var(--neon)] shadow-[0_0_10px_rgba(184,255,60,0.08)] hover:bg-[var(--bg-muted)]",
  secondary: "border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]",
  danger: "border border-[rgba(232,93,138,0.25)] bg-[rgba(232,93,138,0.12)] text-[var(--pink)]",
};

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: keyof typeof variants;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function Button({
  children,
  className,
  href,
  type = "button",
  variant = "primary",
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={classes} type={type}>{children}</button>;
}
