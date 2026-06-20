type EventCardMiniProps = {
  title: string;
  category: string;
  venue: string;
  dateLabel: string;
  statusLabel: string;
  statusTone: "live" | "draft" | "sold";
  sold: number;
  capacity: number | null;
  soldRatio: number;
  revenue: number;
  posts: number;
};

const STATUS_CFG: Record<
  EventCardMiniProps["statusTone"],
  { pill: string; bar: string; accent: string; dot: boolean }
> = {
  live:  { pill: "bg-[var(--brand)]/12 text-[var(--brand)]",    bar: "var(--brand)",   accent: "rgba(47,143,69,0.06)",  dot: true  },
  draft: { pill: "bg-[var(--bg-muted)] text-[var(--text-tertiary)]", bar: "#a9a9a9",  accent: "transparent",           dot: false },
  sold:  { pill: "bg-amber-500/12 text-amber-500",              bar: "#f59e0b",        accent: "rgba(245,158,11,0.05)", dot: false },
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EventCardMini({
  title,
  category,
  venue,
  dateLabel,
  statusLabel,
  statusTone,
  sold,
  capacity,
  soldRatio,
  revenue,
  posts,
}: EventCardMiniProps) {
  const cfg = STATUS_CFG[statusTone];

  return (
    <article
      className="relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_2px_16px_rgba(5,12,8,0.07)] transition-shadow hover:shadow-[0_8px_32px_rgba(5,12,8,0.11)]"
      style={{ background: `linear-gradient(160deg, ${cfg.accent} 0%, var(--bg-card) 100%)` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            {category}
          </p>
          <h3 className="mt-1 truncate text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            {dateLabel} · {venue}
          </p>
        </div>

        {/* Status pill with optional live dot */}
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${cfg.pill}`}
        >
          {cfg.dot && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
            </span>
          )}
          {statusLabel}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Sold</p>
          <p className="mt-1 text-[14px] font-bold tabular-nums text-[var(--text-primary)]">
            {capacity ? `${sold}/${capacity}` : sold.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Revenue</p>
          <p className="mt-1 text-[14px] font-bold tabular-nums text-[var(--text-primary)]">
            {revenue > 0 ? formatMoney(revenue) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Posts</p>
          <p className="mt-1 text-[14px] font-bold tabular-nums text-[var(--text-primary)]">{posts}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-2.5 rounded-full transition-[width] duration-700"
            style={{ width: `${soldRatio}%`, background: cfg.bar }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          {capacity
            ? soldRatio >= 80
              ? `${soldRatio}% sold — almost full`
              : `${soldRatio}% of capacity`
            : "Open-capacity event"}
        </p>
      </div>
    </article>
  );
}

export default EventCardMini;
