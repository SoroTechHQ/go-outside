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
  snippets: number;
};

const STATUS_CLASSNAME: Record<EventCardMiniProps["statusTone"], string> = {
  live: "bg-[var(--brand)]/12 text-[var(--brand)]",
  draft: "bg-[var(--bg-muted)] text-[var(--text-tertiary)]",
  sold: "bg-amber-500/12 text-amber-500",
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
  snippets,
}: EventCardMiniProps) {
  return (
    <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_12px_36px_rgba(5,12,8,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            {category}
          </p>
          <h3 className="mt-1 truncate text-[15px] font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {dateLabel} · {venue}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLASSNAME[statusTone]}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
        <div>
          <p className="text-[var(--text-tertiary)]">Sold</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">
            {capacity ? `${sold}/${capacity}` : sold.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[var(--text-tertiary)]">Revenue</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatMoney(revenue)}</p>
        </div>
        <div>
          <p className="text-[var(--text-tertiary)]">Snippets</p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">{snippets}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-2 rounded-full bg-[var(--brand)] transition-[width]"
            style={{ width: `${soldRatio}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
          {capacity ? `${soldRatio}% of capacity sold` : "Open-capacity event"}
        </p>
      </div>
    </article>
  );
}

export default EventCardMini;
