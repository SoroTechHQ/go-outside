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
  UserCirclePlus,
} from "@phosphor-icons/react";
import { EventPreviewCard } from "../../components/landing/EventPreviewCard";
import { LockModal }        from "../../components/landing/LockModal";
import { TickerBar }        from "../../components/landing/TickerBar";
import { AnimatedCounter }  from "../../components/landing/AnimatedCounter";
import type { LandingEvent, TickerEvent } from "../../lib/landing-data";

/* ── Typewriter (search bar placeholder cycling) ─────────────────── */

const TYPEWRITER_PHRASES = [
  "Karnival Kingdom · Apr 25",
  "Rapperholic 2026",
  "Chale Wote · August",
  "things to do this weekend",
  "Bhim Festival · Dec 24",
  "jazz nights in Accra",
  "Accra Food Festival",
  "beach vibes in Labadi",
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
          timeout = setTimeout(tick, 2200);
          return;
        }
        timeout = setTimeout(tick, 72);
      } else {
        charIdx.current--;
        setDisplay(phrase.slice(0, charIdx.current));
        if (charIdx.current === 0) {
          deleting.current  = false;
          phraseIdx.current = (phraseIdx.current + 1) % TYPEWRITER_PHRASES.length;
          timeout = setTimeout(tick, 300);
          return;
        }
        timeout = setTimeout(tick, 38);
      }
    }

    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, [active]);

  return display;
}

/* ── Search loader overlay ───────────────────────────────────────── */

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

      {query && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 max-w-xs truncate text-center text-[18px] font-bold text-[#0f110f]"
        >
          &ldquo;{query}&rdquo;
        </motion.p>
      )}

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

/* ── Variants ────────────────────────────────────────────────────── */

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

function clientShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/* ── Props ───────────────────────────────────────────────────────── */

interface LandingClientProps {
  events:      LandingEvent[];
  tickerItems: TickerEvent[];
}

/* ── Page ────────────────────────────────────────────────────────── */

export function LandingClient({ events, tickerItems }: LandingClientProps) {
  const router = useRouter();

  const [displayEvents] = useState<LandingEvent[]>(() => clientShuffle(events));

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
    setTimeout(() => router.push("/sign-in"), 900);
  }

  function handleSearch() {
    triggerSearch(searchVal);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  function scrollRow(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  }

  const featuredEvent = displayEvents[0]!;
  const gridEvents    = displayEvents.slice(1, 5);
  const recentEvents  = displayEvents.slice(1, 12);
  const mobileCards   = displayEvents.slice(0, 3);

  return (
    <>

      {/* ════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
        {/* ── Video + shader stack ── */}
        <div className="absolute inset-0" style={{ zIndex: 0, isolation: "isolate" }}>
          <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0" style={{ background: "#2f8f45", mixBlendMode: "hue", opacity: 0.62 }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.42)", mixBlendMode: "multiply" }} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 65% 45% at 50% 40%, rgba(47,143,69,0.22) 0%, transparent 70%)", mixBlendMode: "screen" }}
          />
        </div>

        {/* ── Floating card left — desktop only ── */}
        <motion.div
          className="pointer-events-none absolute left-[calc(50%-490px)] top-1/2 hidden -translate-y-1/2 lg:block"
          style={{ rotate: -6, opacity: 0.80, willChange: "transform", zIndex: 5 }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={featuredEvent} variant="compact" onClick={() => openLock(featuredEvent)} />
          </div>
        </motion.div>

        {/* ── Floating card right — desktop only ── */}
        <motion.div
          className="pointer-events-none absolute right-[calc(50%-490px)] top-1/2 hidden -translate-y-1/2 lg:block"
          style={{ rotate: 6, opacity: 0.80, willChange: "transform", zIndex: 5 }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="w-52 pointer-events-auto">
            <EventPreviewCard event={displayEvents[2]!} variant="compact" onClick={() => openLock(displayEvents[2]!)} />
          </div>
        </motion.div>

        {/* ── Center content ── */}
        <div className="relative flex w-full max-w-[600px] flex-col items-center text-center" style={{ zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 flex flex-col items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,143,69,0.50)] bg-[rgba(20,60,30,0.45)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86efac] backdrop-blur-xl shadow-[0_0_20px_rgba(47,143,69,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]">
              🇬🇭 &nbsp;Made in Ghana
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Accra&apos;s Social Event Platform
            </p>
          </motion.div>

          <div className="mb-5">
            {["Your city", "is going out."].map((line, i) => (
              <motion.h1
                key={line}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="block text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[56px] md:text-[72px]"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}
              >
                {line}
              </motion.h1>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8 max-w-[480px] text-[15px] font-light text-white/75 sm:text-[18px]"
          >
            Find what&apos;s on. See who&apos;s going. Go with your people.
          </motion.p>

          {/* Search bar — functional from the landing page */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-7 w-full"
          >
            <div
              className="flex h-14 w-full items-center rounded-full bg-white/95 backdrop-blur-md transition-all duration-200"
              style={{
                border:    searchFocused ? "1px solid rgba(47,143,69,0.55)" : "1px solid rgba(255,255,255,0.20)",
                boxShadow: searchFocused ? "0 0 0 3px rgba(47,143,69,0.15), 0 4px 30px rgba(0,0,0,0.25)" : "0 4px 30px rgba(0,0,0,0.30)",
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
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="w-full bg-transparent text-[15px] text-[#0f110f] outline-none placeholder-transparent"
                  placeholder="Search events"
                  aria-label="Search events"
                />
                {!searchVal && !searchFocused && (
                  <span
                    className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-[#b0b0b0]"
                    aria-hidden
                  >
                    {typewriter}
                    <span className="ml-px inline-block w-[1px] animate-pulse bg-[#c0c0c0]">&nbsp;</span>
                  </span>
                )}
                {!searchVal && !searchFocused && !typewriter && (
                  <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-[#c0c0c0]" aria-hidden>
                    Search events in Accra&hellip;
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="mr-2 flex h-10 items-center rounded-full bg-[#2f8f45] px-5 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(47,143,69,0.40)] transition hover:bg-[#256f36] active:scale-95"
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
            className="flex items-center gap-5"
          >
            {[
              { num: "12K+", label: "going out in Accra" },
              { num: "200+", label: "events this month" },
              { num: "4.8★", label: "avg event rating" },
            ].map((stat, i) => (
              <div key={stat.num} className="flex items-center gap-5">
                {i > 0 && <div className="h-4 w-px bg-white/20" />}
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-[#4ade80]">{stat.num}</span>
                  <span className="text-[11px] font-light text-white/55">{stat.label}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Mobile event cards strip — visible on small screens only */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 w-full lg:hidden"
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Happening now
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mobileCards.map((ev) => (
                <div key={ev.id} className="w-[190px] shrink-0">
                  <EventPreviewCard event={ev} variant="compact" onClick={() => openLock(ev)} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator — desktop only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-10 hidden flex-col items-center gap-1.5 lg:flex"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">Scroll</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
              <ArrowDown size={14} color="rgba(255,255,255,0.35)" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — TICKER
      ════════════════════════════════════════ */}
      <TickerBar events={tickerItems} />

      {/* ════════════════════════════════════════
          SECTION 2b — EVENTS YOU'LL FIND
      ════════════════════════════════════════ */}
      <section className="border-y border-black/[0.06] bg-[#fafafa] py-10">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c0c0c0]">
            What&apos;s on GoOutside right now
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {[
              { name: "Afro Nation Ghana",              style: { fontWeight: 800, letterSpacing: "-0.02em" } },
              { name: "Rapperholic",                    style: { fontWeight: 700, fontStyle: "italic" } },
              { name: "Chale Wote",                     style: { fontWeight: 800 } },
              { name: "Karnival Kingdom",               style: { fontWeight: 900, letterSpacing: "-0.01em" } },
              { name: "Detty December",                 style: { fontWeight: 800 } },
              { name: "Accra Food Festival",            style: { fontWeight: 600 } },
              { name: "Bhim Festival",                  style: { fontWeight: 700, fontStyle: "italic" } },
              { name: "Tidal Rave",                     style: { fontWeight: 800 } },
              { name: "Chale Wote",                     style: { fontWeight: 600, fontStyle: "italic" } },
              { name: "Jazz at Alliance Française",     style: { fontWeight: 600 } },
            ]
              .filter((v, i, arr) => arr.findIndex(x => x.name === v.name) === i)
              .map(({ name, style }) => (
                <span
                  key={name}
                  className="text-[15px] text-[#b0b0b0] transition-colors hover:text-[#0f110f]"
                  style={style}
                >
                  {name}
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — EVENT CARDS
      ════════════════════════════════════════ */}
      <section className="w-full px-5 py-16 md:px-10">
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
              Sign up to save events, buy tickets, and see what your crew is going to.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[55fr_45fr]">
            <motion.div variants={itemVariants} className="min-h-[420px]">
              <EventPreviewCard event={featuredEvent} variant="featured" onClick={() => openLock(featuredEvent)} />
            </motion.div>
            <div className="grid grid-cols-2 gap-4" style={{ gridAutoRows: "1fr" }}>
              {gridEvents.map((ev) => (
                <motion.div key={ev.id} variants={itemVariants} className="h-full">
                  <EventPreviewCard event={ev} variant="standard" onClick={() => openLock(ev)} />
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — HAPPENING RECENTLY
      ════════════════════════════════════════ */}
      <section className="py-10">
        <div className="px-5 md:px-10">
          <AnimatedSection className="mb-5 flex items-center justify-between">
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2f8f45]" />
              <h3
                className="text-[22px] font-normal italic text-[#0f110f]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                More events to explore
              </h3>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-3">
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
          className="flex gap-4 overflow-x-auto px-5 pb-5 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {recentEvents.map((ev) => (
            <div
              key={ev.id}
              className="w-[280px] shrink-0 sm:w-[320px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <EventPreviewCard event={ev} variant="standard" onClick={() => openLock(ev)} />
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5 — HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="mb-10 text-center">
          <motion.p variants={itemVariants} className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">
            How it works
          </motion.p>
          <motion.h2
            variants={itemVariants}
            className="text-[28px] font-bold text-[#0f110f] md:text-[36px]"
          >
            GoOutside is a social thing.
          </motion.h2>
          <motion.p variants={itemVariants} className="mx-auto mt-2 max-w-[420px] text-[15px] font-light text-[#6f6f6f]">
            It&apos;s not just about finding events. It&apos;s about going together.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: MagnifyingGlass,
              step: "01",
              title: "Find your vibe",
              body:  "Browse events personalised to what you love and what your people are doing. Accra has more going on than you think.",
            },
            {
              icon: UserCirclePlus,
              step: "02",
              title: "See who's going",
              body:  "Follow friends, see their plans, save events as a crew. Know before you go — who from your circle is already there.",
            },
            {
              icon: Ticket,
              step: "03",
              title: "Get there. Earn more.",
              body:  "Buy tickets with Paystack — card, MoMo, or bank. Check in with your QR code and earn Pulse Points for every event.",
            },
          ].map(({ icon: Icon, step, title, body }) => (
            <motion.div
              key={step}
              variants={itemVariants}
              className="relative overflow-hidden rounded-[16px] border border-black/[0.07] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(47,143,69,0.25), transparent)" }}
              />
              <span
                className="absolute right-5 top-4 select-none text-[48px] font-black leading-none text-[#0f110f]"
                style={{ opacity: 0.04 }}
              >
                {step}
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(47,143,69,0.08)]">
                <Icon size={28} color="#2f8f45" />
              </div>
              <h3 className="mb-2 text-[20px] font-semibold text-[#0f110f]">{title}</h3>
              <p className="text-[14px] font-light leading-[1.65] text-[#6f6f6f]" dangerouslySetInnerHTML={{ __html: body }} />
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
            { target: 12,  suffix: "K+", label: "People going out" },
            { target: 200, suffix: "+",  label: "Events this month" },
            { target: 6,   suffix: "",   label: "Cities covered" },
            { display: "4.8★", label: "Average rating" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex flex-1 items-center">
              {i > 0 && <div className="mx-auto hidden h-12 w-px self-center bg-black/[0.07] sm:block" />}
              <div className="flex-1 text-center">
                <p className="text-[32px] font-bold leading-none text-[#0f110f] md:text-[40px]">
                  {"display" in stat && stat.display ? stat.display : (
                    <AnimatedCounter
                      target={(stat as { target: number; suffix: string; label: string }).target}
                      suffix={(stat as { target: number; suffix: string; label: string }).suffix}
                    />
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
              <h2 className="text-[28px] font-bold text-[#0f110f] md:text-[36px]">
                Turn your idea into Accra&apos;s next big event.
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="text-[16px] font-light leading-relaxed text-[#6f6f6f]">
              Sell tickets, grow your audience, and track your numbers — all in one place.
              Built for Ghana. No monthly fees. Just a small platform cut when you sell.
            </motion.p>
            <motion.ul variants={itemVariants} className="space-y-3">
              {[
                "Live ticket sales with Paystack — card, MoMo, bank",
                "Real-time attendee check-in via QR code",
                "Analytics: revenue, ticket velocity, audience breakdown",
                "Free to list. 5% only on paid ticket sales.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-[#6f6f6f]">
                  <CheckCircle size={20} color="#2f8f45" weight="fill" className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={itemVariants}>
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center rounded-full border border-[rgba(47,143,69,0.35)] px-7 text-[14px] font-bold text-[#2f8f45] transition hover:bg-[rgba(47,143,69,0.06)]"
              >
                Join as an Organizer →
              </Link>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div variants={itemVariants}>
            <div
              className="rounded-[16px] border border-black/[0.07] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.09)]"
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
                  { val: "GHS 18,600", lbl: "Revenue" },
                  { val: "342",        lbl: "Tickets sold" },
                  { val: "4.8★",      lbl: "Avg rating" },
                ].map((s) => (
                  <div key={s.lbl} className="rounded-[10px] bg-[#f5f5f5] px-3 py-2.5">
                    <p className="text-[15px] font-bold text-[#0f110f]">{s.val}</p>
                    <p className="text-[11px] text-[#a9a9a9]">{s.lbl}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { dot: "#7c3aed", name: "Karnival Kingdom",   status: "Published", sBg: "rgba(47,143,69,0.08)", sClr: "#2f8f45", amount: "GHS 8,200" },
                  { dot: "#d97706", name: "Accra Food Festival", status: "Published", sBg: "rgba(47,143,69,0.08)", sClr: "#2f8f45", amount: "GHS 6,400" },
                  { dot: "#2563eb", name: "Osu Night Market Vol. 3", status: "Draft", sBg: "rgba(0,0,0,0.05)", sClr: "#9a9a9a", amount: "Free" },
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
        <AnimatedSection className="mb-8 text-center">
          <motion.p variants={itemVariants} className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a9a9a9]">
            Real people. Real nights out.
          </motion.p>
        </AnimatedSection>
        <AnimatedSection className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              quote:    "Saw Karnival Kingdom was on through my friend's feed. Had 4 of us with tickets in 20 minutes. That's the app doing its thing.",
              name:     "Kwame Acheampong",
              desc:     "Music head · Labone, Accra",
              initials: "KA",
            },
            {
              quote:    "I found out about a rooftop in Osu because someone I follow saved it. Went. Met new people. The Following feed is underrated.",
              name:     "Abena Darko",
              desc:     "Content creator · East Legon, Accra",
              initials: "AD",
            },
            {
              quote:    "Sold 280 tickets to our Accra Food Festival pop-up in 5 days. The analytics showed me exactly where my audience came from. Proper.",
              name:     "Nana Osei-Bonsu",
              desc:     "Founder · Kesa Events, Accra",
              initials: "NO",
            },
          ].map(({ quote, name, desc, initials }) => (
            <motion.div
              key={name}
              variants={itemVariants}
              className="relative overflow-hidden rounded-[16px] border border-black/[0.07] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(47,143,69,0.25), transparent)" }}
              />
              <span
                className="mb-2 block text-[48px] font-bold leading-none text-[#2f8f45]"
                style={{ opacity: 0.35 }}
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
          SECTION 8b — PULSE POINTS
      ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <AnimatedSection className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">

          {/* Left: copy */}
          <div className="flex flex-col justify-center space-y-5">
            <motion.div variants={itemVariants}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">Pulse Points</p>
              <h2 className="text-[28px] font-bold text-[#0f110f] md:text-[36px]">
                Going out earns you more.
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="text-[16px] font-light leading-relaxed text-[#6f6f6f]">
              Every event you attend, ticket you buy, and friend you bring earns Pulse Points.
              Unlock tiers — and tiers unlock real rewards: tickets, perks, and early access.
            </motion.p>
            <motion.ul variants={itemVariants} className="space-y-3">
              {[
                "Earn points every time you go out",
                "Climb from Newcomer to Legend",
                "Redeem for tickets and event perks",
                "2× points for Founding Explorers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-[#6f6f6f]">
                  <CheckCircle size={20} color="#2f8f45" weight="fill" className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Right: tier cards */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
            {[
              { tier: "Newcomer",   range: "0 – 499 pts",    color: "#6f6f6f", bg: "#f7f7f7",              border: "rgba(0,0,0,0.07)"        },
              { tier: "Regular",    range: "500 – 1,499 pts", color: "#2563eb", bg: "rgba(37,99,235,0.05)", border: "rgba(37,99,235,0.15)"    },
              { tier: "Plugged In", range: "1,500 – 3,999",  color: "#7c3aed", bg: "rgba(124,58,237,0.05)",border: "rgba(124,58,237,0.18)"   },
              { tier: "Scene King", range: "4,000 – 9,999",  color: "#d97706", bg: "rgba(217,119,6,0.05)", border: "rgba(217,119,6,0.2)"     },
              { tier: "Legend",     range: "10,000+ pts",    color: "#2f8f45", bg: "rgba(47,143,69,0.06)", border: "rgba(47,143,69,0.22)",
                badge: "Founding Explorer 2× bonus" },
            ].map(({ tier, range, color, bg, border, badge }) => (
              <div
                key={tier}
                className="flex items-center justify-between rounded-[12px] px-4 py-3"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0f110f]">{tier}</p>
                    {badge && <p className="text-[11px]" style={{ color }}>{badge}</p>}
                  </div>
                </div>
                <span className="text-[12px] font-medium text-[#a9a9a9]">{range}</span>
              </div>
            ))}
          </motion.div>
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
              Free to join
            </span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="mb-4 text-[36px] font-extrabold tracking-tight text-[#0f110f] md:text-[48px]"
          >
            The city is going out.{" "}
            <span className="text-[#2f8f45]">Are you?</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="mb-8 text-[16px] font-light text-[#6f6f6f]">
            Create your account in seconds. Find what&apos;s happening, see what your crew is going to,
            and go outside — together.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              href="/sign-up"
              className="inline-flex h-14 items-center rounded-full bg-[#2f8f45] px-10 text-[16px] font-bold text-white shadow-[0_4px_20px_rgba(47,143,69,0.30)]"
              style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
            >
              Get Started — It&apos;s Free
            </Link>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-5 text-[13px] text-[#c0c0c0]">
            Made in Ghana 🇬🇭 &nbsp;·&nbsp; Built for Ghanaians &nbsp;·&nbsp; Go outside.
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
