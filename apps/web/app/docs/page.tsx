"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, MagnifyingGlass, X, List,
  ArrowRight, ArrowUpRight, CaretRight, CaretDown,
  RocketLaunch, Bug, Compass, Ticket, Lightning,
  UsersThree, Buildings, Question, ChatCircleDots,
  CheckCircle, Warning, Info, SealCheck, Link as LinkIcon, Check,
} from "@phosphor-icons/react";

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────── */

type View = "home" | "article";

interface Section {
  id:       string;
  title:    string;
  Icon:     React.ElementType;
  color:    string;
  tagline:  string;
  articles: Article[];
}

interface Article {
  id:       string;
  title:    string;
  audience: "everyone" | "technical" | "tester";
  body:     (ctx: BodyCtx) => React.ReactNode;
}

interface BodyCtx { dark: boolean }

/* ─────────────────────────────────────────────────────────────────────────
   BODY HELPERS
───────────────────────────────────────────────────────────────────────── */

function P({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return <p className="mb-4 text-[15px] leading-[1.75]" style={{ color: dark ? "#b0b0b0" : "#374151" }}>{children}</p>;
}
function H3({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return <h3 className="mb-3 mt-7 text-[17px] font-bold" style={{ color: dark ? "#f0f0f0" : "#111827" }}>{children}</h3>;
}
function UL({ dark, items }: { dark: boolean; items: string[] }) {
  return (
    <ul className="mb-4 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: dark ? "#b0b0b0" : "#374151" }}>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#2f8f45" }} />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  );
}
function OL({ dark, items }: { dark: boolean; items: string[] }) {
  return (
    <ol className="mb-4 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px]" style={{ color: dark ? "#b0b0b0" : "#374151" }}>
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "#2f8f45" }}>{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ol>
  );
}
function Callout({ dark, type = "tip", children }: { dark: boolean; type?: "tip" | "warning" | "note" | "alpha"; children: React.ReactNode }) {
  const cfg = {
    tip:     { Icon: CheckCircle, bg: dark ? "rgba(47,143,69,0.10)"  : "#f0f9f2",  border: dark ? "rgba(47,143,69,0.3)"   : "#c8e8ce",  text: "#2f8f45",  label: "Tip"         },
    warning: { Icon: Warning,     bg: dark ? "rgba(245,158,11,0.08)" : "#fffbeb",  border: dark ? "rgba(245,158,11,0.3)"  : "#fde68a",  text: "#d97706",  label: "Note"        },
    note:    { Icon: Info,        bg: dark ? "rgba(59,130,246,0.08)" : "#eff6ff",  border: dark ? "rgba(59,130,246,0.3)"  : "#bfdbfe",  text: "#2563eb",  label: "Info"        },
    alpha:   { Icon: SealCheck,   bg: dark ? "rgba(95,191,42,0.08)"  : "#f0fdf4",  border: dark ? "rgba(95,191,42,0.25)"  : "#bbf7d0",  text: "#15803d",  label: "Alpha Only"  },
  }[type];
  return (
    <div className="mb-4 flex gap-3 rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon size={16} weight="fill" style={{ color: cfg.text, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: cfg.text }}>{cfg.label}</p>
        <div className="text-[13px] leading-relaxed" style={{ color: dark ? "#b0b0b0" : "#374151" }}>{children}</div>
      </div>
    </div>
  );
}
function CodeBlock({ dark, children }: { dark: boolean; children: string }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-xl p-4 text-[12px] font-mono leading-relaxed"
      style={{ background: dark ? "#111" : "#1e293b", color: "#94a3b8" }}>
      {children}
    </pre>
  );
}
function Table({ dark, headers, rows }: { dark: boolean; headers: string[]; rows: string[][] }) {
  const border = dark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  return (
    <div className="mb-4 overflow-hidden rounded-xl" style={{ border: `1px solid ${border}` }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f9fafb", borderBottom: `1px solid ${border}` }}>
            {headers.map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: dark ? "#707070" : "#6b7280" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${border}` : "none", background: i % 2 === 1 ? (dark ? "rgba(255,255,255,0.02)" : "#fafafa") : "transparent" }}>
              {row.map((cell, j) => <td key={j} className="px-4 py-3" style={{ color: dark ? "#c0c0c0" : "#374151" }} dangerouslySetInnerHTML={{ __html: cell }} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────────────────── */

const SECTIONS: Section[] = [
  {
    id: "getting-started", title: "Getting Started", Icon: RocketLaunch, color: "#2f8f45", tagline: "Everything you need to get up and running with GoOutside.",
    articles: [
      {
        id: "what-is-gooutside", title: "What is GoOutside?", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>GoOutside is a social-first event discovery app built for Ghana. Think of it like a mix between Instagram, Eventbrite, and a group chat — but specifically for going out in Accra.</P>
          <P dark={dark}>Instead of just listing events, GoOutside connects them to your social circle. You see what your friends are attending, what's trending in your city, and events matched specifically to your tastes.</P>
          <H3 dark={dark}>What you can do</H3>
          <UL dark={dark} items={["<strong>Discover events</strong> — a personalised feed built from your vibe and social graph", "<strong>Buy tickets</strong> — directly inside the app via Paystack (card, mobile money, bank transfer)", "<strong>Earn Pulse Points</strong> — a reputation score that reflects how plugged into the scene you are", "<strong>Follow people and organizers</strong> — see who's going where", "<strong>Chat</strong> — direct messages with anyone on the platform", "<strong>Organizers</strong> — create events, manage tickets, see audience analytics"]} />
          <Callout dark={dark} type="alpha">GoOutside is currently in <strong>closed alpha</strong>. You're one of the first people using it. Some features are still being built — your feedback shapes what ships next.</Callout>
        </>),
      },
      {
        id: "create-account", title: "Creating your account", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Creating a GoOutside account takes under a minute.</P>
          <OL dark={dark} items={["Go to <strong>gooutside.club</strong> and tap <strong>Get Started</strong>.", "Sign up with Google, or enter your email and create a password.", "Complete the 5-step onboarding (takes ~3 minutes).", "Your personalised feed is ready immediately."]} />
          <Callout dark={dark} type="tip">The more events you select during the History step, the higher your starting Pulse Points — and the better your first feed will be.</Callout>
        </>),
      },
      {
        id: "onboarding", title: "The onboarding flow", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Onboarding has 5 steps. Each one helps GoOutside understand your taste so your feed is relevant from day one.</P>
          <Table dark={dark} headers={["Step", "What you do", "Why it matters"]} rows={[
            ["Profile", "Name, photo, username, city", "Your public identity on the platform"],
            ["Vibe", "Pick categories you love (Music, Food, Tech…)", "Filters your feed to events you'd actually attend"],
            ["History", "Select events you've been to before", "Builds your starting Pulse score — the more you pick, the better"],
            ["Interests", "Fine-tune with sub-categories", "More specific matching (e.g. Afrobeats vs. Jazz vs. Classical)"],
            ["Pulse Reveal", "See your starting score", "Your reputation on GoOutside — it grows as you use the app"],
          ]} />
          <Callout dark={dark} type="tip">You can always edit your vibe and interests later from <strong>Dashboard → Profile → Edit</strong>.</Callout>
        </>),
      },
    ],
  },
  {
    id: "alpha-testing", title: "Alpha Testing Guide", Icon: Bug, color: "#ef4444", tagline: "How to test effectively and submit great feedback.",
    articles: [
      {
        id: "alpha-welcome", title: "Welcome, Founding Explorer", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>You're one of the first people to use GoOutside before it launches publicly. Your job: use the app like a real user, notice what breaks or feels off, and tell us about it.</P>
          <P dark={dark}>This isn't a polished product yet. Bugs are expected. Finding them early is the whole point.</P>
          <Callout dark={dark} type="alpha">As a <strong>Founding Explorer</strong>, you get a permanent badge on your profile, 2× Pulse Points for your first 90 days, and a direct line to Nana (the founder). Every piece of feedback goes straight to the team.</Callout>
          <H3 dark={dark}>Two ways to submit feedback</H3>
          <Table dark={dark} headers={["Method", "When to use it", "How to access"]} rows={[
            ["<strong>Floating button</strong>", "Quick reactions while using the app — something just broke or felt off", "Green chat icon, bottom-right corner"],
            ["<strong>Feedback form</strong>", "Detailed bug reports — steps to reproduce, screenshots, recordings", "<a href='/feedback' style='color:#2f8f45'>gooutside.club/feedback</a>"],
          ]} />
        </>),
      },
      {
        id: "what-to-test", title: "What to test — priorities", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>Focus on these areas, roughly in order of importance:</P>
          {[
            { n:"1", color:"#ef4444", area:"Core flows", items:["Sign up → onboarding → home feed (the most important path)", "Search for an event → view details → add to cart → checkout", "Follow a user → check your feed changes", "Save an event → find it in Dashboard → Saved"] },
            { n:"2", color:"#f59e0b", area:"Feed & discovery", items:["Does the feed feel relevant to your interests?", "Try the AI chat in /search — describe what you want in plain words", "Browse categories from the home rail", "Explore trending page"] },
            { n:"3", color:"#3b82f6", area:"Profile & social", items:["Edit your profile, change photo and bio", "View another user's profile", "Follow/unfollow — do counts update?", "Create a post, like it, delete it"] },
            { n:"4", color:"#8b5cf6", area:"Pulse & Rewards", items:["Check Dashboard → Rewards for your balance", "Browse the shop — do rewards show correctly?", "Activity ledger — do earned points show?"] },
            { n:"5", color:"#2f8f45", area:"Mobile experience", items:["Test on your actual phone, not just desktop", "Is navigation clean on small screens?", "Are forms usable with the keyboard open?"] },
          ].map(({ n, color, area, items }) => (
            <div key={area} className="mb-3 rounded-xl p-4" style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: color }}>{n}</span>
                <span className="text-[14px] font-semibold" style={{ color: dark ? "#f0f0f0" : "#111827" }}>{area}</span>
              </div>
              <UL dark={dark} items={items} />
            </div>
          ))}
        </>),
      },
      {
        id: "bug-severity", title: "Bug severity levels", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>When you report a bug, pick the severity level that best describes the impact.</P>
          <Table dark={dark} headers={["Level", "Meaning", "Example"]} rows={[
            ["<span style='color:#ef4444;font-weight:700'>Critical</span>", "App crashes or you can't proceed at all", "White screen on home, can't sign up"],
            ["<span style='color:#f59e0b;font-weight:700'>High</span>", "Major feature broken, workaround exists", "Search returns nothing, images won't load"],
            ["<span style='color:#3b82f6;font-weight:700'>Medium</span>", "Feature works but something is clearly wrong", "Wrong count shown, button in wrong place"],
            ["<span style='color:#6b7280;font-weight:700'>Low</span>", "Cosmetic issue, no functional impact", "Typo, slight misalignment, wrong colour"],
          ]} />
          <Callout dark={dark} type="warning">When in doubt, go higher. An over-reported critical gets fixed fast. An under-reported critical sits in the backlog.</Callout>
        </>),
      },
      {
        id: "writing-reports", title: "How to write a good bug report", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>Three things make a bug report useful. Without all three, it's hard to reproduce and slow to fix.</P>
          <H3 dark={dark}>1. Steps to reproduce</H3>
          <P dark={dark}>Exact sequence of actions that caused the issue — be specific about pages and buttons clicked.</P>
          <CodeBlock dark={dark}>{`1. Go to /home
2. Tap the search icon
3. Type 'afrobeats'
4. Tap the Events tab
→ Result: Infinite spinner, nothing loads`}</CodeBlock>
          <H3 dark={dark}>2. Expected vs. actual</H3>
          <P dark={dark}>What you thought would happen, and what actually happened.</P>
          <CodeBlock dark={dark}>{`Expected: Afrobeats events listed under the Events tab
Actual:   Infinite spinner with no results and no error message`}</CodeBlock>
          <H3 dark={dark}>3. Context (auto-captured)</H3>
          <P dark={dark}>Device, browser, screen size. The feedback form and floating widget capture this automatically — you don't need to type it.</P>
          <Callout dark={dark} type="tip">A screenshot or screen recording is worth a thousand words. Attach one whenever you can — especially for visual bugs.</Callout>
        </>),
      },
      {
        id: "ux-testing", title: "Testing UX & usability", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>UX feedback is just as valuable as bug reports. Look for moments of friction — things that made you pause, confused you, or required more effort than expected.</P>
          <H3 dark={dark}>Questions to ask yourself</H3>
          <UL dark={dark} items={["Did you pause because you weren't sure what to do next?", "Did a button label or icon confuse you?", "Did something take more taps than it should?", "Was information missing that you wanted to see?", "Did anything feel slow, stuck, or unresponsive?", "On mobile: was anything hard to tap, cramped, or off-screen?"]} />
          <Callout dark={dark} type="tip">The best UX feedback starts with <strong>"I was trying to..."</strong> — describe the goal, then what happened. You don't need to know the solution.</Callout>
        </>),
      },
      {
        id: "checklist", title: "Alpha tester checklist", audience: "tester",
        body: ({ dark }) => (<>
          <P dark={dark}>Work through this before your testing session is done:</P>
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
            {[
              "Completed the full onboarding flow (all 5 steps)",
              "Browsed the home feed for at least 5 minutes",
              "Searched for an event and tried the AI chat",
              "Opened at least one event detail page",
              "Attempted the ticket purchase flow",
              "Edited your profile (name, bio, or photo)",
              "Followed at least one person or organizer",
              "Checked Dashboard → Rewards",
              "Submitted at least one piece of feedback",
              "Tested on mobile",
            ].map((task, i, arr) => (
              <div key={task} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#f3f4f6"}` : "none" }}>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ border: `2px solid ${dark ? "rgba(255,255,255,0.15)" : "#d1d5db"}` }} />
                <span className="text-[14px]" style={{ color: dark ? "#c0c0c0" : "#374151" }}>{task}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <Link href="/feedback" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110" style={{ background: "#2f8f45" }}>
              Open feedback form <ArrowUpRight size={13} />
            </Link>
            <Link href="/home" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition" style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: dark ? "#e0e0e0" : "#374151", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}` }}>
              Go to the app <ArrowUpRight size={13} />
            </Link>
          </div>
        </>),
      },
    ],
  },
  {
    id: "events", title: "Discovering Events", Icon: Compass, color: "#3b82f6", tagline: "How to find events you'll actually want to attend.",
    articles: [
      {
        id: "how-feed-works", title: "How the feed works", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Your home feed isn't chronological — it's personalised. Every time you open the app, GoOutside scores every available event against a set of signals and surfaces the most relevant ones for you.</P>
          <H3 dark={dark}>What shapes your feed</H3>
          <UL dark={dark} items={["<strong>Your vibe</strong> — categories selected at onboarding (and editable any time)", "<strong>Social signals</strong> — events your friends are saving or attending rank higher", "<strong>Location</strong> — events close to you or in your home city get a boost", "<strong>Scarcity</strong> — events with limited tickets left surface higher", "<strong>Your history</strong> — events you've viewed, saved, and attended"]} />
          <H3 dark={dark}>Feed sections</H3>
          <Table dark={dark} headers={["Section", "What's in it"]} rows={[
            ["For You", "Highest-scoring events based on all signals combined"],
            ["This Weekend", "Events happening in the next 48–72 hours"],
            ["Friends Going", "Events people you follow are attending or saving"],
            ["Trending", "Events gaining momentum across the platform this week"],
            ["New & Notable", "Recently listed events that match your interests"],
          ]} />
        </>),
      },
      {
        id: "search", title: "Searching for events", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>The search page at <strong>/search</strong> queries events, users, and snippets in one place.</P>
          <OL dark={dark} items={["Tap the search bar — you'll see trending searches to get you started.", "Type any keyword: event name, organiser, venue, area, or vibe.", "Switch tabs to filter: <strong>Events</strong>, <strong>People</strong>, or <strong>Snippets</strong>.", "Use the <strong>AI Chat</strong> panel (✨ icon) to describe what you want in plain language."]} />
          <Callout dark={dark} type="tip">Try natural language in the AI chat: <em>"something chill this weekend in Osu under GHS 80"</em> — it understands context and returns relevant events.</Callout>
        </>),
      },
      {
        id: "saving", title: "Saving events", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Tap the bookmark icon on any event card or detail page to save it for later.</P>
          <UL dark={dark} items={["Saved events live in <strong>Dashboard → Saved</strong>", "You earn <strong>+5 Pulse Points</strong> every time you save an event", "Saves show up as social signals — your friends may see 'Kofi saved this' in their feeds"]} />
        </>),
      },
    ],
  },
  {
    id: "tickets", title: "Tickets & Payments", Icon: Ticket, color: "#f59e0b", tagline: "Buy tickets, manage them, and show them at the door.",
    articles: [
      {
        id: "buying-tickets", title: "Buying tickets", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>On any event detail page, tap <strong>Get Tickets</strong> to start the purchase flow.</P>
          <OL dark={dark} items={["Choose your ticket type and quantity.", "Review your cart — you can add multiple ticket types.", "Proceed to checkout and pay via <strong>Paystack</strong>.", "Your QR code is generated and saved to <strong>Dashboard → Tickets</strong>."]} />
          <H3 dark={dark}>Payment methods</H3>
          <UL dark={dark} items={["Card (Visa, Mastercard)", "Mobile Money (MTN, Vodafone, AirtelTigo)", "Bank transfer"]} />
          <Callout dark={dark} type="warning"><strong>Alpha note:</strong> Ticket QR generation after payment is still being completed. If you test checkout during alpha, use Paystack test cards only — don't use a real card.</Callout>
        </>),
      },
      {
        id: "your-tickets", title: "Managing your tickets", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>All your tickets live in <strong>Dashboard → Tickets</strong>. Tap any ticket to see the full QR code.</P>
          <UL dark={dark} items={["The QR code is scanned at the door — no printing needed.", "Once scanned, the ticket is marked as used automatically.", "Checking in at a live event earns you <strong>+50 Pulse Points</strong>."]} />
        </>),
      },
    ],
  },
  {
    id: "pulse", title: "Pulse Points & Rewards", Icon: Lightning, color: "#8b5cf6", tagline: "Your reputation on GoOutside — earn it, spend it.",
    articles: [
      {
        id: "what-is-pulse", title: "What are Pulse Points?", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Pulse Points (PP) are GoOutside's reputation system. They measure how plugged into the city's scene you are. The more you participate, the more you earn — and the more you can redeem.</P>
          <H3 dark={dark}>How you earn PP</H3>
          <Table dark={dark} headers={["Action", "Points"]} rows={[
            ["Buy a ticket", "+25 PP"],
            ["Check in at an event", "+50 PP"],
            ["Post a snippet", "+10 PP"],
            ["Save an event", "+5 PP"],
            ["Refer a friend", "+100 PP"],
            ["Attend your 5th event", "+150 PP (milestone)"],
            ["Attend your 10th event", "+150 PP (milestone)"],
            ["Monthly streak bonus", "+75 PP"],
          ]} />
          <Callout dark={dark} type="alpha">As a <strong>Founding Explorer</strong>, you earn PP at <strong>2× the normal rate</strong> for your first 90 days. Your score grows faster, your tier unlocks sooner.</Callout>
        </>),
      },
      {
        id: "tiers", title: "Pulse tiers", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Your <em>lifetime</em> Pulse Points determine your tier. Tiers unlock different rewards in the shop. Redeeming points reduces your spendable balance but not your lifetime total — so your tier never goes down.</P>
          <Table dark={dark} headers={["Tier", "Lifetime PP needed", "Colour"]} rows={[
            ["Newcomer", "0 – 499", "<span style='color:#6b7280'>●</span> Grey"],
            ["Regular", "500 – 1,499", "<span style='color:#2563eb'>●</span> Blue"],
            ["Plugged In", "1,500 – 3,999", "<span style='color:#7c3aed'>●</span> Purple"],
            ["Scene King", "4,000 – 9,999", "<span style='color:#d97706'>●</span> Gold"],
            ["Legend", "10,000+", "<span style='color:#2f8f45'>●</span> Green"],
          ]} />
        </>),
      },
      {
        id: "redeeming", title: "Redeeming rewards", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Go to <strong>Dashboard → Rewards → Shop</strong> to spend your Pulse Points.</P>
          <OL dark={dark} items={["Browse available rewards — ticket discounts, free tickets, exclusive access.", "Tap <strong>Redeem</strong>. A coupon code is generated instantly (format: <code>PULSE-XXXX-YYYY</code>).", "Codes are valid for 90 days and show up in the <strong>Activity</strong> tab.", "Apply the code at checkout."]} />
          <Callout dark={dark} type="note">Your spendable balance and lifetime total are separate. Redeeming spends from your balance but doesn't affect your tier (which uses lifetime).</Callout>
        </>),
      },
    ],
  },
  {
    id: "social", title: "Social & Messaging", Icon: UsersThree, color: "#10b981", tagline: "Connect with people, follow organizers, send messages.",
    articles: [
      {
        id: "following", title: "Following people & organizers", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Tap <strong>Follow</strong> on any user or organizer profile. Following is one of the strongest signals for your feed — events attended by people you follow surface much higher.</P>
          <H3 dark={dark}>Where to find people</H3>
          <UL dark={dark} items={["<strong>Explore</strong> — active users in your city this week", "<strong>Event detail pages</strong> — see who else is attending", "<strong>Search</strong> — search by username or full name"]} />
        </>),
      },
      {
        id: "messages", title: "Direct messages", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Direct messages live in <strong>Dashboard → Messages</strong>. They're powered by Stream Chat and are fully real-time.</P>
          <OL dark={dark} items={["Go to any user's profile and tap <strong>Message</strong>.", "You can also start a chat from the messages dashboard.", "Unread message count shows on the bottom nav icon."]} />
          <Callout dark={dark} type="note">Message requests from people you don't follow are handled separately (coming soon — they'll appear in a separate Request inbox).</Callout>
        </>),
      },
    ],
  },
  {
    id: "organizers", title: "For Organizers", Icon: Buildings, color: "#f59e0b", tagline: "Create events, manage tickets, and understand your audience.",
    articles: [
      {
        id: "create-event", title: "Creating an event", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>Go to <strong>Organizer Dashboard → Events → New Event</strong>.</P>
          <OL dark={dark} items={["Add your event title, description, date/time, and venue.", "Upload a banner image — recommended size: 1600×900px.", "Set ticket types — free or paid with prices in GHS.", "Add categories, tags, and any policies.", "Publish when ready — your event goes live in the GoOutside feed immediately."]} />
          <Callout dark={dark} type="warning"><strong>Pricing:</strong> Free to list. GoOutside takes a 5% platform fee on paid ticket sales only.</Callout>
        </>),
      },
      {
        id: "analytics", title: "Understanding your analytics", audience: "everyone",
        body: ({ dark }) => (<>
          <P dark={dark}>The Organizer Dashboard surfaces key metrics to help you understand your audience and optimise future events.</P>
          <UL dark={dark} items={["<strong>Revenue</strong> — total and per event, by ticket type", "<strong>Ticket velocity</strong> — how fast tickets are selling", "<strong>Audience breakdown</strong> — city, interests, Pulse tier", "<strong>Hashtag performance</strong> — reach across the platform"]} />
        </>),
      },
    ],
  },
  {
    id: "faq", title: "FAQ", Icon: Question, color: "#6b7280", tagline: "Common questions, answered.",
    articles: [
      {
        id: "faq-general", title: "General questions", audience: "everyone",
        body: ({ dark }) => (<>
          {[
            { q: "Is GoOutside free?", a: "Discovery, the social feed, and most features are free. GoOutside takes a 5% fee on paid ticket purchases only." },
            { q: "Is it only for Accra?", a: "Yes, for now. Accra is the starting city. Other Ghanaian cities will come once we've proven the model in Accra." },
            { q: "What is a Founding Member?", a: "The first 1,000 users get a permanent Founding Explorer badge on their profile and earn 2× Pulse Points for their first 90 days." },
            { q: "Can I use GoOutside as both an attendee and organizer?", a: "Yes. Any account can access the Organizer Dashboard. You don't need a separate account." },
            { q: "How do I delete my account?", a: "Go to Dashboard → Profile → Settings → Delete Account. Your data is removed within 30 days." },
          ].map(({ q, a }) => (
            <div key={q} className="mb-4 rounded-xl p-4" style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
              <p className="mb-1.5 text-[14px] font-semibold" style={{ color: dark ? "#f0f0f0" : "#111827" }}>{q}</p>
              <p className="text-[14px] leading-relaxed" style={{ color: dark ? "#a0a0a0" : "#374151" }}>{a}</p>
            </div>
          ))}
        </>),
      },
      {
        id: "faq-alpha", title: "Alpha testing FAQ", audience: "tester",
        body: ({ dark }) => (<>
          {[
            { q: "I found a bug. What do I do?", a: "Use the green floating button in the bottom-right corner for quick reports, or go to gooutside.club/feedback for a detailed form with severity, steps to reproduce, and screenshot upload." },
            { q: "What should I NOT test?", a: "Don't submit real payments during alpha testing. Use Paystack test cards only (see the Tickets section). Everything else is fair game." },
            { q: "Will my feedback actually be read?", a: "Yes — every submission emails Nana directly. For bugs, you'll get a response if we need more context." },
            { q: "How do I know the Founding Explorer badge was applied?", a: "It shows on your public profile. Go to /go/[your-username] and you should see the badge under your name." },
            { q: "Can I invite others to the alpha?", a: "Not yet — invites are controlled. If you want to bring someone specific, message Nana directly." },
          ].map(({ q, a }) => (
            <div key={q} className="mb-4 rounded-xl p-4" style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
              <p className="mb-1.5 text-[14px] font-semibold" style={{ color: dark ? "#f0f0f0" : "#111827" }}>{q}</p>
              <p className="text-[14px] leading-relaxed" style={{ color: dark ? "#a0a0a0" : "#374151" }}>{a}</p>
            </div>
          ))}
        </>),
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   SIDEBAR NAV ITEM
───────────────────────────────────────────────────────────────────────── */

function SideNavSection({ section, activeId, onSelect, dark }: {
  section: Section;
  activeId: string | null;
  onSelect: (sectionId: string, articleId: string) => void;
  dark: boolean;
}) {
  const isActive = section.articles.some(a => a.id === activeId);
  const [open, setOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition"
        style={{ color: isActive ? "#2f8f45" : (dark ? "#909090" : "#374151") }}
      >
        <span className="flex items-center gap-2">
          <section.Icon size={14} weight="fill" style={{ color: isActive ? "#2f8f45" : (dark ? "#505050" : "#9ca3af") }} />
          {section.title}
        </span>
        <CaretDown size={11} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: dark ? "#505050" : "#9ca3af" }} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="ml-3 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
              {section.articles.map(article => (
                <button
                  key={article.id}
                  onClick={() => onSelect(section.id, article.id)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-[13px] transition"
                  style={{
                    background: activeId === article.id ? (dark ? "rgba(47,143,69,0.12)" : "rgba(47,143,69,0.08)") : "transparent",
                    color:      activeId === article.id ? "#2f8f45" : (dark ? "#707070" : "#6b7280"),
                    fontWeight: activeId === article.id ? 600 : 400,
                  }}
                >
                  {article.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────── */

function DocsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dark,          setDark]          = useState(false);
  const [view,          setView]          = useState<View>("home");
  const [sectionId,     setSectionId]     = useState<string | null>(null);
  const [articleId,     setArticleId]     = useState<string | null>(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [copied,        setCopied]        = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("go_docs_dark");
    if (saved === "1") setDark(true);
  }, []);

  // On mount, read URL params and open the right article
  useEffect(() => {
    const s = searchParams.get("s");
    const a = searchParams.get("a");
    if (s && a) {
      const section = SECTIONS.find(sec => sec.id === s);
      const article = section?.articles.find(art => art.id === a);
      if (section && article) {
        setSectionId(s);
        setArticleId(a);
        setView("article");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDark = () => setDark(v => { const n = !v; localStorage.setItem("go_docs_dark", n ? "1" : "0"); return n; });

  const activeSection = SECTIONS.find(s => s.id === sectionId);
  const activeArticle = activeSection?.articles.find(a => a.id === articleId);

  const openArticle = (sid: string, aid: string) => {
    setSectionId(sid);
    setArticleId(aid);
    setView("article");
    setSidebarOpen(false);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.replace(`/docs?s=${sid}&a=${aid}`, { scroll: false });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/docs?s=${sectionId}&a=${articleId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const goHome = () => {
    setView("home");
    setSectionId(null);
    setArticleId(null);
    router.replace("/docs", { scroll: false });
  };

  // Search filter
  const searchResults = search.trim().length > 1
    ? SECTIONS.flatMap(s => s.articles
        .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase()))
        .map(a => ({ section: s, article: a }))
      ).slice(0, 8)
    : [];

  /* ── Theme tokens ── */
  const bg         = dark ? "#0d0d0d" : "#ffffff";
  const bgSidebar  = dark ? "#111111" : "#f9fafb";
  const bgHeader   = dark ? "rgba(13,13,13,0.92)" : "rgba(255,255,255,0.92)";
  const border     = dark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  const textPrim   = dark ? "#f0f0f0" : "#111827";
  const textMid    = dark ? "#909090" : "#6b7280";

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: bg, color: textPrim, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: bgHeader, backdropFilter: "blur(16px)", borderColor: border }}>
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">

          {/* Logo */}
          <button onClick={goHome} className="flex shrink-0 items-center gap-2">
            <Image src="/logo-mini.png" alt="GoOutside" width={28} height={28} style={{ objectFit: "contain", borderRadius: "6px" }} />
            <span className="text-[15px] font-bold tracking-tight" style={{ color: textPrim }}>GoOutside</span>
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: dark ? "rgba(47,143,69,0.15)" : "#f0f9f2", color: "#2f8f45", border: `1px solid ${dark ? "rgba(47,143,69,0.3)" : "#c8e8ce"}` }}>Docs</span>
          </button>

          {/* Search */}
          <div className="relative mx-4 flex-1 max-w-sm">
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 transition" style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", border: `1px solid ${searchFocused ? "#2f8f45" : border}` }}>
              <MagnifyingGlass size={14} style={{ color: textMid, flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search docs…"
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: textPrim }}
              />
              {search && <button onClick={() => setSearch("")}><X size={12} style={{ color: textMid }} /></button>}
            </div>

            {/* Search results dropdown */}
            <AnimatePresence>
              {searchFocused && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl shadow-xl"
                  style={{ background: dark ? "#1a1a1a" : "#fff", border: `1px solid ${border}`, zIndex: 100 }}
                >
                  {searchResults.map(({ section, article }) => (
                    <button
                      key={article.id}
                      onMouseDown={() => { openArticle(section.id, article.id); setSearch(""); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:opacity-80"
                      style={{ borderBottom: `1px solid ${border}` }}
                    >
                      <section.Icon size={13} style={{ color: section.color, flexShrink: 0 }} />
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: textPrim }}>{article.title}</p>
                        <p className="text-[11px]" style={{ color: textMid }}>{section.title}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            {view === "article" && (
              <button onClick={() => setSidebarOpen(v => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg md:hidden" style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: textPrim }}>
                <List size={15} />
              </button>
            )}
            <button onClick={toggleDark} className="flex h-8 w-8 items-center justify-center rounded-lg transition" style={{ background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: textMid, border: `1px solid ${border}` }} aria-label="Toggle theme">
              {dark ? <Sun size={14} weight="fill" /> : <Moon size={14} weight="fill" />}
            </button>
            <Link href="/feedback" className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 h-8 text-[12px] font-semibold text-white transition hover:brightness-110" style={{ background: "#2f8f45" }}>
              <ChatCircleDots size={13} weight="fill" /> Feedback
            </Link>
          </div>
        </div>
      </header>

      {/* ── HOME VIEW ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* Hero */}
            <div className="relative overflow-hidden border-b px-6 py-16 text-center md:py-24" style={{ borderColor: border }}>
              {/* Gradient blob */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-[400px] w-[900px] -translate-x-1/2 rounded-full" style={{ background: dark ? "radial-gradient(ellipse, rgba(47,143,69,0.08) 0%, transparent 70%)" : "radial-gradient(ellipse, rgba(47,143,69,0.07) 0%, transparent 70%)" }} />
              </div>

              <div className="relative mx-auto max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: dark ? "rgba(47,143,69,0.10)" : "#f0f9f2", border: `1px solid ${dark ? "rgba(47,143,69,0.25)" : "#c8e8ce"}` }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#2f8f45" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "#2f8f45" }}>Alpha — early access docs</span>
                </div>

                <h1 className="mb-4 text-[44px] font-bold leading-tight tracking-tight md:text-[56px]" style={{ color: textPrim }}>
                  GoOutside Docs
                </h1>
                <p className="text-[17px] leading-relaxed" style={{ color: textMid }}>
                  Everything you need to use, test, and understand GoOutside.
                  Whether you're a first-time user or a Founding Explorer — start here.
                </p>
              </div>
            </div>

            {/* Quick links row */}
            <div className="border-b px-6 py-4" style={{ borderColor: border, background: bgSidebar }}>
              <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
                <span className="text-[12px] font-medium" style={{ color: textMid }}>Quick links:</span>
                {[
                  { label: "Getting started", sid: "getting-started", aid: "what-is-gooutside" },
                  { label: "Alpha testing guide", sid: "alpha-testing", aid: "alpha-welcome" },
                  { label: "How the feed works", sid: "events", aid: "how-feed-works" },
                  { label: "Pulse Points", sid: "pulse", aid: "what-is-pulse" },
                  { label: "FAQ", sid: "faq", aid: "faq-general" },
                ].map(({ label, sid, aid }) => (
                  <button key={label} onClick={() => openArticle(sid, aid)}
                    className="rounded-full px-3 py-1 text-[12px] font-medium transition hover:opacity-80"
                    style={{ background: dark ? "rgba(255,255,255,0.06)" : "#ffffff", color: dark ? "#c0c0c0" : "#374151", border: `1px solid ${border}` }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section cards grid */}
            <div className="mx-auto max-w-7xl px-6 py-12">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {SECTIONS.map(section => (
                  <div
                    key={section.id}
                    className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                    style={{ background: dark ? "rgba(255,255,255,0.03)" : "#ffffff", border: `1px solid ${border}` }}
                    onClick={() => openArticle(section.id, section.articles[0]!.id)}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${section.color}15`, color: section.color }}>
                        <section.Icon size={19} weight="duotone" />
                      </span>
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: textMid }} />
                    </div>
                    <h3 className="mb-1.5 text-[16px] font-bold" style={{ color: textPrim }}>{section.title}</h3>
                    <p className="mb-4 text-[13px] leading-relaxed" style={{ color: textMid }}>{section.tagline}</p>
                    <div className="space-y-1">
                      {section.articles.slice(0, 3).map(article => (
                        <p key={article.id} className="text-[12px]" style={{ color: dark ? "#505050" : "#9ca3af" }}>→ {article.title}</p>
                      ))}
                      {section.articles.length > 3 && <p className="text-[12px]" style={{ color: dark ? "#505050" : "#9ca3af" }}>+{section.articles.length - 3} more</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="border-t px-6 py-12" style={{ borderColor: border, background: bgSidebar }}>
              <div className="mx-auto max-w-2xl text-center">
                <p className="mb-2 text-[18px] font-bold" style={{ color: textPrim }}>Found a bug? Have feedback?</p>
                <p className="mb-6 text-[14px]" style={{ color: textMid }}>Every report goes directly to Nana. The feedback form captures your device info, screenshot, and page URL automatically.</p>
                <Link href="/feedback" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition hover:brightness-110" style={{ background: "#2f8f45" }}>
                  Open feedback form <ArrowRight size={15} weight="bold" />
                </Link>
              </div>
            </div>

          </motion.div>
        )}

        {/* ── ARTICLE VIEW ───────────────────────────────────────── */}
        {view === "article" && activeSection && activeArticle && (
          <motion.div key="article" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="mx-auto max-w-7xl px-4 py-8 md:px-6">

            {/* Mobile sidebar drawer */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 md:hidden" style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={() => setSidebarOpen(false)} />
                  <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-14 z-50 h-[calc(100vh-56px)] w-72 overflow-y-auto p-4 md:hidden"
                    style={{ background: bgSidebar, borderRight: `1px solid ${border}` }}>
                    {SECTIONS.map(s => <SideNavSection key={s.id} section={s} activeId={articleId} onSelect={openArticle} dark={dark} />)}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex gap-8">

              {/* Sidebar (desktop) */}
              <aside className="hidden w-56 shrink-0 md:block">
                <div className="sticky top-24 space-y-0.5">
                  <button onClick={goHome} className="mb-4 flex items-center gap-1.5 text-[12px] transition" style={{ color: textMid }}>
                    <ArrowRight size={11} style={{ transform: "rotate(180deg)" }} /> All docs
                  </button>
                  {SECTIONS.map(s => <SideNavSection key={s.id} section={s} activeId={articleId} onSelect={openArticle} dark={dark} />)}
                </div>
              </aside>

              {/* Main content */}
              <main className="min-w-0 flex-1">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-[12px]" style={{ color: textMid }}>
                  <button onClick={goHome} className="transition hover:opacity-70">Docs</button>
                  <CaretRight size={10} />
                  <button onClick={() => openArticle(activeSection.id, activeSection.articles[0]!.id)} className="transition hover:opacity-70">{activeSection.title}</button>
                  <CaretRight size={10} />
                  <span style={{ color: textPrim }}>{activeArticle.title}</span>
                </div>

                {/* Article header */}
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${activeSection.color}15`, color: activeSection.color }}>
                      <activeSection.Icon size={18} weight="duotone" />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: activeSection.color }}>{activeSection.title}</p>
                      {activeArticle.audience === "tester" && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>Testers</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-[32px] font-bold leading-tight md:text-[36px]" style={{ color: textPrim }}>{activeArticle.title}</h1>
                    <button
                      onClick={copyLink}
                      title="Copy link to this page"
                      className="mt-2 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
                      style={{
                        background: copied ? (dark ? "rgba(47,143,69,0.15)" : "#f0f9f2") : (dark ? "rgba(255,255,255,0.06)" : "#f3f4f6"),
                        color: copied ? "#2f8f45" : textMid,
                        border: `1px solid ${copied ? (dark ? "rgba(47,143,69,0.3)" : "#c8e8ce") : border}`,
                      }}
                    >
                      {copied ? <Check size={12} weight="bold" /> : <LinkIcon size={12} weight="bold" />}
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>

                <div className="prose-sm max-w-none">
                  {activeArticle.body({ dark })}
                </div>

                {/* Article nav */}
                <div className="mt-12 flex items-center justify-between border-t pt-8" style={{ borderColor: border }}>
                  {(() => {
                    const allArticles = SECTIONS.flatMap(s => s.articles.map(a => ({ section: s, article: a })));
                    const idx = allArticles.findIndex(x => x.article.id === articleId);
                    const prev = allArticles[idx - 1];
                    const next = allArticles[idx + 1];
                    return (
                      <>
                        {prev ? (
                          <button onClick={() => openArticle(prev.section.id, prev.article.id)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition hover:opacity-80"
                            style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f9fafb", color: textPrim, border: `1px solid ${border}` }}>
                            <ArrowRight size={13} style={{ transform: "rotate(180deg)" }} /> {prev.article.title}
                          </button>
                        ) : <div />}
                        {next && (
                          <button onClick={() => openArticle(next.section.id, next.article.id)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition hover:opacity-80"
                            style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f9fafb", color: textPrim, border: `1px solid ${border}` }}>
                            {next.article.title} <ArrowRight size={13} />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Was this helpful */}
                <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: bgSidebar, border: `1px solid ${border}` }}>
                  <p className="mb-4 text-[15px] font-semibold" style={{ color: textPrim }}>Was this helpful?</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/feedback?page=docs" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110" style={{ background: "#2f8f45" }}>
                      Yes, thanks
                    </Link>
                    <Link href="/feedback" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition" style={{ background: dark ? "rgba(255,255,255,0.06)" : "#ffffff", color: textPrim, border: `1px solid ${border}` }}>
                      No, send feedback
                    </Link>
                  </div>
                </div>

              </main>

              {/* Right TOC */}
              <aside className="hidden w-48 shrink-0 xl:block">
                <div className="sticky top-24">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: textMid }}>On this page</p>
                  <div className="space-y-1">
                    {activeSection.articles.map(a => (
                      <button key={a.id} onClick={() => openArticle(activeSection.id, a.id)}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] transition"
                        style={{ color: a.id === articleId ? "#2f8f45" : textMid, fontWeight: a.id === articleId ? 600 : 400, background: a.id === articleId ? (dark ? "rgba(47,143,69,0.08)" : "rgba(47,143,69,0.06)") : "transparent" }}>
                        {a.title}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 space-y-2 pt-6" style={{ borderTop: `1px solid ${border}` }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: textMid }}>Stuck?</p>
                    <Link href="/feedback" className="flex items-center gap-1.5 text-[12px] transition hover:opacity-80" style={{ color: "#2f8f45" }}>
                      Submit feedback <ArrowUpRight size={11} />
                    </Link>
                    <a href="mailto:hello@mail.gooutside.club" className="flex items-center gap-1.5 text-[12px] transition hover:opacity-80" style={{ color: textMid }}>
                      Email us <ArrowUpRight size={11} />
                    </a>
                  </div>
                </div>
              </aside>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-8 border-t px-6 py-8" style={{ borderColor: border, background: bgSidebar }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <button onClick={goHome} className="flex items-center gap-2">
            <Image src="/logo-mini.png" alt="GoOutside" width={24} height={24} style={{ objectFit: "contain", borderRadius: "5px" }} />
            <span className="text-[13px] font-semibold" style={{ color: textPrim }}>GoOutside Docs</span>
          </button>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: textMid }}>
            <Link href="/feedback" className="hover:opacity-80 transition">Feedback</Link>
            <a href="mailto:hello@mail.gooutside.club" className="hover:opacity-80 transition">Contact</a>
            <Link href="/home" className="hover:opacity-80 transition">Go to app</Link>
          </div>
          <p className="text-[12px]" style={{ color: textMid }}>© {new Date().getFullYear()} GoOutside · Built in Accra</p>
        </div>
      </footer>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense>
      <DocsPageInner />
    </Suspense>
  );
}
