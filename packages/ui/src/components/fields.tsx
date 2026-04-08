import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
      {children}
    </label>
  );
}

export function TextInput({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none",
        className,
      )}
      readOnly
      value={value}
    />
  );
}

export function TextArea({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-3xl border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none",
        className,
      )}
      readOnly
      value={value}
    />
  );
}

export function FauxSelect({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-primary)]">
      {value}
    </div>
  );
}
