import Link from "next/link";
import { MapPin, CalendarDots, HeartStraight } from "@phosphor-icons/react/dist/ssr";
import type { Category, EventItem, Organizer } from "@gooutside/demo-data";
import { AppIcon } from "./icon";
import { ShellCard } from "./card";
import { StatusPill } from "./badge";

export function EventCard({
  event,
  category,
  organizer,
}: {
  event: EventItem;
  category: Category;
  organizer: Organizer;
}) {
  const priceTone = event.priceValue === 0 ? "free" : "paid";
  const statusTone = event.status === "pending" ? "pending" : event.status === "review" ? "review" : "live";

  return (
    <ShellCard className="p-0">
      <Link href={`/events/${event.slug}`} className="block">
        <div className={`relative h-32 bg-gradient-to-br ${event.bannerTone}`}>
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <StatusPill tone={statusTone}>{event.status}</StatusPill>
            {event.trending ? <StatusPill tone="paid">Trending</StatusPill> : null}
          </div>
          <button
            aria-label="Save event"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[var(--text-primary)] backdrop-blur"
            type="button"
          >
            <HeartStraight size={18} weight={event.saved ? "fill" : "regular"} />
          </button>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
            <AppIcon name={category.iconKey} size={14} />
            {category.name}
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--neon)]">{event.eyebrow}</p>
            <h3 className="mt-2 font-display text-2xl italic text-[var(--text-primary)]">{event.title}</h3>
          </div>

          <p className="text-sm leading-6 text-[var(--text-secondary)]">{event.shortDescription}</p>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <CalendarDots size={18} />
              <span>{event.dateLabel} · {event.timeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{event.locationLine}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{organizer.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{organizer.tag}</p>
            </div>
            <StatusPill tone={priceTone}>{event.priceLabel}</StatusPill>
          </div>
        </div>
      </Link>
    </ShellCard>
  );
}
