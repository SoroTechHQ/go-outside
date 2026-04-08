import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { ShellCard } from "./card";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <ShellCard>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl italic text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Last 6 months
        </span>
      </div>
      {children}
    </ShellCard>
  );
}

export function LineSpark({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values);
  const width = 320;
  const height = 140;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={cn("h-40 w-full", className)} viewBox={`0 0 ${width} ${height}`} fill="none">
      <path d={`M 0 ${height - 10} H ${width}`} stroke="var(--border-subtle)" strokeDasharray="4 6" />
      <polyline
        fill="none"
        points={points}
        stroke="var(--neon)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - (value / max) * (height - 20) - 10;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" fill="var(--bg-card)" stroke="var(--neon)" strokeWidth="2" />;
      })}
    </svg>
  );
}

export function BarStripes({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex h-40 items-end gap-3">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div
              className="w-full rounded-full bg-[linear-gradient(180deg,var(--brand),rgba(95,191,42,0.24))]"
              style={{ height: `${Math.max((value / max) * 144, 24)}px` }}
            />
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)]">W{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutLegend({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const palette = [
    "var(--neon)",
    "var(--blue)",
    "var(--pink)",
    "#D7F96D",
    "#91B67E",
    "#688A64",
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[180px,1fr]">
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-[var(--border-card)] bg-[conic-gradient(var(--neon)_0_32%,var(--blue)_32%_53%,var(--pink)_53%_69%,#D7F96D_69%_83%,#91B67E_83%_92%,#688A64_92%_100%)]">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-card)] text-center">
          <div>
            <div className="font-display text-2xl italic text-[var(--text-primary)]">{total}</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Mix</div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index] }} />
              <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
