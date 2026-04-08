"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowClockwise,
  Bell,
  Keyboard,
  Lightning,
  MapPin,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react";
import { demoData, type Category, type EventItem, type Organizer } from "@gooutside/demo-data";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import EventPeekPanel from "./EventPeekPanel";
import HomeEventCard, { type EventSignal } from "./HomeEventCard";

type FeedEntry = {
  key: string;
  category: Category;
  event: EventItem;
  organizer: Organizer;
};

type DiscoveryFeedProps = {
  entries: FeedEntry[];
  onReset: () => void;
};

type LaneSection = {
  description: string;
  entries: FeedEntry[];
  id: string;
  title: string;
};

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

function toUniqueEntries(entries: FeedEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.event.id)) {
      return false;
    }

    seen.add(entry.event.id);
    return true;
  });
}

function rotateEntries(entries: FeedEntry[], offset: number) {
  if (entries.length === 0) {
    return [];
  }

  const safeOffset = offset % entries.length;
  return [...entries.slice(safeOffset), ...entries.slice(0, safeOffset)];
}

function getTimeContext(hour: number) {
  if (hour < 12) {
    return {
      laneTitle: "This morning in Accra",
      laneDescription: "Lighter workshops, brunch energy, and daytime events move to the top.",
      streak: "You have explored 8 events this week.",
      vibe: "Morning bias: calmer picks, faster decisions.",
    };
  }

  if (hour < 18) {
    return {
      laneTitle: "This afternoon around the city",
      laneDescription: "Networking, founders, and after-work options take priority before nightlife climbs.",
      streak: "You are first among your friends to spot 3 of today’s top picks.",
      vibe: "Afternoon bias: product talks, food, and social planning.",
    };
  }

  return {
    laneTitle: "Tonight in Accra",
    laneDescription: "Nightlife, music, and high-social-pressure events rise above slower daytime listings.",
    streak: "You are in the top 10% of nightlife explorers in Accra.",
    vibe: "Night bias: high-energy, high-urgency events first.",
  };
}

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
      : `${friends.length} people booked this in the last hour`,
    urgency,
    momentum: `${friends[1]?.name ?? "Kofi"} is already considering this with their group`,
    distance: location,
    friends,
  };
}

function takeLaneEntries(preferred: FeedEntry[], fallback: FeedEntry[], count = 4) {
  const merged = [...preferred, ...fallback];
  const seen = new Set<string>();
  const result: FeedEntry[] = [];

  for (const entry of merged) {
    if (seen.has(entry.event.id)) {
      continue;
    }

    seen.add(entry.event.id);
    result.push(entry);

    if (result.length === count) {
      break;
    }
  }

  return result;
}

function buildSections(entries: FeedEntry[], refreshCount: number, hour: number) {
  const rotated = rotateEntries(entries, refreshCount);
  const context = getTimeContext(hour);
  const nightlifeEntries = rotated.filter((entry) =>
    ["music", "networking", "food"].includes(entry.event.categorySlug),
  );
  const builderEntries = rotated.filter((entry) =>
    ["tech", "networking"].includes(entry.event.categorySlug),
  );
  const creativeEntries = rotated.filter((entry) =>
    ["music", "arts", "food"].includes(entry.event.categorySlug),
  );
  const nearbyEntries = rotated.filter((entry) =>
    /(Osu|Labone|Airport|Accra)/i.test(`${entry.event.locationLine} ${entry.event.venue}`),
  );
  const socialEntries = rotated.filter((entry) => entry.event.saved || entry.event.featured);
  const fastMovingEntries = rotated.filter((entry) => entry.event.trending || entry.event.status === "live");

  const sections: LaneSection[] = [
    {
      id: "time-aware",
      title: context.laneTitle,
      description: context.laneDescription,
      entries: takeLaneEntries(hour >= 18 ? nightlifeEntries : builderEntries, rotated),
    },
    {
      id: "starting-soon",
      title: "Starting in the next 3 hours",
      description: "Compact, fast-moving picks that are easiest to decide on right now.",
      entries: takeLaneEntries(fastMovingEntries, rotated),
    },
    {
      id: "social",
      title: "Because Kofi is going",
      description: "Friend energy, repeat organizers, and socially magnetic rooms rise here.",
      entries: takeLaneEntries(socialEntries, rotated),
    },
    {
      id: "nearby",
      title: hour >= 18 ? "Near Osu tonight" : "Near your last event",
      description: "Distance and familiar neighborhoods keep this row easy to act on.",
      entries: takeLaneEntries(nearbyEntries, rotated),
    },
    {
      id: "creatives",
      title: "For creatives in Accra",
      description: "A tighter lane for design-forward, cultural, and hospitality-heavy picks.",
      entries: takeLaneEntries(creativeEntries, rotated),
    },
    {
      id: "builders",
      title: "For builders and founders",
      description: "Operator-heavy events, product rooms, and founder circles stay grouped.",
      entries: takeLaneEntries(builderEntries, rotated),
    },
  ];

  return sections.filter((section) => section.entries.length > 0);
}

export function DiscoveryFeed({ entries, onReset }: DiscoveryFeedProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hour = useMemo(() => new Date().getHours(), []);
  const context = useMemo(() => getTimeContext(hour), [hour]);
  const uniqueEntries = useMemo(() => toUniqueEntries(entries), [entries]);
  const activeEntries = useMemo(
    () => uniqueEntries.filter((entry) => !dismissedIds.includes(entry.event.id)),
    [dismissedIds, uniqueEntries],
  );
  const sections = useMemo(
    () => buildSections(activeEntries, refreshCount, hour),
    [activeEntries, hour, refreshCount],
  );

  const allEntryIds = useMemo(
    () =>
      sections.flatMap((section) => section.entries.map((entry) => entry.event.id)).filter((id, index, source) => {
        return source.indexOf(id) === index;
      }),
    [sections],
  );

  const signalById = useMemo(() => {
    return Object.fromEntries(activeEntries.map((entry, index) => [entry.event.id, buildSignal(entry, index)]));
  }, [activeEntries]);

  const previewEntry = useMemo(
    () => activeEntries.find((entry) => entry.event.id === previewEventId) ?? null,
    [activeEntries, previewEventId],
  );

  useEffect(() => {
    if (!allEntryIds.length) {
      setActiveId(null);
      setPreviewEventId(null);
      return;
    }

    if (!activeId || !allEntryIds.includes(activeId)) {
      setActiveId(allEntryIds[0] ?? null);
    }

    if (previewEventId && !allEntryIds.includes(previewEventId)) {
      setPreviewEventId(null);
    }
  }, [activeId, allEntryIds, previewEventId]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey || !allEntryIds.length) {
        return;
      }

      const currentIndex = activeId ? allEntryIds.indexOf(activeId) : -1;

      if (event.key === "ArrowDown" || event.key.toLowerCase() === "j") {
        event.preventDefault();
        const nextId = allEntryIds[(currentIndex + 1 + allEntryIds.length) % allEntryIds.length] ?? allEntryIds[0];
        setActiveId(nextId);
        cardRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        return;
      }

      if (event.key === "ArrowUp" || event.key.toLowerCase() === "k") {
        event.preventDefault();
        const nextId =
          allEntryIds[(currentIndex - 1 + allEntryIds.length) % allEntryIds.length] ??
          allEntryIds[allEntryIds.length - 1];
        setActiveId(nextId);
        cardRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        return;
      }

      if (event.key === "Enter" && activeId) {
        event.preventDefault();
        setPreviewEventId(activeId);
        return;
      }

      if (event.key.toLowerCase() === "s" && activeId) {
        event.preventDefault();
        setSavedIds((current) => {
          return current.includes(activeId) ? current.filter((id) => id !== activeId) : [...current, activeId];
        });
        return;
      }

      if (event.key === "Escape") {
        setPreviewEventId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, allEntryIds, isDesktop]);

  if (entries.length === 0) {
    return (
      <div className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-10 text-center">
        <p className="font-display text-3xl italic text-[var(--text-primary)]">No events match that mix.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
          Clear the current search or category filters and the feed will refill with the city’s strongest signals.
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)]"
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
    <>
      <section className="py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[32px] border border-[color:var(--home-border)] bg-[color:var(--home-surface)] p-6 shadow-[var(--home-shadow)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
              Discovery feed
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl italic text-[var(--text-primary)] md:text-5xl">
              Your algorithm, not a directory
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Desktop now optimizes for speed, context, and keyboard control. Mobile shifts to faster micro-decisions,
              stronger urgency, and social proof.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-full border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] px-4 py-2 text-sm font-semibold text-[var(--brand)]">
                {context.vibe}
              </div>
              <div className="rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                {context.streak}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { icon: TrendUp, label: "Live signal", value: "2 people booked this in the last hour" },
                { icon: Lightning, label: "Momentum loop", value: "Save one event and similar picks rise next" },
                { icon: MapPin, label: "Proximity", value: "Rows bias toward Osu, Labone, and last-seen neighborhoods" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-4"
                  >
                    <div className="flex items-center gap-2 text-[var(--brand)]">
                      <Icon size={16} weight="bold" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{item.label}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-[color:var(--home-border)] bg-[color:var(--home-surface)] p-5 shadow-[var(--home-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--brand)]">
                  <Bell size={18} weight="bold" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Activity feed</p>
                </div>
                <span className="rounded-full bg-[color:var(--home-highlight-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                  Live
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {demoData.attendee.notifications.slice(0, 3).map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[20px] border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.meta}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      {item.timeLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[color:var(--home-border)] bg-[color:var(--home-surface)] p-5 shadow-[var(--home-shadow)]">
              <div className="flex items-center gap-2 text-[var(--brand)]">
                <Keyboard size={18} weight="bold" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Quick controls</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <p>
                  <span className="font-semibold text-[var(--text-primary)]">J / K</span> move through cards
                </p>
                <p>
                  <span className="font-semibold text-[var(--text-primary)]">Enter</span> opens the peek panel
                </p>
                <p>
                  <span className="font-semibold text-[var(--text-primary)]">S</span> saves the selected event
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                    {section.id.replaceAll("-", " ")}
                  </p>
                  <h3 className="mt-2 font-display text-3xl italic text-[var(--text-primary)]">{section.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{section.description}</p>
                </div>

                {sectionIndex === 0 ? (
                  <button
                    className="hidden rounded-full border border-[color:var(--home-border)] bg-[color:var(--home-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--home-highlight-border)] hover:text-[var(--text-primary)] lg:inline-flex"
                    onClick={() => setRefreshCount((value) => value + 1)}
                    type="button"
                  >
                    <ArrowClockwise size={16} className="mr-2" />
                    Refresh your feed
                  </button>
                ) : null}
              </div>

              <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
                {section.entries.map((entry) => (
                  <div
                    key={`${section.id}-${entry.event.id}`}
                    ref={(node) => {
                      cardRefs.current[entry.event.id] = node;
                    }}
                    className={`shrink-0 snap-start ${isDesktop ? "" : "w-full"}`}
                    onMouseEnter={() => setActiveId(entry.event.id)}
                  >
                    <HomeEventCard
                      category={entry.category}
                      event={entry.event}
                      isActive={entry.event.id === activeId}
                      isSaved={savedIds.includes(entry.event.id) || entry.event.saved}
                      mode={isDesktop ? "desktop" : "mobile"}
                      onDismiss={() => {
                        setDismissedIds((current) =>
                          current.includes(entry.event.id) ? current : [...current, entry.event.id],
                        );
                        if (previewEventId === entry.event.id) {
                          setPreviewEventId(null);
                        }
                      }}
                      onPreview={() => setPreviewEventId(entry.event.id)}
                      onSave={() => {
                        setSavedIds((current) =>
                          current.includes(entry.event.id)
                            ? current.filter((id) => id !== entry.event.id)
                            : [...current, entry.event.id],
                        );
                      }}
                      organizer={entry.organizer}
                      signal={signalById[entry.event.id] as EventSignal}
                    />
                  </div>
                ))}
                <div className="w-8 shrink-0" />
              </div>

              {sectionIndex === 2 ? (
                <div className="mt-4 rounded-[28px] border border-[color:var(--home-highlight-border)] bg-[color:var(--home-highlight-bg)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                        Smart refresh
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        You have seen three sections. Refresh to pull a new ordering, new social pressure, and a sharper tonight bias.
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-contrast)]"
                      onClick={() => setRefreshCount((value) => value + 1)}
                      type="button"
                    >
                      <Sparkle size={16} className="mr-2" />
                      Refresh your feed
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <EventPeekPanel
        category={previewEntry?.category as Category}
        event={previewEntry?.event ?? null}
        isDesktop={isDesktop}
        isSaved={previewEntry ? savedIds.includes(previewEntry.event.id) || previewEntry.event.saved : false}
        onClose={() => setPreviewEventId(null)}
        onDismiss={() => {
          if (!previewEntry) {
            return;
          }

          setDismissedIds((current) =>
            current.includes(previewEntry.event.id) ? current : [...current, previewEntry.event.id],
          );
          setPreviewEventId(null);
        }}
        onSave={() => {
          if (!previewEntry) {
            return;
          }

          setSavedIds((current) =>
            current.includes(previewEntry.event.id)
              ? current.filter((id) => id !== previewEntry.event.id)
              : [...current, previewEntry.event.id],
          );
        }}
        organizer={previewEntry?.organizer ?? null}
        signal={previewEntry ? (signalById[previewEntry.event.id] as EventSignal) : null}
      />
    </>
  );
}

export default DiscoveryFeed;
