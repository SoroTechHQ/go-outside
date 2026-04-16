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
  ArrowDown,
} from "@phosphor-icons/react";
import { EventPreviewCard } from "../../components/landing/EventPreviewCard";
import { LockModal }        from "../../components/landing/LockModal";
import { TickerBar }        from "../../components/landing/TickerBar";
import { AnimatedCounter }  from "../../components/landing/AnimatedCounter";
import { LANDING_EVENTS }   from "../../lib/landing-data";
import type { LandingEvent } from "../../lib/landing-data";

/* ── Typewriter ──────────────────────────────────────────────────────── */

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

/* ── Search loader overlay ───────────────────────────────────────────── */

const SEARCH_TEXTS = ["Finding events…", "Checking the scene…", "Almost there…"];

function SearchLoader({ query }: { query: string }) {
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTextIdx((i) => (i + 1) % SEARCH_TEXTS.length), 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
    >
      {/* Expanding rings */}
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[rgba(47,143,69,0.3)]"
            initial={{ width: 36, height: 36, opacity: 0.9 }}
            animate={{ width: 36 + i * 52, height: 36 + i * 52, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
          />
        ))}
        <div className="absolute flex h-9 w-9 items-center justify-center rounded-full bg-[#2f8f45]">
          <MagnifyingGlass size={16} color="white" weight="bold" />
        </div>
      </div>

      {/* Search query display */}
      {query && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 max-w-xs truncate text-center text-[18px] font-semibold text-[#0f110f]"
          style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}
        >
          &ldquo;{query}&rdquo;
        </motion.p>
      )}

      {/* Cycling status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={textIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[14px] text-[#a9a9a9]"
        >
          {SEARCH_TEXTS[textIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Variants ────────────────────────────────────────────────────────── */

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
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

/* ── Page ────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();

  const [searchVal,     setSearchVal]     = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lockedEvent,   setLockedEvent]   = useState<LandingEvent | null | undefined>(undefined);
  const [searching,     setSearching]     = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");

  const typewriter = useTypewriter(!searchVal && !searchFocused);

  const openLock  = useCallback((ev: LandingEvent) => setLockedEvent(ev), []);
  const closeLock = useCallback(() => setLockedEvent(undefined), []);

  function triggerSearch(query: string) {
    setSearchQuery(query);
    setSearching(true);
    setTimeout(() => router.push("/waitlist"), 900);
  }

  function handleSearch() {
    triggerSearch(searchVal);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  function scrollRow(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  }

  const featuredEvent = LANDING_EVENTS[0]!;
  const gridEvents    = LANDING_EVENTS.slice(1, 5);
  const weekendEvents = LANDING_EVENTS.slice(2, 7);

  return (
    <>
      {/* Subtle green glow — light/airy, not dark */}
      <div
        className="pointer-events-none fixed -left-60 -top-60 -z-10 h-[700px] w-[700px] rounded-full blur-[200px]"
        style={{ background: "rgba(47,143,69,0.05)" }}
      />
      <div
        className="pointer-events-none fixed -right-60 top-1/3 -z-10 h-[600px] w-[600px] rounded-full blur-[200px]"
        style={{ background: "rgba(47,143,69,0.04)" }}
      />

      {/* ════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════ */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden px-5">
        {/* Floating card left */}
        <motion.div
          className="pointer-events-none absolute left-[calc(50%-480px)] top-1/2 hidden -translate-y-1/2 md:block"
          style={{ rotate: -6, opacity: 0.6, willChange: "transform" }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={featuredEvent} variant="compact" onClick={() => openLock(featuredEvent)} />
          </div>
        </motion.div>

        {/* Floating card right */}
        <motion.div
          className="pointer-events-none absolute right-[calc(50%-480px)] top-1/2 hidden -translate-y-1/2 md:block"
          style={{ rotate: 6, opacity: 0.6, willChange: "transform" }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={LANDING_EVENTS[2]!} variant="compact" onClick={() => openLock(LANDING_EVENTS[2]!)} />
          </div>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 flex w-full max-w-[600px] flex-col items-center text-center">
          {/* Coming soon + eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 flex flex-col items-center gap-2"
          >
            <span className="rounded-full border border-[rgba(47,143,69,0.25)] bg-[rgba(47,143,69,0.07)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f8f45]">
              🇬🇭 &nbsp;Coming Soon to Accra
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9a9a9]">
              Accra&apos;s Social Event Platform
            </p>
          </motion.div>

          {/* Headline */}
          <div className="mb-5">
            {["Your city", "is going out."].map((line, i) => (
              <motion.h1
                key={line}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="block text-[40px] font-normal italic leading-[1.05] text-[#0f110f] sm:text-[56px] md:text-[72px]"
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
            className="mb-8 max-w-[480px] text-[15px] font-light text-[#6f6f6f] sm:text-[18px]"
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
              role="button"
              tabIndex={0}
              onClick={() => triggerSearch(searchVal)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") triggerSearch(searchVal); }}
              className="flex h-14 w-full cursor-pointer items-center rounded-full bg-white transition-all duration-200"
              style={{
                border:     searchFocused
                  ? "1px solid rgba(47,143,69,0.40)"
                  : "1px solid rgba(0,0,0,0.10)",
                boxShadow:  searchFocused
                  ? "0 0 0 3px rgba(47,143,69,0.08), 0 4px 20px rgba(0,0,0,0.08)"
                  : "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <MagnifyingGlass size={20} className="ml-5 shrink-0 text-[#c0c0c0]" />
              <div className="relative ml-3 flex-1">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onClick={() => triggerSearch(searchVal)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="w-full cursor-pointer bg-transparent text-[15px] text-[#0f110f] outline-none placeholder-transparent"
                  placeholder="Search"
                  aria-label="Search events"
                  readOnly
                />
                {!searchVal && !searchFocused && (
                  <span
                    className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-[#c0c0c0]"
                    aria-hidden
                  >
                    {typewriter}
                    <span className="ml-px inline-block w-[1px] animate-pulse bg-[#c0c0c0]">&nbsp;</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                className="mr-2 flex h-10 items-center rounded-full bg-[#2f8f45] px-5 text-[14px] font-bold text-white transition hover:bg-[#256f36]"
              >
                Search
              </button>
            </div>
          </motion.div>

          {/* Social proof */}
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
                {i > 0 && <div className="h-4 w-px bg-black/[0.10]" />}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[16px] font-normal italic text-[#2f8f45]"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {stat.num}
                  </span>
                  <span className="text-[12px] font-light text-[#a9a9a9]">{stat.label}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator — sits just below social proof so it's visible mid-screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#c0c0c0]">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown size={14} color="#c0c0c0" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — TICKER
      ════════════════════════════════════════ */}
      <TickerBar />

      {/* ════════════════════════════════════════
          SECTION 3 — EVENT CARDS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <motion.div variants={itemVariants}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">Discover</p>
            <h2
              className="text-[28px] font-normal italic text-[#0f110f] md:text-[36px]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              What&apos;s happening in Accra
            </h2>
            <p className="mt-1 text-[16px] font-light text-[#6f6f6f]">
              Browse upcoming events. Join the waitlist to save and buy tickets.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="shrink-0">
            <button
              onClick={() => setLockedEvent(featuredEvent)}
              className="text-[14px] text-[#2f8f45] underline-offset-2 hover:underline"
            >
              See all events →
            </button>
          </motion.div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
            <motion.div variants={itemVariants}>
              <EventPreviewCard event={featuredEvent} variant="featured" onClick={() => openLock(featuredEvent)} />
            </motion.div>
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

      {/* ════════════════════════════════════════
          SECTION 4 — THIS WEEKEND
      ════════════════════════════════════════ */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <AnimatedSection className="mb-4 flex items-center justify-between">
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2f8f45]" />
              <h3
                className="text-[18px] font-normal italic text-[#0f110f]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                This weekend
              </h3>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <button
                onClick={() => setLockedEvent(featuredEvent)}
                className="text-[13px] text-[#6f6f6f] transition hover:text-[#0f110f]"
              >
                See all →
              </button>
              <button
                onClick={() => scrollRow(-1)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#6f6f6f] transition hover:text-[#0f110f] md:flex"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => scrollRow(1)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#6f6f6f] transition hover:text-[#0f110f] md:flex"
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

      {/* ════════════════════════════════════════
          SECTION 5 — HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="mb-10 text-center">
          <motion.h2
            variants={itemVariants}
            className="text-[28px] font-normal italic text-[#0f110f] md:text-[36px]"
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
              className="relative overflow-hidden rounded-[16px] border border-black/[0.07] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(47,143,69,0.25), transparent)" }}
              />
              <span
                className="absolute right-5 top-4 select-none text-[48px] font-normal italic leading-none text-[#0f110f]"
                style={{ fontFamily: "'DM Serif Display', serif", opacity: 0.04 }}
              >
                {step}
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(47,143,69,0.08)]">
                <Icon size={28} color="#2f8f45" />
              </div>
              <h3
                className="mb-2 text-[20px] font-normal italic text-[#0f110f]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {title}
              </h3>
              <p className="text-[14px] font-light leading-[1.65] text-[#6f6f6f]">{body}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          SECTION 6 — STATS
      ════════════════════════════════════════ */}
      <section className="border-y border-black/[0.06] bg-[#f8faf8] py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-5 sm:flex-row sm:gap-0">
          {[
            { target: 89,  suffix: "K+", label: "People going out" },
            { target: 340, suffix: "+",  label: "Events this month" },
            { target: 28,  suffix: "",   label: "Cities" },
            { display: "4.9★", label: "Average rating" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex flex-1 items-center">
              {i > 0 && <div className="mx-auto hidden h-12 w-px self-center bg-black/[0.07] sm:block" />}
              <div className="flex-1 text-center">
                <p
                  className="text-[32px] font-normal italic leading-none text-[#0f110f] md:text-[40px]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {"display" in stat && stat.display ? stat.display : (
                    <AnimatedCounter target={(stat as { target: number; suffix: string; label: string }).target} suffix={(stat as { target: number; suffix: string; label: string }).suffix} />
                  )}
                </p>
                <p className="mt-1.5 text-[14px] text-[#6f6f6f]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 7 — FOR ORGANIZERS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-5">
            <motion.div variants={itemVariants}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">For Organizers</p>
              <h2
                className="text-[28px] font-normal italic text-[#0f110f] md:text-[36px]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Bring your events to life
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="text-[16px] font-light leading-relaxed text-[#6f6f6f]">
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
                <li key={item} className="flex items-start gap-3 text-[14px] text-[#6f6f6f]">
                  <CheckCircle size={20} color="#2f8f45" weight="fill" className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={itemVariants}>
              <Link
                href="/waitlist?role=organizer"
                className="inline-flex h-12 items-center rounded-full border border-[rgba(47,143,69,0.35)] px-7 text-[14px] font-bold text-[#2f8f45] transition hover:bg-[rgba(47,143,69,0.06)]"
              >
                Join as an Organizer →
              </Link>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div variants={itemVariants}>
            <div
              className="rounded-[16px] border border-black/[0.07] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.07)]"
              style={{ transform: "rotate(2deg)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[#0f110f]">My Events</p>
                <button className="rounded-full bg-[#2f8f45] px-3 py-1 text-[11px] font-bold text-white">
                  New Event +
                </button>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { val: "GHS 12,400", lbl: "Revenue" },
                  { val: "247",        lbl: "Tickets sold" },
                  { val: "4.8★",      lbl: "Avg rating" },
                ].map((s) => (
                  <div key={s.lbl} className="rounded-[10px] bg-[#f5f5f5] px-3 py-2.5">
                    <p
                      className="text-[18px] font-normal italic text-[#0f110f]"
                      style={{ fontFamily: "'DM Serif Display', serif" }}
                    >
                      {s.val}
                    </p>
                    <p className="text-[11px] text-[#a9a9a9]">{s.lbl}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { dot: "#7c3aed", name: "Ga Rooftop After Hours", status: "Published", sBg: "rgba(47,143,69,0.08)",  sClr: "#2f8f45",  amount: "GHS 5,400" },
                  { dot: "#2563eb", name: "Product Market Accra",   status: "Published", sBg: "rgba(47,143,69,0.08)",  sClr: "#2f8f45",  amount: "Free" },
                  { dot: "#d97706", name: "Accra Chef Table",        status: "Draft",     sBg: "rgba(0,0,0,0.05)",     sClr: "#9a9a9a",  amount: "GHS 3,200" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-2 rounded-[10px] bg-[#f8f8f8] px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.dot }} />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[#0f110f]">{row.name}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: row.sBg, color: row.sClr }}
                    >
                      {row.status}
                    </span>
                    <span className="shrink-0 text-[12px] text-[#6f6f6f]">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          SECTION 8 — TESTIMONIALS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <AnimatedSection className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { quote: "I found the Ga Rooftop event on a Friday afternoon and had tickets by evening. The QR check-in was seamless.", name: "Kofi Mensah",  desc: "Music lover · Osu, Accra",           initials: "KM" },
            { quote: "As an organizer, I sold out my first event in 48 hours. The analytics dashboard showed me exactly where my audience was coming from.", name: "Ama Asante",  desc: "Founder · Sankofa Sessions",         initials: "AA" },
            { quote: "I never knew there were this many things happening in Accra on weekends. GoOutside changed how I plan my weekends completely.", name: "Ekow Boateng", desc: "Tech professional · East Legon",      initials: "EB" },
          ].map(({ quote, name, desc, initials }) => (
            <motion.div
              key={name}
              variants={itemVariants}
              className="relative overflow-hidden rounded-[16px] border border-black/[0.07] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(47,143,69,0.25), transparent)" }}
              />
              <span
                className="mb-2 block text-[48px] font-normal italic leading-none text-[#2f8f45]"
                style={{ fontFamily: "'DM Serif Display', serif", opacity: 0.35 }}
              >
                &ldquo;
              </span>
              <p className="mb-5 text-[15px] font-light leading-[1.65] text-[#0f110f]">{quote}</p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(47,143,69,0.08)] text-[13px] font-semibold text-[#2f8f45]">
                  {initials}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0f110f]">{name}</p>
                  <p className="text-[12px] text-[#a9a9a9]">{desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ════════════════════════════════════════ */}
      <section
        className="relative py-20 text-center"
        style={{ background: "radial-gradient(ellipse at center, rgba(47,143,69,0.06) 0%, transparent 70%)" }}
      >
        <AnimatedSection className="mx-auto max-w-[640px] px-6">
          <motion.div variants={itemVariants}>
            <span className="mb-5 inline-block rounded-full border border-[rgba(47,143,69,0.25)] bg-[rgba(47,143,69,0.07)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f8f45]">
              Early access — limited spots
            </span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="mb-4 text-[36px] font-normal italic text-[#0f110f] md:text-[48px]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            The city is going out.{" "}
            <span className="text-[#2f8f45]">Are you?</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="mb-8 text-[16px] font-light text-[#6f6f6f]">
            We&apos;re launching soon. Join the waitlist to get early access,
            first-look at events, and exclusive ticket drops.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              href="/waitlist"
              className="inline-flex h-14 items-center rounded-full bg-[#2f8f45] px-10 text-[16px] font-bold text-white shadow-[0_4px_20px_rgba(47,143,69,0.30)]"
              style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
            >
              Join the Waitlist — It&apos;s Free
            </Link>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-5 text-[13px] text-[#c0c0c0]">
            No spam · Free forever to browse · Ghanaian-made 🇬🇭
          </motion.p>
        </AnimatedSection>
      </section>

      {/* Search loader overlay */}
      <AnimatePresence>
        {searching && <SearchLoader query={searchQuery} />}
      </AnimatePresence>

      {/* LockModal */}
      <AnimatePresence>
        {lockedEvent !== undefined && (
          <LockModal event={lockedEvent} onClose={closeLock} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(47,143,69,0.30); }
          50%       { box-shadow: 0 4px 32px rgba(47,143,69,0.50); }
        }
      `}</style>
    </>
  );
}
