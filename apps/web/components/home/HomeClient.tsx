"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  categories,
  events,
  getCategoryBySlug,
  getCategoryEmoji,
  getCategoryEventCount,
  getEventImage,
  getOrganizerById,
} from "@gooutside/demo-data";
import MessagesFAB from "../messages/MessagesFAB";
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
  return sourceEvents.flatMap((event) => {
    const category = getCategoryBySlug(event.categorySlug);
    const organizer = getOrganizerById(event.organizerId);
    return category && organizer ? [{ key: event.id, event, category, organizer }] : [];
  });
}

function toHeroSlides(hour: number): HeroSlide[] {
  const prioritizedCategories =
    hour < 12
      ? ["food", "arts", "tech"]
      : hour < 18
        ? ["tech", "networking", "food"]
        : ["music", "networking", "food"];

  const featuredEvents = events
    .slice()
    .sort((left, right) => {
      const leftPriority = prioritizedCategories.indexOf(left.categorySlug);
      const rightPriority = prioritizedCategories.indexOf(right.categorySlug);
      const leftScore = leftPriority === -1 ? prioritizedCategories.length : leftPriority;
      const rightScore = rightPriority === -1 ? prioritizedCategories.length : rightPriority;

      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return Number(right.featured || right.trending) - Number(left.featured || left.trending);
    })
    .filter((event, index, source) => {
      return source.findIndex((item) => item.id === event.id) === index;
    })
    .slice(0, 3);

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
  const currentHour = useMemo(() => new Date().getHours(), []);

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
    return toHeroSlides(currentHour);
  }, [currentHour]);

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
      <div className="container-shell px-0 md:px-6">
        <HeroCarousel
          contextLabel={
            currentHour < 12 ? "Morning bias" : currentHour < 18 ? "Afternoon bias" : "Tonight in Accra"
          }
          contextSummary={
            currentHour < 12
              ? "Workshops, brunch energy, and lighter cultural plans lead the hero."
              : currentHour < 18
                ? "Operators, dinners, and after-work events move up before nightlife takes over."
                : "Nightlife and socially magnetic rooms now lead the page."
          }
          slides={heroSlides}
        />
      </div>
      <CategoryRail
        categories={categoryItems}
        onClear={clearFilters}
        onToggle={updateCategory}
        selected={selectedCategories}
      />
      <div className="container-shell">
        <DiscoveryFeed entries={feedEntries} onReset={clearFilters} />
      </div>
      <MessagesFAB />
    </main>
  );
}

export default HomeClient;
