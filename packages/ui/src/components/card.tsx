import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function ShellCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-4 right-4 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--border-default),transparent)]" />
      {children}
    </div>
  );
}
