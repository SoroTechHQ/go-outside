import Image from "next/image";
import Link from "next/link";
import { CalendarDots, HeartStraight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getEventImage, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";

export function EventCard({
  event,
  category,
  organizer,
}: {
  event: EventItem;
  category: Category;
  organizer: Organizer;
}) {
  const primaryChip = event.trending ? "Trending" : event.status;

  return (
    <article className="group h-full rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[0_12px_30px_rgba(18,32,19,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(18,32,19,0.12)]">
      <Link className="flex h-full flex-col" href={`/events/${event.slug}`}>
        <div className="relative overflow-hidden rounded-t-[12px]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                {primaryChip}
              </span>
              <span className="rounded-full border border-white/12 bg-white/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/92 backdrop-blur">
                {category.name}
              </span>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/28 text-white backdrop-blur">
              <HeartStraight size={17} weight={event.saved ? "fill" : "regular"} />
            </span>
          </div>

          <div className="relative h-48 overflow-hidden rounded-t-[12px] bg-[var(--bg-card-alt)]">
            <Image
              alt={event.title}
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
              src={getEventImage(undefined, event.categorySlug)}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,8,0.12),rgba(7,12,8,0.38))]" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-1 pb-1 pt-4">
          <div className="flex flex-wrap gap-2">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
              >
                {tag.replaceAll("-", " ")}
              </span>
            ))}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              {event.eyebrow}
            </p>
            <h3 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
              {event.title}
            </h3>
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
            {event.shortDescription}
          </p>

          <div className="space-y-2.5 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2.5">
              <CalendarDots size={16} />
              <span>
                {event.dateLabel} · {event.timeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} />
              <span>{event.locationLine}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{organizer.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{organizer.tag}</p>
            </div>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
              {event.priceLabel}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
