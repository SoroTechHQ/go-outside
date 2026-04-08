"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export type HeroSlide = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  banner_url: string;
  category: { name: string; icon: string };
  start_datetime: string;
  venue?: { name: string; city: string };
  lowest_price: number;
  is_free: boolean;
  is_sponsored: boolean;
};

export interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const safeSlides = slides.slice(0, 6);

  useEffect(() => {
    if (paused || safeSlides.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % safeSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [paused, safeSlides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) {
    return (
      <section className="relative h-[200px] overflow-hidden rounded-[20px] border border-white/5 bg-[linear-gradient(135deg,#1A3A18,#0E1410)] md:h-[220px] xl:h-[260px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,191,42,0.18),transparent_34%)]" />
        <div className="container-shell relative flex h-full items-end pb-12">
          <div className="max-w-xl">
            <p className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Featured now
            </p>
            <h2 className="mt-4 font-display text-4xl italic text-white md:text-5xl">
              Events happening in Accra
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-white/72">
              Music, dining, culture, and community nights arranged like a social feed instead of a
              directory.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const goTo = (index: number) => setActiveIndex((index + safeSlides.length) % safeSlides.length);
  const currentSlide = safeSlides[activeIndex];

  return (
    <section
      className="relative h-[200px] overflow-hidden rounded-[20px] border border-white/5 md:h-[220px] xl:h-[260px]"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          goTo(activeIndex - 1);
        }
        if (event.key === "ArrowRight") {
          goTo(activeIndex + 1);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX ?? start;
        if (start !== null && end !== null) {
          const delta = start - end;
          if (delta > 40) {
            goTo(activeIndex + 1);
          } else if (delta < -40) {
            goTo(activeIndex - 1);
          }
        }
        touchStartX.current = null;
        setPaused(false);
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      tabIndex={0}
    >
      <div className="absolute inset-0">
        {safeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[400ms] ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              src={slide.banner_url}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0),rgba(0,0,0,0.3)_50%,rgba(14,20,16,0.88)_100%)]" />
          </div>
        ))}
      </div>

      <div className="relative flex h-full items-end px-5 pb-5 md:px-7">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {currentSlide.is_sponsored ? (
              <span className="rounded-full bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                Sponsored
              </span>
            ) : null}
            <span className="rounded-full border border-[rgba(var(--brand-rgb),0.25)] bg-[rgba(var(--brand-rgb),0.2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)] backdrop-blur">
              {currentSlide.category.icon} {currentSlide.category.name}
            </span>
          </div>

          <h2 className="mt-3 max-w-xl text-[1.55rem] font-semibold leading-tight tracking-[-0.02em] text-white md:text-[1.85rem]">
            {currentSlide.title}
          </h2>
          <p className="mt-2 text-xs text-white/72 md:text-sm">
            {currentSlide.start_datetime}
            {currentSlide.venue ? ` · ${currentSlide.venue.name}, ${currentSlide.venue.city}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur md:text-sm">
              {currentSlide.is_free ? "Free" : `GHS ${currentSlide.lowest_price}`}
            </span>
            <Link
              className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(var(--brand-rgb),0.3)] transition hover:brightness-105 md:text-sm"
              href={`/events/${currentSlide.slug}`}
            >
              Get Tickets →
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/18 px-3 py-2 backdrop-blur">
          {safeSlides.map((slide, index) => (
            <button
              key={slide.id}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 w-2 rounded-full transition ${
                index === activeIndex ? "bg-[var(--brand)]" : "bg-white/40"
              }`}
              onClick={() => goTo(index)}
              type="button"
            />
          ))}
        </div>
      </div>

      {safeSlides.length > 1 ? (
        <>
          <button
            aria-label="Previous slide"
            className="absolute right-20 top-4 hidden h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/24 text-white backdrop-blur transition hover:bg-black/38 md:flex"
            onClick={() => goTo(activeIndex - 1)}
            type="button"
          >
            <CaretLeft size={20} />
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-8 top-4 hidden h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/24 text-white backdrop-blur transition hover:bg-black/38 md:flex"
            onClick={() => goTo(activeIndex + 1)}
            type="button"
          >
            <CaretRight size={20} />
          </button>
        </>
      ) : null}
    </section>
  );
}

export default HeroCarousel;
