"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  categories,
  demoData,
  events,
  getCategoryBySlug,
  getCategoryEmoji,
  getCategoryEventCount,
  getEventImage,
  getOrganizerById,
} from "@gooutside/demo-data";
import Header from "../layout/Header";
import NavSwitch from "../layout/NavSwitch";
import CategoryRail from "./CategoryRail";
import DiscoveryFeed from "./DiscoveryFeed";
import HeroCarousel, { type HeroSlide } from "./HeroCarousel";

type FeedEntry = {
  key: string;
  category: NonNullable<ReturnType<typeof getCategoryBySlug>>;
  event: (typeof events)[number];
  organizer: NonNullable<ReturnType<typeof getOrganizerById>>;
};

function buildFeedEntries(sourceEvents: typeof events): FeedEntry[] {
  if (sourceEvents.length === 0) {
    return [];
  }

  const buckets = [
    sourceEvents.filter((event) => event.saved || event.featured),
    sourceEvents.filter((event) => event.trending),
    sourceEvents.filter((event) => event.city === "Accra"),
    sourceEvents.filter((event) => event.priceValue === 0 || event.priceValue <= 180),
    sourceEvents,
  ].filter((bucket) => bucket.length > 0);

  const repeated = Array.from({ length: 4 }, (_, round) =>
    buckets.flatMap((bucket, bucketIndex) =>
      bucket.map((event, eventIndex) => ({ event, key: `${event.id}-${bucketIndex}-${round}-${eventIndex}` })),
    ),
  ).flat();

  return repeated.flatMap(({ event, key }) => {
    const category = getCategoryBySlug(event.categorySlug);
    const organizer = getOrganizerById(event.organizerId);
    return category && organizer ? [{ key, event, category, organizer }] : [];
  });
}

function toHeroSlides(): HeroSlide[] {
  const featuredEvents = [
    ...events.filter((event) => event.featured),
    ...events.filter((event) => event.trending && !event.featured),
  ].slice(0, 3);

  return featuredEvents.flatMap((event, index) => {
    const category = getCategoryBySlug(event.categorySlug);
    if (!category) {
      return [];
    }

    return [
      {
        id: event.id,
        slug: event.slug,
        title: event.title,
        short_description: event.shortDescription,
        banner_url: getEventImage(undefined, event.categorySlug).replace("w=800", "w=1600"),
        category: {
          name: category.name,
          icon: getCategoryEmoji(category.slug),
        },
        start_datetime: `${event.dateLabel} · ${event.timeLabel}`,
        venue: { name: event.venue, city: event.city },
        lowest_price: event.priceValue,
        is_free: event.priceValue === 0,
        is_sponsored: index < 2,
      },
    ];
  });
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

  const categoryItems = useMemo(
    () =>
      categories.map((category) => ({
        id: category.slug,
        name: category.name,
        slug: category.slug,
        icon: getCategoryEmoji(category.slug),
        event_count: getCategoryEventCount(category.slug),
      })),
    [],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(event.categorySlug);
      const queryMatch =
        query.length === 0 ||
        `${event.title} ${event.shortDescription} ${event.venue} ${event.city}`
          .toLowerCase()
          .includes(query);
      return categoryMatch && queryMatch;
    });
  }, [query, selectedCategories]);

  const feedEntries = useMemo(() => buildFeedEntries(filteredEvents), [filteredEvents]);
  const heroSlides = useMemo(() => {
    return toHeroSlides();
  }, []);

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

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("q");
    router.push(pathname, { scroll: false });
  };

  return (
    <main className="page-grid min-h-screen pb-24">
      <NavSwitch role="attendee" userName={demoData.attendee.name} />
      <Header floating cityLabel="Accra" role="attendee" userName={demoData.attendee.name} />
      <HeroCarousel slides={heroSlides} />
      <CategoryRail
        categories={categoryItems}
        onClear={clearFilters}
        onToggle={updateCategory}
        selected={selectedCategories}
      />
      <div className="container-shell">
        <DiscoveryFeed entries={feedEntries} onReset={clearFilters} sponsoredSlides={heroSlides} />
      </div>
    </main>
  );
}

export default HomeClient;
