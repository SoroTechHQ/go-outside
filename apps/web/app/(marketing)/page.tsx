"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Ticket,
  UsersThree,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { EventPreviewCard } from "../../components/landing/EventPreviewCard";
import { LockModal }        from "../../components/landing/LockModal";
import { TickerBar }        from "../../components/landing/TickerBar";
import { AnimatedCounter }  from "../../components/landing/AnimatedCounter";
import { LANDING_EVENTS }   from "../../lib/landing-data";
import type { LandingEvent } from "../../lib/landing-data";

/* ── Typewriter hook ────────────────────────────────────────────────────── */

const TYPEWRITER_PHRASES = [
  "Detty December events",
  "Afrofuture 2025",
  "Rug Tufting Workshop",
  "Ga Rooftop After Hours",
  "Build Ghana Summit",
  "Jazz in Accra",
];

function useTypewriter(active: boolean) {
  const [display, setDisplay] = useState("");
  const phraseIdx = useRef(0);
  const charIdx   = useRef(0);
  const deleting  = useRef(false);

  useEffect(() => {
    if (!active) { setDisplay(""); return; }

    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const phrase = TYPEWRITER_PHRASES[phraseIdx.current]!;

      if (!deleting.current) {
        charIdx.current++;
        setDisplay(phrase.slice(0, charIdx.current));
        if (charIdx.current === phrase.length) {
          deleting.current = true;
          timeout = setTimeout(tick, 2000);
          return;
        }
        timeout = setTimeout(tick, 80);
      } else {
        charIdx.current--;
        setDisplay(phrase.slice(0, charIdx.current));
        if (charIdx.current === 0) {
          deleting.current  = false;
          phraseIdx.current = (phraseIdx.current + 1) % TYPEWRITER_PHRASES.length;
          timeout = setTimeout(tick, 300);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    }

    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, [active]);

  return display;
}

/* ── Animation variants ─────────────────────────────────────────────────── */

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ── Section wrappers ───────────────────────────────────────────────────── */

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref     = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();

  const [searchVal,    setSearchVal]    = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lockedEvent,  setLockedEvent]  = useState<LandingEvent | null | undefined>(undefined);

  const typewriter = useTypewriter(!searchVal && !searchFocused);

  const openLock  = useCallback((ev: LandingEvent) => setLockedEvent(ev), []);
  const closeLock = useCallback(() => setLockedEvent(undefined), []);

  function handleSearch() {
    if (searchVal.trim()) {
      void router.push(`/sign-up?intent=search&q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      void router.push("/sign-up");
    }
  }

  // Horizontal scroll ref for "This Weekend" section
  const scrollRef = useRef<HTMLDivElement>(null);
  function scrollRow(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  }

  const featuredEvent = LANDING_EVENTS[0]!;
  const gridEvents    = LANDING_EVENTS.slice(1, 5);
  const weekendEvents = LANDING_EVENTS.slice(2, 7);

  return (
    <>
      {/* ── Background glow orbs ── */}
      <div
        className="pointer-events-none fixed -left-40 -top-40 -z-10 h-[600px] w-[600px] rounded-full blur-[180px]"
        style={{ background: "rgba(95,191,42,0.07)" }}
      />
      <div
        className="pointer-events-none fixed -right-40 top-1/2 -z-10 h-[500px] w-[500px] rounded-full blur-[160px]"
        style={{ background: "rgba(95,191,42,0.05)" }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 left-1/3 -z-10 h-[400px] w-[400px] rounded-full blur-[140px]"
        style={{ background: "rgba(95,191,42,0.04)" }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden px-5">
        {/* Floating card — left (desktop only) */}
        <motion.div
          className="pointer-events-none absolute left-[calc(50%-480px)] top-1/2 hidden -translate-y-1/2 md:block"
          style={{ rotate: -6, opacity: 0.55, willChange: "transform" }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={featuredEvent} variant="compact" onClick={() => openLock(featuredEvent)} />
          </div>
        </motion.div>

        {/* Floating card — right (desktop only) */}
        <motion.div
          className="pointer-events-none absolute right-[calc(50%-480px)] top-1/2 hidden -translate-y-1/2 md:block"
          style={{ rotate: 6, opacity: 0.55, willChange: "transform" }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={LANDING_EVENTS[2]!} variant="compact" onClick={() => openLock(LANDING_EVENTS[2]!)} />
          </div>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 flex w-full max-w-[600px] flex-col items-center gap-0 text-center">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]"
          >
            Accra&apos;s Social Event Platform
          </motion.p>

          {/* Headline */}
          <div className="mb-5">
            {["Your city", "is going out."].map((line, i) => (
              <motion.h1
                key={line}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="block text-[40px] font-normal italic leading-[1.05] text-[#F5FFF0] sm:text-[56px] md:text-[72px]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {line}
              </motion.h1>
            ))}
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-7 max-w-[480px] text-[15px] font-light text-[#6B8C6B] sm:text-[18px]"
          >
            Discover events. Go with friends. Build your scene.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-7 w-full"
          >
            <div
              className="flex h-14 w-full items-center rounded-full transition-all duration-200"
              style={{
                background:    "rgba(13,20,13,0.90)",
                border:        searchFocused
                  ? "1px solid rgba(95,191,42,0.35)"
                  : "1px solid rgba(95,191,42,0.20)",
                boxShadow:     searchFocused
                  ? "0 0 0 1px rgba(95,191,42,0.08), 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(95,191,42,0.08)"
                  : "0 0 0 1px rgba(95,191,42,0.08), 0 8px 32px rgba(0,0,0,0.4)",
                backdropFilter: "blur(12px)",
              }}
            >
              <MagnifyingGlass size={20} className="ml-5 shrink-0 text-[#4A6A4A]" />
              <div className="relative ml-3 flex-1">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="w-full bg-transparent text-[15px] text-[#F5FFF0] outline-none placeholder-transparent"
                  placeholder="Search"
                  aria-label="Search events"
                />
                {/* Typewriter placeholder */}
                {!searchVal && !searchFocused && (
                  <span
                    className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-[#4A6A4A]"
                    aria-hidden
                  >
                    {typewriter}
                    <span className="ml-px inline-block w-[1px] animate-pulse bg-[#4A6A4A]">&nbsp;</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="mr-2 flex h-10 items-center rounded-full bg-[#5FBF2A] px-5 text-[14px] font-bold text-[#020702] transition hover:brightness-110"
              >
                Search
              </button>
            </div>
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex items-center gap-6"
          >
            {[
              { num: "89K+", label: "users discovering events" },
              { num: "340+", label: "events this month" },
              { num: "4.9★", label: "average event rating" },
            ].map((stat, i) => (
              <div key={stat.num} className="flex items-center gap-6">
                {i > 0 && <div className="h-4 w-px bg-[rgba(95,191,42,0.12)]" />}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[16px] font-normal italic text-[#5FBF2A]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {stat.num}
                  </span>
                  <span className="text-[12px] font-light text-[#6B8C6B]">{stat.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — TICKER BAR
      ══════════════════════════════════════════════════════════════════ */}
      <TickerBar />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — LIVE EVENT CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        {/* Header */}
        <AnimatedSection className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <motion.div variants={itemVariants}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]">Discover</p>
            <h2
              className="text-[28px] font-normal italic text-[#F5FFF0] md:text-[36px]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              What&apos;s happening in Accra
            </h2>
            <p className="mt-1 text-[16px] font-light text-[#6B8C6B]">
              Browse upcoming events. Sign up to save, share, and buy tickets.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="shrink-0">
            <button
              onClick={() => setLockedEvent(featuredEvent)}
              className="text-[14px] text-[#5FBF2A] underline-offset-2 hover:underline"
            >
              See all events →
            </button>
          </motion.div>
        </AnimatedSection>

        {/* Grid */}
        <AnimatedSection>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
            {/* Featured large card */}
            <motion.div variants={itemVariants}>
              <EventPreviewCard event={featuredEvent} variant="featured" onClick={() => openLock(featuredEvent)} />
            </motion.div>

            {/* 2×2 small cards */}
            <div className="grid grid-cols-2 gap-3">
              {gridEvents.map((ev) => (
                <motion.div key={ev.id} variants={itemVariants}>
                  <EventPreviewCard event={ev} variant="standard" onClick={() => openLock(ev)} />
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — HORIZONTAL SCROLL "THIS WEEKEND"
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <AnimatedSection className="mb-4 flex items-center justify-between">
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5FBF2A]" />
              <h3
                className="text-[18px] font-normal italic text-[#F5FFF0]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                This weekend
              </h3>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <button
                onClick={() => setLockedEvent(featuredEvent)}
                className="text-[13px] text-[#6B8C6B] transition hover:text-[#F5FFF0]"
              >
                See all →
              </button>
              <button
                onClick={() => scrollRow(-1)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-[rgba(95,191,42,0.10)] bg-[#0D140D] text-[#6B8C6B] transition hover:text-[#F5FFF0] md:flex"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => scrollRow(1)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-[rgba(95,191,42,0.10)] bg-[#0D140D] text-[#6B8C6B] transition hover:text-[#F5FFF0] md:flex"
              >
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </AnimatedSection>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-5 pb-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {weekendEvents.map((ev) => (
            <div key={ev.id} className="w-[200px] shrink-0" style={{ scrollSnapAlign: "start" }}>
              <EventPreviewCard event={ev} variant="compact" onClick={() => openLock(ev)} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="mb-10 text-center">
          <motion.h2
            variants={itemVariants}
            className="text-[28px] font-normal italic text-[#F5FFF0] md:text-[36px]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            How GoOutside works
          </motion.h2>
        </AnimatedSection>

        <AnimatedSection className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: MagnifyingGlass,
              step: "01",
              title: "Discover events",
              body: "Browse events happening across Accra and Ghana, personalised to your interests and what your friends are doing.",
            },
            {
              icon: Ticket,
              step: "02",
              title: "Get tickets in seconds",
              body: "Buy tickets with Paystack — card, mobile money, or bank. Your QR code arrives instantly.",
            },
            {
              icon: UsersThree,
              step: "03",
              title: "Go with your people",
              body: "See what your friends are attending, coordinate going together, and share post-event memories.",
            },
          ].map(({ icon: Icon, step, title, body }) => (
            <motion.div
              key={step}
              variants={itemVariants}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[16px] border border-[rgba(95,191,42,0.10)] bg-[#0D140D] p-7"
            >
              {/* Top gradient line */}
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(95,191,42,0.2), transparent)" }}
              />
              {/* Decorative step number */}
              <span
                className="absolute right-5 top-4 select-none text-[48px] font-normal italic leading-none text-[#F5FFF0]"
                style={{ fontFamily: "'DM Serif Display', serif", opacity: 0.06 }}
              >
                {step}
              </span>
              {/* Icon */}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(95,191,42,0.10)]">
                <Icon size={28} color="#5FBF2A" />
              </div>
              <h3
                className="mb-2 text-[20px] font-normal italic text-[#F5FFF0]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {title}
              </h3>
              <p className="text-[14px] font-light leading-[1.65] text-[#6B8C6B]">{body}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — STATS BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-[rgba(95,191,42,0.06)] bg-[#080D08] py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-5 sm:flex-row sm:gap-0">
          {[
            { target: 89, suffix: "K+", label: "People going out" },
            { target: 340, suffix: "+",  label: "Events this month" },
            { target: 28,  suffix: "",   label: "Cities" },
            { target: 49,  suffix: "★",  label: "Average rating", display: "4.9★" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex flex-1 items-center">
              {i > 0 && <div className="mx-auto hidden h-12 w-px self-center bg-[rgba(95,191,42,0.06)] sm:block" />}
              <div className="flex-1 text-center">
                <p
                  className="text-[32px] font-normal italic leading-none text-[#F5FFF0] md:text-[40px]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {stat.display ? stat.display : (
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-1.5 text-[14px] text-[#6B8C6B]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — FOR ORGANIZERS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {/* Text column */}
          <div className="space-y-5">
            <motion.div variants={itemVariants}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]">For Organizers</p>
              <h2
                className="text-[28px] font-normal italic text-[#F5FFF0] md:text-[36px]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Bring your events to life
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="text-[16px] font-light leading-relaxed text-[#6B8C6B]">
              GoOutside gives you everything you need to sell tickets, manage attendees, and grow your audience in Ghana.
              No monthly fees. Just a small platform fee per ticket sold.
            </motion.p>
            <motion.ul variants={itemVariants} className="space-y-3">
              {[
                "Live ticket sales with Paystack",
                "Real-time attendee check-in via QR",
                "Analytics: revenue, ticket velocity, ratings",
                "Free to list. 5% fee on paid tickets only.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-[#6B8C6B]">
                  <CheckCircle size={20} color="#5FBF2A" weight="fill" className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={itemVariants}>
              <Link
                href="/sign-up?role=organizer"
                className="inline-flex h-12 items-center rounded-full border border-[rgba(95,191,42,0.35)] px-7 text-[14px] font-bold text-[#5FBF2A] transition hover:bg-[rgba(95,191,42,0.06)]"
              >
                Apply as an Organizer →
              </Link>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div variants={itemVariants}>
            <div
              className="rounded-[16px] border border-[rgba(95,191,42,0.10)] bg-[#0D140D] p-5"
              style={{ transform: "rotate(2deg)" }}
            >
              {/* Header row */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[#F5FFF0]">My Events</p>
                <button className="rounded-full bg-[#5FBF2A] px-3 py-1 text-[11px] font-bold text-[#020702]">
                  New Event +
                </button>
              </div>

              {/* Mini stats */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { val: "GHS 12,400", lbl: "Revenue" },
                  { val: "247",        lbl: "Tickets sold" },
                  { val: "4.8★",      lbl: "Avg rating" },
                ].map((s) => (
                  <div key={s.lbl} className="rounded-[10px] bg-[rgba(255,255,255,0.04)] px-3 py-2.5">
                    <p
                      className="text-[18px] font-normal italic text-[#F5FFF0]"
                      style={{ fontFamily: "'DM Serif Display', serif" }}
                    >
                      {s.val}
                    </p>
                    <p className="text-[11px] text-[#4A6A4A]">{s.lbl}</p>
                  </div>
                ))}
              </div>

              {/* Event rows */}
              <div className="space-y-2">
                {[
                  { dot: "#7c3aed", name: "Ga Rooftop After Hours", status: "Published", statusBg: "rgba(95,191,42,0.10)", statusClr: "#5FBF2A", amount: "GHS 5,400" },
                  { dot: "#2563eb", name: "Product Market Accra",   status: "Published", statusBg: "rgba(95,191,42,0.10)", statusClr: "#5FBF2A", amount: "Free" },
                  { dot: "#d97706", name: "Accra Chef Table",        status: "Draft",     statusBg: "rgba(255,255,255,0.06)", statusClr: "#6B8C6B", amount: "GHS 3,200" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-2 rounded-[10px] bg-[rgba(255,255,255,0.02)] px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.dot }} />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[#c8e0c8]">{row.name}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: row.statusBg, color: row.statusClr }}
                    >
                      {row.status}
                    </span>
                    <span className="shrink-0 text-[12px] text-[#6B8C6B]">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8 — TESTIMONIALS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <AnimatedSection className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              quote:  "I found the Ga Rooftop event on a Friday afternoon and had tickets by evening. The QR check-in was seamless.",
              name:   "Kofi Mensah",
              desc:   "Music lover · Osu, Accra",
              initials: "KM",
            },
            {
              quote:  "As an organizer, I sold out my first event in 48 hours. The analytics dashboard showed me exactly where my audience was coming from.",
              name:   "Ama Asante",
              desc:   "Founder · Sankofa Sessions",
              initials: "AA",
            },
            {
              quote:  "I never knew there were this many things happening in Accra on weekends. GoOutside changed how I plan my weekends completely.",
              name:   "Ekow Boateng",
              desc:   "Tech professional · East Legon",
              initials: "EB",
            },
          ].map(({ quote, name, desc, initials }) => (
            <motion.div
              key={name}
              variants={itemVariants}
              className="relative overflow-hidden rounded-[16px] border border-[rgba(95,191,42,0.10)] bg-[#0D140D] p-6"
            >
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(95,191,42,0.2), transparent)" }}
              />
              <span
                className="mb-2 block text-[48px] font-normal italic leading-none text-[#5FBF2A]"
                style={{ fontFamily: "'DM Serif Display', serif", opacity: 0.4 }}
              >
                &ldquo;
              </span>
              <p className="mb-5 text-[15px] font-light leading-[1.65] text-[#F5FFF0]">{quote}</p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#080D08] text-[13px] font-semibold text-[#5FBF2A]">
                  {initials}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#F5FFF0]">{name}</p>
                  <p className="text-[12px] text-[#6B8C6B]">{desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative py-20 text-center"
        style={{ background: "radial-gradient(ellipse at center, rgba(95,191,42,0.08) 0%, transparent 70%)" }}
      >
        <AnimatedSection className="mx-auto max-w-[640px] px-6">
          <motion.h2
            variants={itemVariants}
            className="mb-4 text-[36px] font-normal italic text-[#F5FFF0] md:text-[48px]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            The city is going out.{" "}
            <span className="text-[#5FBF2A]">Are you?</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mb-8 text-[16px] font-light text-[#6B8C6B]"
          >
            Join thousands of people discovering, attending, and sharing events across Ghana.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              href="/sign-up"
              className="inline-flex h-14 items-center rounded-full bg-[#5FBF2A] px-10 text-[16px] font-bold text-[#020702]"
              style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
            >
              Start Exploring — It&apos;s Free
            </Link>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-5 text-[13px] text-[#4A6A4A]"
          >
            No credit card required · Free to browse · Ghanaian-made 🇬🇭
          </motion.p>
        </AnimatedSection>
      </section>

      {/* LockModal */}
      <AnimatePresence>
        {lockedEvent !== undefined && (
          <LockModal event={lockedEvent} onClose={closeLock} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 18px rgba(95,191,42,0.25); }
          50%       { box-shadow: 0 0 36px rgba(95,191,42,0.45); }
        }
      `}</style>
    </>
  );
}
