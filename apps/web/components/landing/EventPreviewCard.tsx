"use client";

import Image from "next/image";
import { Heart, Eye } from "@phosphor-icons/react";
import { CATEGORY_COLORS } from "../../lib/landing-data";
import type { LandingEvent } from "../../lib/landing-data";

interface EventPreviewCardProps {
  event:   LandingEvent;
  variant: "featured" | "standard" | "compact";
  onClick: () => void;
}

const IMAGE_HEIGHTS: Record<string, number> = {
  featured: 240,
  standard: 140,
  compact:  120,
};

export function EventPreviewCard({ event, variant, onClick }: EventPreviewCardProps) {
  const imgH   = IMAGE_HEIGHTS[variant];
  const dotClr = CATEGORY_COLORS[event.category] ?? "#5FBF2A";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[14px] border border-[rgba(95,191,42,0.08)] bg-[#0D140D] text-left transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(95,191,42,0.22)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ height: imgH }}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes={variant === "featured" ? "600px" : "300px"}
          priority={variant === "featured"}
        />

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,16,13,0.72)] via-transparent to-transparent" />

        {/* Category pill */}
        <span
          className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
          style={{ background: dotClr }}
        >
          {event.category}
        </span>

        {/* Quick actions — appear on hover */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(2,7,2,0.72)] backdrop-blur-[6px] text-white/70 transition hover:text-[#5FBF2A]"
          >
            <Heart size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(2,7,2,0.72)] backdrop-blur-[6px] text-white/70 transition hover:text-[#5FBF2A]"
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Scarcity pill */}
        {event.scarcity && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(232,147,42,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#E8932A] ring-1 ring-[rgba(232,147,42,0.25)]">
            {event.scarcity.label}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
          {event.eyebrow}
        </p>
        <p
          className="text-[14px] font-normal italic leading-snug text-[#F5FFF0]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {event.title}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-[11px] text-[#6B8C6B]">{event.date}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              event.isFree
                ? "bg-[rgba(95,191,42,0.10)] text-[#5FBF2A]"
                : "bg-[rgba(255,255,255,0.04)] text-[#F5FFF0]"
            }`}
          >
            {event.price}
          </span>
        </div>

        {event.friendCount && event.friendCount > 0 && (
          <p className="mt-1.5 text-[11px] text-[#4A6A4A]">
            {event.friendCount} people going
          </p>
        )}
      </div>
    </div>
  );
}
