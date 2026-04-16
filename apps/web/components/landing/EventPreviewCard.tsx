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
  const dotClr = CATEGORY_COLORS[event.category] ?? "#2f8f45";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[14px] border border-black/[0.08] bg-white text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(47,143,69,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
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
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.55)] via-transparent to-transparent" />

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
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-[6px] text-[#4a4a4a] transition hover:text-[#2f8f45]"
          >
            <Heart size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-[6px] text-[#4a4a4a] transition hover:text-[#2f8f45]"
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Scarcity pill */}
        {event.scarcity && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(217,119,6,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#b45309] ring-1 ring-[rgba(217,119,6,0.25)]">
            {event.scarcity.label}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-black/30">
          {event.eyebrow}
        </p>
        <p
          className="text-[14px] font-normal italic leading-snug text-[#0f110f]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {event.title}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-[11px] text-[#6f6f6f]">{event.date}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              event.isFree
                ? "bg-[rgba(47,143,69,0.10)] text-[#2f8f45]"
                : "bg-black/[0.05] text-[#0f110f]"
            }`}
          >
            {event.price}
          </span>
        </div>

        {event.friendCount && event.friendCount > 0 && (
          <p className="mt-1.5 text-[11px] text-[#a9a9a9]">
            {event.friendCount} people going
          </p>
        )}
      </div>
    </div>
  );
}
