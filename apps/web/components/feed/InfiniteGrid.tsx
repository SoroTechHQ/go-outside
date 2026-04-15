"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type FeedEventCard, useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { SkeletonCard } from "./SkeletonCard";
import { ScarcityPill } from "./ScarcityPill";
import { QuickActionButtons } from "./QuickActionButtons";
import { FeedSectionHeader } from "./FeedSectionHeader";

interface InfiniteGridProps {
  source?:     "api" | "demo";
  demoEvents?: FeedEventCard[];
  city?:       string;
  interests?:  string[];
  sessionId?:  string;
  label?:      string;
  onDismiss?:  (id: string) => void;
  onPreview?:  (slug: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  });
}

function EventGridCard({
  event,
  sessionId,
  onDismiss,
  onPreview,
}: {
  event:      FeedEventCard;
  sessionId?: string;
  onDismiss?: (id: string) => void;
  onPreview?: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const imageUrl = event.bannerUrl
    ? `${event.bannerUrl}?auto=format&fit=crop&w=400&q=75`
    : "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=400&q=75";

  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   "var(--bg-card)",
          border:       `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: "16px",
          overflow:     "hidden",
          transform:    hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow:    hovered ? "0 12px 32px rgba(0,0,0,0.4)" : "none",
          transition:   "transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
          position:     "relative",
        }}
      >
        {/* Image area */}
        <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />

          {/* Gradient scrim */}
          <div
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Scarcity pill */}
          {event.scarcity &&
            event.scarcity.state !== "normal" &&
            event.scarcity.state !== "selling_fast" && (
              <div style={{ position: "absolute", bottom: "8px", left: "8px" }}>
                <ScarcityPill
                  state={event.scarcity.state as "almost_sold_out" | "final_spots" | "sold_out"}
                  label={event.scarcity.label}
                />
              </div>
            )}

          {/* Quick action buttons — appear on hover */}
          <div style={{ opacity: hovered ? 1 : 0, transition: "opacity 150ms ease" }}>
            <QuickActionButtons
              eventId={event.id}
              slug={event.slug}
              onDismiss={onDismiss}
              onPreview={onPreview}
              sessionId={sessionId}
            />
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "12px 14px 14px" }}>
          <p
            style={{
              fontSize:      "9.5px",
              fontWeight:    600,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              color:         "var(--text-secondary)",
              marginBottom:  "4px",
            }}
          >
            {formatDate(event.startDatetime)}
          </p>

          <h3
            style={{
              fontSize:       "14px",
              fontWeight:     600,
              color:          "var(--text-primary)",
              marginBottom:   "8px",
              lineHeight:     1.3,
              overflow:       "hidden",
              display:        "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {event.title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {event.priceLabel}
            </span>
            {event.avgRating !== null && (
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                ★ {event.avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function InfiniteGrid({
  source = "demo",
  demoEvents = [],
  city,
  interests,
  sessionId,
  label = "Discover More",
  onDismiss,
  onPreview,
}: InfiniteGridProps) {
  const { events, sentinelRef, isLoadingMore } = useInfiniteFeed({
    section: "infinite",
    source,
    demoEvents,
    city,
    interests,
  });

  return (
    <section>
      <FeedSectionHeader label={label} variant="minimal" />

      <div className="infinite-grid">
        {events.map((event) => (
          <EventGridCard
            key={event.id}
            event={event}
            sessionId={sessionId}
            onDismiss={onDismiss}
            onPreview={onPreview}
          />
        ))}

        {isLoadingMore &&
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
      </div>

      {/* Sentinel — IntersectionObserver fires here */}
      <div ref={sentinelRef} style={{ height: "1px" }} aria-hidden />

      <style>{`
        .infinite-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 1024px) {
          .infinite-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .infinite-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
