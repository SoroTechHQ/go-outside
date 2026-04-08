"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowClockwise, CalendarDots, TrendUp } from "@phosphor-icons/react";
import { EventCard } from "@gooutside/ui";
import type { Category, EventItem, Organizer } from "@gooutside/demo-data";
import { getEventImage } from "@gooutside/demo-data";
import type { HeroSlide } from "./HeroCarousel";

type FeedEntry = {
  key: string;
  category: Category;
  event: EventItem;
  organizer: Organizer;
};

type DiscoveryFeedProps = {
  entries: FeedEntry[];
  onReset: () => void;
  sponsoredSlides: HeroSlide[];
};

function SkeletonCard() {
  return (
    <div className="h-[420px] animate-pulse rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="h-48 rounded-t-[12px] bg-[var(--bg-muted)]" />
      <div className="mt-4 h-3 w-24 rounded-full bg-[var(--bg-muted)]" />
      <div className="mt-3 h-8 w-2/3 rounded-full bg-[var(--bg-muted)]" />
      <div className="mt-4 h-3 w-full rounded-full bg-[var(--bg-muted)]" />
      <div className="mt-2 h-3 w-5/6 rounded-full bg-[var(--bg-muted)]" />
      <div className="mt-6 h-3 w-1/2 rounded-full bg-[var(--bg-muted)]" />
      <div className="mt-2 h-3 w-2/3 rounded-full bg-[var(--bg-muted)]" />
    </div>
  );
}

function SectionMarker({ label }: { label: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] shadow-[0_0_0_6px_rgba(var(--brand-rgb),0.12)]" />
      <p className="font-display text-sm italic text-[var(--text-secondary)]">{label}</p>
      <span className="h-px flex-1 bg-[var(--border-subtle)]" />
    </div>
  );
}

export function DiscoveryFeed({ entries, onReset, sponsoredSlides }: DiscoveryFeedProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(12);
    setInitialLoading(true);
    const timeout = window.setTimeout(() => setInitialLoading(false), 300);
    return () => window.clearTimeout(timeout);
  }, [entries]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || initialLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const entry = observerEntries[0];
        if (!entry?.isIntersecting || loadingMore || visibleCount >= entries.length) {
          return;
        }

        setLoadingMore(true);
        window.setTimeout(() => {
          setVisibleCount((value) => Math.min(value + 12, entries.length));
          setLoadingMore(false);
        }, 450);
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [entries.length, initialLoading, loadingMore, visibleCount]);

  const visibleEntries = entries.slice(0, visibleCount);

  const gridItems = useMemo(() => {
    const sectionLabels = [
      "For you",
      "Trending in Accra",
      "This weekend",
      "Based on your vibe",
      "Happening near you",
      "Followed organizers",
    ];

    const items: Array<
      | { type: "label"; key: string; label: string }
      | { type: "card"; key: string; entry: FeedEntry }
      | { type: "ad"; key: string; slide: HeroSlide }
    > = [];

    visibleEntries.forEach((entry, index) => {
      if (index % 4 === 0) {
        items.push({
          type: "label",
          key: `label-${index}`,
          label: sectionLabels[Math.floor(index / 4) % sectionLabels.length] ?? "For you",
        });
      }

      if (index > 0 && index % 6 === 0 && sponsoredSlides.length > 0) {
        items.push({
          type: "ad",
          key: `ad-${index}`,
          slide: sponsoredSlides[Math.floor(index / 6 - 1) % sponsoredSlides.length] ?? sponsoredSlides[0],
        });
      }

      items.push({ type: "card", key: entry.key, entry });
    });

    return items;
  }, [sponsoredSlides, visibleEntries]);

  if (!initialLoading && entries.length === 0) {
    return (
      <div className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-10 text-center">
        <p className="font-display text-3xl italic text-[var(--text-primary)]">No events match that mix.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
          Clear the current search or category filters and the feed will refill with the city’s
          strongest signals.
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
          onClick={onReset}
          type="button"
        >
          <ArrowClockwise size={16} />
          Reset feed
        </button>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
            Discovery feed
          </p>
          <h2 className="mt-2 font-display text-4xl italic text-[var(--text-primary)]">
            Your algorithm, not a directory
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Cards reorder by scene, timing, and repeat behaviour so the home screen feels alive.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] md:flex">
          <TrendUp size={16} />
          12 cards per page · inline ad slots · infinite scroll
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {initialLoading
          ? Array.from({ length: 6 }, (_, index) => <SkeletonCard key={`skeleton-${index}`} />)
          : gridItems.map((item, index) => {
              if (item.type === "label") {
                return <SectionMarker key={item.key} label={item.label} />;
              }

              if (item.type === "ad") {
                return (
                  <motion.div
                    key={item.key}
                    className="col-span-full overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_16px_40px_rgba(12,18,12,0.1)] lg:col-span-2"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015, duration: 0.28 }}
                  >
                    <Link className="grid h-full md:grid-cols-[1.05fr,0.95fr]" href={`/events/${item.slide.slug}`}>
                      <div className="relative min-h-[240px]">
                        <Image
                          alt={item.slide.title}
                          className="object-cover"
                          fill
                          sizes="(max-width: 1023px) 100vw, 50vw"
                          src={getEventImage(item.slide.banner_url)}
                        />
                      </div>
                      <div className="flex flex-col justify-between p-6">
                        <div>
                          <span className="rounded-full border border-[rgba(var(--brand-rgb),0.2)] bg-[rgba(var(--brand-rgb),0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                            Sponsored event
                          </span>
                          <h3 className="mt-4 font-display text-3xl italic text-[var(--text-primary)]">
                            {item.slide.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                            {item.slide.short_description}
                          </p>
                        </div>
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <CalendarDots size={16} />
                            <span>{item.slide.start_datetime}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                              {item.slide.is_free ? "Free" : `GHS ${item.slide.lowest_price}`}
                            </span>
                            <span className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
                              View listing →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015, duration: 0.24 }}
                >
                  <EventCard
                    category={item.entry.category}
                    event={item.entry.event}
                    organizer={item.entry.organizer}
                  />
                </motion.div>
              );
            })}

        {loadingMore
          ? Array.from({ length: 6 }, (_, index) => <SkeletonCard key={`loading-${index}`} />)
          : null}
      </div>

      <div ref={sentinelRef} />
    </section>
  );
}

export default DiscoveryFeed;
