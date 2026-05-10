import type { ReactNode } from "react";
import { ShellCard, cn } from "@gooutside/ui";

export type AccentTone = "brand" | "cyan" | "violet" | "coral" | "amber";

const accentMap: Record<AccentTone, string> = {
  brand: "var(--brand)",
  cyan: "var(--accent-cyan)",
  violet: "var(--accent-violet)",
  coral: "var(--accent-coral)",
  amber: "var(--accent-amber)",
};

export function getAccentColor(tone: AccentTone) {
  return accentMap[tone];
}

export function accentTextClass(tone: AccentTone) {
  return {
    brand: "text-[var(--brand)]",
    cyan: "text-[var(--accent-cyan)]",
    violet: "text-[var(--accent-violet)]",
    coral: "text-[var(--accent-coral)]",
    amber: "text-[var(--accent-amber)]",
  }[tone];
}

export function accentSurfaceClass(tone: AccentTone) {
  return {
    brand: "border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.1)]",
    cyan: "border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.1)]",
    violet: "border-[rgba(167,139,250,0.18)] bg-[rgba(167,139,250,0.1)]",
    coral: "border-[rgba(251,113,133,0.18)] bg-[rgba(251,113,133,0.1)]",
    amber: "border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.1)]",
  }[tone];
}

export function PageGuide({
  title,
  tips,
}: {
  title: string;
  tips: string[];
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--accent-cyan)]">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <ul className="mt-1.5 space-y-0.5">
          {tips.map((tip) => (
            <li key={tip} className="text-xs leading-5 text-[var(--text-secondary)]">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  trend,
  accent = "brand",
  meta,
}: {
  label: string;
  value: string;
  trend: string;
  accent?: AccentTone;
  meta?: string;
}) {
  return (
    <ShellCard className="bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent),var(--bg-card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
        </div>
        <span className={cn("text-xs font-semibold", accentTextClass(accent))}>{trend}</span>
      </div>
      {meta ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{meta}</p> : null}
    </ShellCard>
  );
}

export function SectionBlock({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShellCard className={className}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </ShellCard>
  );
}

export function AccentDot({ tone }: { tone: AccentTone }) {
  return (
    <span
      className="inline-flex h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: getAccentColor(tone) }}
    />
  );
}

export function MiniPill({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: AccentTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        accentSurfaceClass(tone),
        accentTextClass(tone),
      )}
    >
      {children}
    </span>
  );
}

export function DemoSwatch({
  tone,
  name,
  value,
}: {
  tone: AccentTone;
  name: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-2xl border border-white/10"
          style={{ backgroundColor: getAccentColor(tone) }}
        />
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{name}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-3">
      {names.map((name, index) => (
        <div
          key={name}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--bg-card)] text-xs font-bold text-[#08110b]"
          style={{ backgroundColor: Object.values(accentMap)[index % Object.values(accentMap).length] }}
        >
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      ))}
    </div>
  );
}

export function ProgressRow({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: AccentTone;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className={cn("font-semibold", accentTextClass(tone))}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-2 rounded-full"
          style={{ width: `${value}%`, backgroundColor: getAccentColor(tone) }}
        />
      </div>
    </div>
  );
}
