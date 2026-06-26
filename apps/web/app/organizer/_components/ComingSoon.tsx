import type { Icon } from "@phosphor-icons/react/dist/lib/types";

interface ComingSoonProps {
  icon: Icon;
  title: string;
  description: string;
  color?: string;
}

export function ComingSoon({ icon: Icon, title, description, color = "var(--brand)" }: ComingSoonProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <Icon size={30} weight="duotone" style={{ color }} />
      </div>
      <h2 className="mt-5 text-[20px] font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-secondary)]">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
        Coming soon
      </span>
    </div>
  );
}
