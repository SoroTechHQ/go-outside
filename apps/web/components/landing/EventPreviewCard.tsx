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
  featured: 340,
  standard: 200,
  compact:  160,
};

export function EventPreviewCard({ event, variant, onClick }: EventPreviewCardProps) {
  const imgH   = IMAGE_HEIGHTS[variant]!;
  const dotClr = CATEGORY_COLORS[event.category] ?? "#2f8f45";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[16px] border border-black/[0.08] bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-all duration-200 hover:-translate-y-[4px] hover:border-[rgba(47,143,69,0.30)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
    >
      {/* Image */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: imgH }}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes={variant === "featured" ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 340px"}
          priority={variant === "featured"}
        />

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Category pill */}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm"
          style={{ background: dotClr }}
        >
          {event.category}
        </span>

        {/* Quick actions — appear on hover */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur-[6px] text-[#4a4a4a] transition hover:text-[#2f8f45]"
          >
            <Heart size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur-[6px] text-[#4a4a4a] transition hover:text-[#2f8f45]"
          >
            <Eye size={14} />
          </button>
        </div>

        {/* Scarcity pill */}
        {event.scarcity && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[rgba(217,119,6,0.18)] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309] ring-1 ring-[rgba(217,119,6,0.30)]">
            {event.scarcity.label}
          </span>
        )}

        {/* Price — bottom right on image */}
        <span
          className={`absolute bottom-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
            event.isFree
              ? "bg-[#2f8f45] text-white"
              : "bg-white text-[#0f110f]"
          }`}
        >
          {event.price}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
          {event.eyebrow}
        </p>
        <p
          className="text-[15px] font-normal italic leading-snug text-[#0f110f]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {event.title}
        </p>

        <p className="mt-2 text-[12px] text-[#6f6f6f]">{event.date}</p>

        {event.friendCount && event.friendCount > 0 && (
          <p className="mt-1 text-[11px] text-[#a9a9a9]">
            {event.friendCount} people going
          </p>
        )}
      </div>
    </div>
  );
}
