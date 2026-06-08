"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Fredoka, Nunito } from "next/font/google";
import { Star, ArrowRight, House, MagnifyingGlass, Confetti } from "@phosphor-icons/react";

/* ── Google Fonts ──────────────────────────────────────── */
const fredoka = Fredoka({
  subsets: ["latin"],
  weight:  ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight:  ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

/* ── Palette — GoOutside green on cream ──────────────── */
const P = {
  cream:  "#f5eed8",
  dark:   "#0f1a0f",
  green:  "#2f8f45",
  lime:   "#5FBF2A",
  mid:    "#1e4d26",
  muted:  "rgba(15,26,15,0.55)",
  faint:  "rgba(47,143,69,0.12)",
  border: "rgba(47,143,69,0.30)",
};

/* ── Trotro (GoOutside green palette) ─────────────────── */
function Trotro({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 340 188" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* roof rack */}
      <rect x="30" y="26" width="262" height="16" rx="6" fill={P.mid} stroke={P.dark} strokeWidth="2.5"/>
      <rect x="56"  y="20" width="9" height="10" rx="3" fill={P.dark}/>
      <rect x="102" y="20" width="9" height="10" rx="3" fill={P.dark}/>
      <rect x="232" y="20" width="9" height="10" rx="3" fill={P.dark}/>
      <rect x="278" y="20" width="9" height="10" rx="3" fill={P.dark}/>
      {/* body */}
      <rect x="8" y="40" width="308" height="112" rx="20" fill={P.green} stroke={P.dark} strokeWidth="4"/>
      {/* stripe */}
      <rect x="8" y="90" width="308" height="10" fill={P.lime} opacity="0.35"/>
      {/* windshield */}
      <rect x="204" y="52" width="98" height="66" rx="12" fill={P.dark} stroke={P.dark} strokeWidth="3"/>
      <path d="M212 60 Q228 55 244 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      {/* 404 sticker */}
      <text x="253" y="92" textAnchor="middle" fontSize="26" fontWeight="900"
        fill={P.lime} fontFamily="Arial Black,sans-serif">404</text>
      {/* side window */}
      <rect x="26" y="54" width="162" height="54" rx="10" fill={P.dark} stroke={P.dark} strokeWidth="3"/>
      <path d="M34 62 Q52 57 68 68" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
      <text x="107" y="79" textAnchor="middle" fontSize="13" fontWeight="900"
        fill={P.cream} fontFamily="Arial Black,sans-serif" letterSpacing="0.5">PAGE NO DEY</text>
      <text x="107" y="96" textAnchor="middle" fontSize="10" fontWeight="700"
        fill={P.lime} fontFamily="Arial,sans-serif">no stop here, chale</text>
      {/* door divider */}
      <line x1="130" y1="108" x2="130" y2="150" stroke={P.lime} strokeWidth="2" opacity="0.4"/>
      {/* body text */}
      <text x="64" y="128" textAnchor="middle" fontSize="11" fontWeight="900"
        fill={P.cream} fontFamily="Arial Black,sans-serif" opacity="0.7">ACCRA</text>
      <text x="64" y="142" textAnchor="middle" fontSize="9" fontWeight="700"
        fill={P.lime} fontFamily="Arial,sans-serif">LIFE</text>
      {/* wheels */}
      <circle cx="72"  cy="160" r="22" fill={P.dark} stroke={P.lime} strokeWidth="2.5"/>
      <circle cx="72"  cy="160" r="12" fill={P.cream} opacity="0.15"/>
      <circle cx="72"  cy="160" r="5"  fill={P.lime}/>
      <circle cx="268" cy="160" r="22" fill={P.dark} stroke={P.lime} strokeWidth="2.5"/>
      <circle cx="268" cy="160" r="12" fill={P.cream} opacity="0.15"/>
      <circle cx="268" cy="160" r="5"  fill={P.lime}/>
      {/* bumper */}
      <rect x="298" y="110" width="32" height="28" rx="8" fill={P.lime} stroke={P.dark} strokeWidth="2.5"/>
      {/* exhaust */}
      <circle cx="8"  cy="132" r="6" fill={P.dark} opacity="0.18"/>
      <circle cx="-2" cy="120" r="4" fill={P.dark} opacity="0.10"/>
    </svg>
  );
}

/* ── Jollof bowl (green tinted) ───────────────────────── */
function JollofBowl({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M45 28 Q42 20 45 12" stroke={P.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M60 24 Q57 14 60 6"  stroke={P.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M75 28 Q78 20 75 12" stroke={P.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <ellipse cx="60" cy="90" rx="48" ry="12" fill={P.dark} opacity="0.12"/>
      <path d="M15 55 Q15 95 60 95 Q105 95 105 55 Z" fill={P.green} stroke={P.dark} strokeWidth="3.5"/>
      <ellipse cx="60" cy="55" rx="45" ry="18" fill={P.lime} stroke={P.dark} strokeWidth="3.5"/>
      <ellipse cx="45" cy="52" rx="6" ry="4"   fill={P.cream} opacity="0.5"/>
      <ellipse cx="60" cy="49" rx="7" ry="4.5" fill={P.cream} opacity="0.5"/>
      <ellipse cx="75" cy="52" rx="6" ry="4"   fill={P.cream} opacity="0.5"/>
      <ellipse cx="55" cy="59" rx="5" ry="3"   fill={P.green} opacity="0.6"/>
      <ellipse cx="70" cy="58" rx="4" ry="2.5" fill={P.green} opacity="0.6"/>
      <path d="M15 55 Q60 68 105 55" stroke={P.dark} strokeWidth="2" opacity="0.4"/>
    </svg>
  );
}

/* ── Konami ────────────────────────────────────────────── */
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

/* ── Inner page content ────────────────────────────────── */
function Content() {
  const [egg, setEgg] = useState(false);
  const konamiRef = useRef<string[]>([]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      konamiRef.current = [...konamiRef.current, e.key].slice(-KONAMI.length);
      if (konamiRef.current.join(",") === KONAMI.join(",")) setEgg(true);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);


  const ff = `var(--font-fredoka), 'Arial Rounded MT Bold', sans-serif`;
  const fn = `var(--font-nunito), 'Helvetica Neue', sans-serif`;

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-y-auto ${fredoka.variable} ${nunito.variable}`}
      style={{ background: P.cream, zIndex: 99999 }}
    >
      {/* halftone */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `radial-gradient(circle, ${P.dark}1a 1.2px, transparent 1.2px)`, backgroundSize: "22px 22px" }}/>

      {/* green glow blob */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-8%] h-[500px] w-[700px] -translate-x-1/2 rounded-full"
          style={{ background: `radial-gradient(ellipse, rgba(47,143,69,0.10) 0%, transparent 65%)` }}/>
      </div>

      {/* stars */}
      {[
        { x: "7%",  y: "9%",  sz: 18, delay: 0,   color: P.lime  },
        { x: "90%", y: "7%",  sz: 14, delay: 0.5, color: P.green },
        { x: "4%",  y: "70%", sz: 11, delay: 1.1, color: P.dark  },
        { x: "93%", y: "68%", sz: 15, delay: 0.8, color: P.lime  },
        { x: "48%", y: "4%",  sz: 12, delay: 0.3, color: P.green },
        { x: "86%", y: "38%", sz: 9,  delay: 1.4, color: P.lime  },
        { x: "13%", y: "44%", sz: 10, delay: 0.9, color: P.dark  },
        { x: "70%", y: "88%", sz: 9,  delay: 0.6, color: P.green },
      ].map((s, i) => (
        <motion.div key={i} className="pointer-events-none absolute"
          style={{ left: s.x, top: s.y }}
          animate={{ y: [0, -10, 0], rotate: [0, 22, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 3.5 + i*0.4, repeat: Infinity, ease: "easeInOut", delay: s.delay }}>
          <Star size={s.sz} weight="fill" style={{ color: s.color }}/>
        </motion.div>
      ))}

      {/* jollof bowl */}
      <motion.div className="pointer-events-none absolute right-6 top-6 hidden md:block"
        animate={{ y: [0, -10, 0], rotate: [-3, 4, -3] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
        <JollofBowl style={{ width: 88, opacity: 0.85 }}/>
      </motion.div>

      {/* mini logo */}
      <div className="relative z-10 flex items-center justify-center pt-4">
        <Link href="/">
          <Image src="/logo-full.png" alt="GoOutside" width={120} height={34} style={{ objectFit: "contain" }} />
        </Link>
      </div>

      {/* main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-2 text-center">

        {/* Ei! */}
        <motion.p
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 180, delay: 0.05 }}
          style={{ fontFamily: ff, fontSize: "clamp(36px,6.5vw,52px)", fontWeight: 700, color: P.green, lineHeight: 1, marginBottom: 0 }}>
          Ei!
        </motion.p>

        {/* 404 */}
        <div className="mb-0 flex items-end justify-center" style={{ gap: "clamp(2px,1vw,10px)" }}>
          {[
            { n: "4", color: P.dark,  rotate: -4 },
            { n: "0", color: P.green, rotate:  0 },
            { n: "4", color: P.dark,  rotate:  4 },
          ].map(({ n, color, rotate }, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 36, rotate: rotate * 2 }}
              animate={{ opacity: 1, y: 0,  rotate }}
              transition={{ type: "spring", damping: 11, stiffness: 200, delay: 0.08 + i * 0.07 }}
              style={{
                fontFamily: ff,
                fontSize:   "clamp(76px,15vw,124px)",
                fontWeight: 700,
                color,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                display: "inline-block",
                WebkitTextStroke: n === "0" ? `4px ${P.dark}` : `3px ${P.cream}`,
                paintOrder: "stroke fill",
                textShadow: n === "0" ? `4px 4px 0 ${P.lime}40` : `3px 3px 0 rgba(0,0,0,0.12)`,
              }}>
              {n}
            </motion.span>
          ))}
        </div>

        {/* trotro — full viewport width container, starts off right edge */}
        <div className="relative overflow-hidden" style={{ width: "100vw", height: 168, marginLeft: "calc(-50vw + 50%)", marginBottom: -8 }}>
          <motion.div
            initial={{ x: "105vw" }}
            animate={{ x: "-110vw" }}
            transition={{ duration: 7, delay: 0.8, ease: [0.25, 0, 0.6, 1], repeat: Infinity, repeatDelay: 4 }}
            style={{ position: "absolute", top: 0, left: 0, width: "min(300px, 72vw)" }}>
            <Trotro style={{ width: "100%" }}/>
          </motion.div>
        </div>

        {/* headline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.45 }}>
          <p style={{ fontFamily: ff, fontSize: "clamp(13px,2.5vw,17px)", fontWeight: 500, color: P.dark, lineHeight: 1.2, marginBottom: 2, opacity: 0.7 }}>
            This page vanished like
          </p>
          <p style={{ fontFamily: ff, fontSize: "clamp(30px,6.5vw,50px)", fontWeight: 700, color: P.green, lineHeight: 0.95, marginBottom: 2,
            textShadow: `3px 3px 0 ${P.lime}50, 5px 5px 0 rgba(0,0,0,0.07)` }}>
            free jollof
          </p>
          <p style={{ fontFamily: ff, fontSize: "clamp(13px,2.5vw,17px)", fontWeight: 500, color: P.dark, lineHeight: 1.2, marginBottom: 10, opacity: 0.7 }}>
            at a party.
          </p>
        </motion.div>

        {/* body copy */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
          style={{ fontFamily: fn, fontSize: "clamp(12px,1.6vw,14px)", color: P.muted, lineHeight: 1.6, maxWidth: 360, marginBottom: 16 }}>
          We checked Osu, Labone, even Madina — nothing.
          The URL moved. Or maybe it never existed.
          Chale, it&apos;s gone.
        </motion.p>

        {/* buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
          className="mb-3 flex flex-wrap justify-center gap-3">
          <Link href="/home"
            className="flex items-center gap-2 rounded-2xl px-7 font-bold text-white transition hover:brightness-110 active:scale-95"
            style={{ height: 46, fontFamily: ff, fontSize: 16, fontWeight: 600, background: P.green,
              border: `3px solid ${P.dark}`, boxShadow: `4px 4px 0 ${P.dark}` }}>
            <House size={16} weight="fill"/> Take me home
          </Link>
          <Link href="/search"
            className="flex items-center gap-2 rounded-2xl px-7 transition hover:opacity-80 active:scale-95"
            style={{ height: 46, fontFamily: ff, fontSize: 16, fontWeight: 600, color: P.dark,
              background: P.cream, border: `3px solid ${P.dark}`, boxShadow: `4px 4px 0 ${P.dark}` }}>
            <MagnifyingGlass size={18} weight="bold"/> Find events
          </Link>
        </motion.div>

        {/* quick chips */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
          className="mb-5 flex flex-wrap justify-center gap-2">
          {["/events", "/dashboard/rewards", "/organizers"].map((href, i) => (
            <Link key={href} href={href}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition hover:opacity-80"
              style={{ background: P.faint, color: P.green, border: `1.5px solid ${P.border}`, fontFamily: fn }}>
              {["Browse events →", "Pulse Points →", "Organizers →"][i]}
            </Link>
          ))}
        </motion.div>

        {/* konami egg */}
        <AnimatePresence>
          {egg && (
            <motion.div initial={{ opacity: 0, scale: 0.88, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 rounded-2xl px-6 py-4 text-center"
              style={{ background: P.faint, border: `2px solid ${P.border}`, maxWidth: 380,
                boxShadow: `3px 3px 0 ${P.dark}` }}>
              <p className="mb-1 flex items-center justify-center gap-2"
                style={{ fontFamily: ff, fontSize: 17, fontWeight: 600, color: P.green }}>
                <Confetti size={18} weight="fill"/> Ei chale, you found it!
              </p>
              <p style={{ fontFamily: fn, fontSize: 13, color: P.muted, lineHeight: 1.65 }}>
                The first event ever listed on GoOutside was a beach rave in Labadi.
                The page URL broke after the party. Some things never change.
              </p>
            </motion.div>
          )}
        </AnimatePresence>


      </main>
    </div>
  );
}

/* ── Page — portal to body to escape app stacking context */
export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Content />, document.body);
}
