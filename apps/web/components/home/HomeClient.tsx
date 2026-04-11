"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookmarkSimple,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  Fire,
  HeartStraight,
  MapPin,
  Sparkle,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import {
  categories,
  events,
  getCategoryEmoji,
  getEventImage,
  getOrganizerById,
  getRecommendedEvents,
} from "@gooutside/demo-data";
import HomeSearchHero from "../search/HomeSearchHero";

const FRIEND_CLUSTERS = [
  { labels: ["Ama", "Yaw"], note: "bought tickets together" },
  { labels: ["Kofi", "Esi"], note: "saved this event" },
  { labels: ["Jojo"], note: "rated it 5 stars" },
];

const PULSE_BADGES = ["Gold badge x3", "Night owl"];

function buildResultList(source: typeof events, limit: number, excludeSlugs: string[] = []) {
  return source.filter((event) => !excludeSlugs.includes(event.slug)).slice(0, limit);
}

function CardHoverActions() {
  return (
    <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-[var(--brand)]"
        type="button"
      >
        <HeartStraight size={16} weight="regular" />
      </button>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-[var(--brand)]"
        type="button"
      >
        <BookmarkSimple size={16} weight="regular" />
      </button>
    </div>
  );
}

function ImageCard({
  event,
  compact = false,
  featured = false,
}: {
  event: (typeof events)[number];
  compact?: boolean;
  featured?: boolean;
}) {
  const imageUrl = getEventImage(undefined, event.categorySlug);

  return (
    <div className={`group overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]`}>
      <Link className="block" href={`/events/${event.slug}`}>
        <div className={`relative overflow-hidden ${featured ? "aspect-[1.55/1]" : compact ? "aspect-[1.04/1]" : "aspect-[1.2/1]"}`}>
          <div
            aria-label={event.title}
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
            role="img"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.18)_45%,rgba(0,0,0,0.72)_100%)]" />
          <div className="absolute left-3 top-3 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
          </div>
          <CardHoverActions />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className={`font-semibold tracking-[-0.03em] ${compact ? "text-[1rem]" : "text-[1.3rem]"}`}>
              {event.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.78rem] text-white/88">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/28 px-2.5 py-1 backdrop-blur-sm">
                <CalendarBlank size={12} weight="regular" />
                {event.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/28 px-2.5 py-1 backdrop-blur-sm">
                <Clock size={12} weight="regular" />
                {event.timeLabel}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{event.venue}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <MapPin size={12} weight="regular" />
              {event.locationLine}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--brand-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)]">
            {event.priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function SponsoredAdCard({ event }: { event: (typeof events)[number] }) {
  const imageUrl = getEventImage(undefined, event.categorySlug);

  return (
    <Link
      className="group block overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow-strong)]"
      href={`/events/${event.slug}`}
    >
      <div className="relative aspect-[4.9/1] min-h-[180px] overflow-hidden">
        <div
          aria-label={event.title}
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
          role="img"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,6,0.76)_0%,rgba(5,8,6,0.42)_42%,rgba(5,8,6,0.18)_100%)]" />

        <div className="absolute right-5 top-5 flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/22 text-white backdrop-blur-sm">
            <ArrowRight className="rotate-180" size={20} weight="bold" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/22 text-white backdrop-blur-sm">
            <ArrowRight size={20} weight="bold" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-black/45 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-white">
              Sponsored
            </span>
            <span className="rounded-full border border-[var(--brand)] bg-[rgba(47,143,69,0.18)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[#8bd98f]">
              Tech
            </span>
          </div>

          <h3 className="max-w-[540px] text-[1.65rem] font-semibold tracking-[-0.04em] text-white md:text-[1.85rem]">
            {event.title}
          </h3>
          <p className="mt-2 max-w-[620px] text-[0.92rem] text-white/82">
            {event.dateLabel} · {event.timeLabel} · {event.venue}, {event.city}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/12 px-4 py-2.5 text-[0.95rem] font-semibold text-white backdrop-blur-sm">
              {event.priceValue === 0 ? "Free" : event.priceLabel}
            </span>
            <span className="rounded-full bg-[#7ed03d] px-6 py-2.5 text-[0.95rem] font-semibold text-white">
              Get Tickets →
            </span>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
          <span className="h-3 w-3 rounded-full bg-white/45" />
          <span className="h-3 w-3 rounded-full bg-[#7ed03d]" />
          <span className="h-3 w-3 rounded-full bg-white/45" />
        </div>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  linkHref,
}: {
  eyebrow: string;
  title: string;
  linkHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.7rem]">
          {title}
        </h2>
      </div>
      {linkHref ? (
        <Link
          className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium text-[var(--brand)] md:inline-flex"
          href={linkHref}
        >
          See all
          <ArrowRight size={14} weight="bold" />
        </Link>
      ) : null}
    </div>
  );
}

export function HomeClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategories = useMemo(
    () => searchParams.get("category")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const when = (searchParams.get("when") ?? "").trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(event.categorySlug);
      const queryMatch =
        query.length === 0 ||
        `${event.title} ${event.venue} ${event.city} ${event.shortDescription}`
          .toLowerCase()
          .includes(query);
      const whenMatch =
        when.length === 0 ||
        `${event.dateLabel} ${event.timeLabel} ${event.eyebrow}`.toLowerCase().includes(when);
      return categoryMatch && queryMatch && whenMatch;
    });
  }, [query, selectedCategories, when]);

  const recommended = useMemo(() => getRecommendedEvents(), []);
  const sponsoredEvent = filteredEvents.find((event) => event.categorySlug === "tech") ?? filteredEvents[0] ?? events[0];
  const socialEvents = buildResultList(filteredEvents.length > 0 ? filteredEvents : events, 3, [sponsoredEvent?.slug ?? ""]);
  const forYouLead = recommended[0] ?? filteredEvents[0] ?? events[0];
  const forYouCards = buildResultList(recommended.length > 0 ? recommended : events, 3, [forYouLead?.slug ?? ""]);
  const trendingCards = buildResultList(
    filteredEvents.filter((event) => event.trending).length > 0
      ? filteredEvents.filter((event) => event.trending)
      : events.filter((event) => event.trending),
    2,
  );

  const updateCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(selectedCategories);

    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }

    if (next.size > 0) {
      params.set("category", Array.from(next).join(","));
    } else {
      params.delete("category");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasFilters = selectedCategories.length > 0 || query.length > 0 || when.length > 0;

  return (
    <main className="page-grid min-h-screen pb-28">
      <div className="container-shell px-4 pt-6 md:hidden">
        <HomeSearchHero mode="mobile" />
      </div>

      <div className="container-shell px-4 pt-3 md:px-6">
        {hasFilters ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--home-shadow)]">
            <span className="font-medium text-[var(--text-primary)]">
              {filteredEvents.length} result{filteredEvents.length === 1 ? "" : "s"} for your current plan
            </span>
            <button
              className="rounded-full border border-[var(--home-highlight-border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]"
              onClick={clearFilters}
              type="button"
            >
              Reset
            </button>
          </div>
        ) : null}
      </div>

      <div className="container-shell grid gap-8 px-4 pt-2 md:px-6 xl:grid-cols-[minmax(0,1fr)_288px]">
        <div>
          {sponsoredEvent ? (
            <section>
              <SectionHeading eyebrow="Sponsored" title="Sponsored ads" />
              <SponsoredAdCard event={sponsoredEvent} />
            </section>
          ) : null}

          <section className="mt-6">
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedCategories.length === 0
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
                onClick={clearFilters}
                type="button"
              >
                All events
              </button>
              {categories.map((category) => {
                const active = selectedCategories.includes(category.slug);
                return (
                  <button
                    key={category.slug}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    }`}
                    onClick={() => updateCategory(category.slug)}
                    type="button"
                  >
                    {getCategoryEmoji(category.slug)} {category.name}
                  </button>
                );
              })}
            </div>
          </section>

          {socialEvents.length > 0 ? (
            <section className="mt-8">
              <SectionHeading eyebrow="Friends" linkHref="/dashboard/notifications" title="Where your people are going" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_0.75fr]">
                <ImageCard featured event={socialEvents[0] as (typeof events)[number]} />
                <div className="grid gap-4">
                  {socialEvents.slice(1).map((event) => (
                    <ImageCard key={event.id} compact event={event} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {forYouLead ? (
            <section className="mt-8">
              <SectionHeading eyebrow="For you" linkHref="/events" title="Next best plan" />
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <ImageCard featured event={forYouLead} />
                <div className="grid gap-4">
                  {forYouCards.map((event) => (
                    <ImageCard key={event.id} compact event={event} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {trendingCards.length > 0 ? (
            <section className="mt-8">
              <SectionHeading eyebrow="Trending" linkHref="/events" title="Moving across Accra" />
              <div className="grid gap-4 md:grid-cols-2">
                {trendingCards.map((event) => (
                  <ImageCard key={event.id} compact event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[118px] xl:self-start">
          <section className="rounded-[var(--radius-card-lg)] border border-[var(--pulse-gold-border)] bg-[linear-gradient(180deg,#fffdf9,#fbf6ed)] p-5 shadow-[var(--home-shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pulse-gold)]">
                  Your Pulse
                </p>
                <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  Scene Kid
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">153 pts to City Native</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--pulse-gold)] bg-white/80">
                <span className="text-[1.3rem] font-semibold text-[var(--pulse-gold)]">847</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                <span>Scene Kid</span>
                <span>City Native</span>
              </div>
              <div className="h-2 rounded-full bg-[rgba(var(--pulse-gold-rgb),0.12)]">
                <div className="h-2 w-[62%] rounded-full bg-[var(--pulse-gold)]" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PULSE_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--pulse-gold-border)] bg-[var(--pulse-gold-soft)] px-3 py-1 text-[0.68rem] font-semibold text-[var(--pulse-gold)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                  Friendtivities
                </p>
                <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  Plans in motion
                </h3>
              </div>
              <Link className="text-xs font-medium text-[var(--brand)]" href="/dashboard/notifications">
                See all
              </Link>
            </div>

            <div className="space-y-2.5">
              {(trendingCards.length > 0 ? trendingCards : events.slice(0, 2)).map((event, index) => {
                const cluster = FRIEND_CLUSTERS[index % FRIEND_CLUSTERS.length];
                return (
                  <Link
                    key={event.id}
                    className="block rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--brand)]/30"
                    href={`/events/${event.slug}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--home-avatar-bg)] text-[var(--brand)]">
                        <UsersThree size={16} weight="regular" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{cluster.labels.join(", ")}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{cluster.note}</p>
                        <p className="mt-2 truncate text-xs font-medium text-[var(--text-primary)]">{event.title}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendUp size={18} weight="bold" className="text-[var(--brand)]" />
                <h3 className="text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  Trending now
                </h3>
              </div>
              <Link className="text-xs font-medium text-[var(--brand)]" href="/events">
                See all
              </Link>
            </div>

            <div className="space-y-2.5">
              {trendingCards.map((event, index) => (
                <Link
                  key={event.id}
                  className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--brand)]/30"
                  href={`/events/${event.slug}`}
                >
                  <span className="text-lg font-semibold text-[var(--text-tertiary)]">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.locationLine}</p>
                  </div>
                  <Fire size={15} weight="fill" className="text-[var(--brand)]" />
                </Link>
              ))}
            </div>
          </section>

          <Link
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]"
            href="/dashboard/notifications"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--home-avatar-bg)] text-[var(--brand)]">
              <ChatCircleDots size={20} weight="regular" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Messages</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">4 unread conversations</p>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">
              4
            </div>
          </Link>

        </aside>
      </div>
    </main>
  );
}

export default HomeClient;
