"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  categories,
  events,
  getCategoryBySlug,
  getCategoryEmoji,
  getCategoryEventCount,
  getOrganizerById,
} from "@gooutside/demo-data";
import { CalendarBlank, ArrowsLeftRight } from "@phosphor-icons/react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import MessagesFAB from "../messages/MessagesFAB";
import CategoryRail from "./CategoryRail";
import DiscoveryFeed from "./DiscoveryFeed";
import EventPeekPanel from "./EventPeekPanel";
import HomeEventCard, { type EventSignal } from "./HomeEventCard";

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

const friendGroups = [
  [
    { initials: "AM", name: "Ama" },
    { initials: "KO", name: "Kofi" },
    { initials: "ES", name: "Esi" },
  ],
  [
    { initials: "EK", name: "Ekow" },
    { initials: "NA", name: "Naa" },
    { initials: "YA", name: "Yaa" },
  ],
  [
    { initials: "NI", name: "Nii" },
    { initials: "AF", name: "Afua" },
    { initials: "JO", name: "Jojo" },
  ],
];

function buildSignal(entry: FeedEntry, index: number): EventSignal {
  const friends = friendGroups[index % friendGroups.length] ?? friendGroups[0];
  const urgency = entry.event.ticketTypes[0]?.remainingLabel ?? entry.event.capacityLabel;
  const location =
    entry.event.locationLine.includes("Accra") || entry.event.locationLine.includes("Kwahu")
      ? `Near ${entry.event.locationLine}`
      : entry.event.locationLine;

  return {
    ticker: entry.event.trending
      ? `${friends[0]?.name} just saved this`
      : `${friends.length} people booked in the last hour`,
    urgency,
    momentum: `${friends[1]?.name ?? "Kofi"} is already considering this`,
    distance: location,
    friends,
  };
}

export function HomeClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Hero grid state
  const [heroSavedIds, setHeroSavedIds] = useState<string[]>([]);
  const [heroDismissedIds, setHeroDismissedIds] = useState<string[]>([]);
  const [heroPreviewId, setHeroPreviewId] = useState<string | null>(null);

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

  const allEntries = useMemo(() => buildFeedEntries(filteredEvents), [filteredEvents]);

  // Editorial grid: 1 featured + 4 discovery
  const heroEntries = useMemo(() => {
    const available = allEntries.filter((e) => !heroDismissedIds.includes(e.event.id));
    const featured = available.find((e) => e.event.featured || e.event.trending) ?? available[0];
    if (!featured) return { featured: null, grid: [] };
    const grid = available.filter((e) => e.event.id !== featured.event.id).slice(0, 4);
    return { featured, grid };
  }, [allEntries, heroDismissedIds]);

  const heroSignalById = useMemo(() => {
    return Object.fromEntries(allEntries.map((entry, i) => [entry.event.id, buildSignal(entry, i)]));
  }, [allEntries]);

  const heroPreviewEntry = useMemo(
    () => allEntries.find((e) => e.event.id === heroPreviewId) ?? null,
    [allEntries, heroPreviewId],
  );

  const feedEntries = useMemo(() => buildFeedEntries(filteredEvents), [filteredEvents]);

  const updateCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(selectedCategories);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);

    if (next.size > 0) params.set("category", Array.from(next).join(","));
    else params.delete("category");

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const toggleHeroSave = (id: string) => {
    setHeroSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const dismissHero = (id: string) => {
    setHeroDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (heroPreviewId === id) setHeroPreviewId(null);
  };

  const { featured, grid } = heroEntries;

  return (
    <main className="page-grid min-h-screen pb-32">
      {/* ── Section 1: Editorial Grid ── */}
      <div className="container-shell px-4 pt-6 md:px-6">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
            Tonight in Accra
          </p>
          <h1 className="mt-1 font-display text-3xl italic text-[var(--text-primary)] md:text-4xl">
            What's moving right now
          </h1>
        </div>

        {allEntries.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
            {/* Large featured card */}
            <div className="min-h-[480px] lg:min-h-[520px]">
              {featured ? (
                <HomeEventCard
                  category={featured.category}
                  event={featured.event}
                  isActive={false}
                  isSaved={heroSavedIds.includes(featured.event.id) || featured.event.saved}
                  mode={isDesktop ? "desktop" : "mobile"}
                  onDismiss={() => dismissHero(featured.event.id)}
                  onPreview={() => setHeroPreviewId(featured.event.id)}
                  onSave={() => toggleHeroSave(featured.event.id)}
                  organizer={featured.organizer}
                  signal={heroSignalById[featured.event.id] as EventSignal}
                  variant="featured"
                />
              ) : null}
            </div>

            {/* 2×2 discovery grid */}
            <div className="grid grid-cols-2 gap-3">
              {grid.map((entry, i) => (
                <HomeEventCard
                  key={entry.key}
                  category={entry.category}
                  event={entry.event}
                  isActive={false}
                  isSaved={heroSavedIds.includes(entry.event.id) || entry.event.saved}
                  mode={isDesktop ? "desktop" : "mobile"}
                  onDismiss={() => dismissHero(entry.event.id)}
                  onPreview={() => setHeroPreviewId(entry.event.id)}
                  onSave={() => toggleHeroSave(entry.event.id)}
                  organizer={entry.organizer}
                  signal={heroSignalById[entry.event.id] as EventSignal}
                  variant="grid"
                />
              ))}
              {/* Fill empty slots if fewer than 4 */}
              {grid.length < 4
                ? Array.from({ length: 4 - grid.length }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="h-[260px] rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)]"
                    />
                  ))
                : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Category Rail ── */}
      <div className="mt-6">
        <CategoryRail
          categories={categoryItems}
          onClear={clearFilters}
          onToggle={updateCategory}
          selected={selectedCategories}
        />
      </div>

      {/* ── Sections 2 + 3: Horizontal Lanes + Split-Pane ── */}
      <div className="container-shell mt-6">
        <DiscoveryFeed entries={feedEntries} onReset={clearFilters} />
      </div>

      {/* ── Peek Panel for hero grid cards ── */}
      <EventPeekPanel
        category={heroPreviewEntry?.category as NonNullable<ReturnType<typeof getCategoryBySlug>>}
        event={heroPreviewEntry?.event ?? null}
        isDesktop={isDesktop}
        isSaved={
          heroPreviewEntry
            ? heroSavedIds.includes(heroPreviewEntry.event.id) || heroPreviewEntry.event.saved
            : false
        }
        onClose={() => setHeroPreviewId(null)}
        onDismiss={() => {
          if (!heroPreviewEntry) return;
          dismissHero(heroPreviewEntry.event.id);
        }}
        onSave={() => {
          if (!heroPreviewEntry) return;
          toggleHeroSave(heroPreviewEntry.event.id);
        }}
        organizer={heroPreviewEntry?.organizer ?? null}
        signal={heroPreviewEntry ? (heroSignalById[heroPreviewEntry.event.id] as EventSignal) : null}
      />

      {/* ── Sticky Decision Bar ── */}
      {heroSavedIds.length > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-strong)] px-5 py-3 shadow-[var(--home-shadow-strong)] backdrop-blur-md">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Saved: {heroSavedIds.length} event{heroSavedIds.length !== 1 ? "s" : ""}
          </span>
          <div className="h-4 w-px bg-[color:var(--home-border)]" />
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--home-highlight-border)] hover:text-[var(--text-primary)]"
            type="button"
          >
            <ArrowsLeftRight size={14} />
            Compare
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-1.5 text-sm font-semibold text-[var(--brand-contrast)] transition hover:brightness-110"
            type="button"
          >
            <CalendarBlank size={14} />
            Plan weekend
          </button>
        </div>
      ) : null}

      <MessagesFAB />
    </main>
  );
}

export default HomeClient;
