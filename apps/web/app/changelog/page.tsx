"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CalendarDots,
  GithubLogo,
  CaretDown,
  ArrowUpRight,
  Sparkle,
  Wrench,
  Shield,
  Star,
  ChatCircleDots,
  Bell,
  MagnifyingGlass,
  UserCircle,
  Ticket,
  Robot,
  Trophy,
  MapPin,
  Gear,
  Camera,
} from "@phosphor-icons/react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

type Tag = "new" | "improved" | "fix" | "security";

interface Entry {
  title: string;
  plain: string;          // plain-English description for non-technical clients
  detail?: string;        // optional mini-tutorial / expected output
  tag: Tag;
  icon?: React.ElementType;
  commits?: string[];     // short commit hashes for GitHub links
}

interface DateGroup {
  date: string;           // display date
  iso: string;            // for sort
  headline: string;       // one-liner summary of the day
  entries: Entry[];
}

const REPO = "https://github.com/SoroTechHQ/go-outside";

const CHANGELOG: DateGroup[] = [
  {
    date: "May 4, 2026",
    iso: "2026-05-04",
    headline: "Messaging upgrades, push notifications, and admin tools",
    entries: [
      {
        title: "Message Requests — Accept or Decline",
        plain:
          "When someone you don't follow tries to message you, their message now lands in a separate 'Requests' inbox. You can read it and decide whether to accept or decline the conversation. Accepted chats move to your main inbox.",
        detail:
          "Open the Messages tab → tap 'Requests' at the top → tap a message to preview it → hit Accept to start chatting or Decline to remove it.",
        tag: "new",
        icon: ChatCircleDots,
        commits: ["7a027c9", "9f044fc"],
      },
      {
        title: "Push Notifications for New Messages",
        plain:
          "The app can now send you a push notification on your phone or browser when you receive a new message, even if the app isn't open.",
        detail:
          "The first time you visit Messages you'll be asked if you'd like to turn on notifications. Tap Allow and you're set.",
        tag: "new",
        icon: Bell,
        commits: ["8b798c6", "75c6be8"],
      },
      {
        title: "Trending Topics — Full Detail Pages",
        plain:
          "Trending hashtags and topics now have their own dedicated pages showing all related posts, images, and events in one place.",
        detail:
          "Tap any trending tag from the Trending tab to see the full picture — posts, photos, and upcoming events all under that topic.",
        tag: "new",
        icon: Star,
        commits: ["b62cd9d", "b478e45"],
      },
      {
        title: "Messages — Unread Count Badges",
        plain:
          "A badge now appears on your Messages icon showing exactly how many unread conversations you have, so you never miss a chat.",
        tag: "improved",
        icon: ChatCircleDots,
        commits: ["6d6e02b"],
      },
      {
        title: "Organiser Profile Links Fixed",
        plain:
          "Clicking an organiser's name anywhere in the app now reliably takes you to their correct profile page.",
        tag: "fix",
        icon: UserCircle,
        commits: ["6fe626a"],
      },
      {
        title: "Admin Platform Tools",
        plain:
          "Behind the scenes, a full admin control panel was added. The platform team can now review content, manage organisers, run promotions, track revenue, and handle tickets — all from one dashboard.",
        tag: "new",
        commits: ["bbf84e4"],
      },
      {
        title: "Build Stability Fix",
        plain:
          "A deployment issue was resolved that was preventing the latest version from going live on the server.",
        tag: "fix",
        commits: ["488c7c3"],
      },
      {
        title: "Scheduled Post Publishing — 9 AM Daily",
        plain:
          "Posts you schedule as an organiser will now automatically publish at 9 AM each day, right when your audience is most active.",
        tag: "improved",
        commits: ["140e0a2"],
      },
    ],
  },
  {
    date: "May 3, 2026",
    iso: "2026-05-03",
    headline: "Host your first event, manage your settings, and smarter sign-in",
    entries: [
      {
        title: "Host an Event — Full Creation Wizard",
        plain:
          "Organisers can now create a live event from start to finish using a guided multi-step form. Add the event name, description, date, location, ticket types and prices, cover photo, and privacy settings — all in one smooth flow.",
        detail:
          "Head to the Organiser Dashboard → tap 'Create Event' → follow the steps: Details → Tickets → Creative → Publish. Your event goes live once you hit Publish.",
        tag: "new",
        icon: Ticket,
        commits: ["081b129", "8204fda"],
      },
      {
        title: "Edit & Delete Events",
        plain:
          "Already published an event? You can now edit the details or remove it entirely from your organiser dashboard.",
        tag: "new",
        commits: ["12f4968"],
      },
      {
        title: "Schedule Posts with a Date Picker",
        plain:
          "When composing a post as an organiser, you can now pick a specific date and time to publish it. No more posting manually — set it and forget it.",
        tag: "new",
        commits: ["55084aa"],
      },
      {
        title: "Account Settings Page",
        plain:
          "A proper Settings page is now live. You can update your display name, bio, location, profile photo, notification preferences, and privacy options all from one place.",
        detail:
          "Dashboard → tap your avatar → Settings. Changes save automatically.",
        tag: "new",
        icon: Gear,
        commits: ["ea756ed", "de7a088"],
      },
      {
        title: "Better Sign-In Error Messages",
        plain:
          "If you type the wrong password or email during sign-in, you'll now see a clear, friendly message explaining exactly what went wrong — no more confusing technical errors.",
        tag: "improved",
        commits: ["4979b41"],
      },
      {
        title: "Account Recovery",
        plain:
          "If your account ran into a conflict during setup (e.g. you signed up twice with the same email), the app can now automatically recover and connect you to your existing profile.",
        tag: "fix",
        commits: ["113657d"],
      },
    ],
  },
  {
    date: "May 2, 2026",
    iso: "2026-05-02",
    headline: "Event creation wizard — date, location, tickets, and media",
    entries: [
      {
        title: "Event Creation Steps Built Out",
        plain:
          "The multi-step wizard for creating events expanded to include picking the event date and time, adding a venue or location, setting up ticket tiers, uploading cover photos and banners, and choosing publishing options.",
        detail:
          "Each step saves your progress so you can come back and finish later without losing anything.",
        tag: "new",
        icon: Camera,
        commits: ["8204fda"],
      },
    ],
  },
  {
    date: "May 1, 2026",
    iso: "2026-05-01",
    headline: "Organiser profiles, smarter search, and AI-assisted discovery",
    entries: [
      {
        title: "Organiser Profile Pages",
        plain:
          "Each organiser now has a public profile page showing their upcoming events, past events, follower count, and a brief bio. Anyone can visit and follow an organiser directly from their page.",
        detail:
          "Find an event you like → tap the organiser's name → view their full profile and follow them to get notified of future events.",
        tag: "new",
        icon: UserCircle,
        commits: ["808b264"],
      },
      {
        title: "Smarter Search",
        plain:
          "Search is now faster and more accurate. As you type, results update instantly and the app remembers your recent searches to help you find things quicker.",
        tag: "improved",
        icon: MagnifyingGlass,
        commits: ["9782578", "c6bfbc6", "58aa96d"],
      },
      {
        title: "AI Discovery Banner",
        plain:
          "A banner now appears in the app inviting you to try the AI assistant for personalised event recommendations. It appears at the right moment — not constantly — so it doesn't get in the way.",
        tag: "new",
        icon: Robot,
        commits: ["afbab6c"],
      },
      {
        title: "Location Validation",
        plain:
          "When you enter a city or location in the app, it now validates the input so only real, recognised Ghana locations are accepted.",
        tag: "improved",
        icon: MapPin,
        commits: ["ef74e91"],
      },
    ],
  },
  {
    date: "April 24, 2026",
    iso: "2026-04-24",
    headline: "AI Chat for event discovery launched",
    entries: [
      {
        title: "AI Event Discovery Chat",
        plain:
          "You can now have a real conversation with an AI assistant inside the app to find events that match what you're in the mood for. Just describe what you want — 'something chill this weekend in Accra' — and it will suggest tailored events.",
        detail:
          "Go to Search → tap the AI Chat icon → type your request in plain language. The assistant understands context, follow-up questions, and can narrow things down based on your preferences.",
        tag: "new",
        icon: Robot,
        commits: ["474fb3c"],
      },
    ],
  },
  {
    date: "April 23, 2026",
    iso: "2026-04-23",
    headline: "Brand polish and security updates",
    entries: [
      {
        title: "Updated App Logo on Sign-In",
        plain:
          "The GoOutside logo shown on the sign-in and sign-up screens was refreshed to the latest brand version.",
        tag: "improved",
        commits: ["d418ecc"],
      },
      {
        title: "Security Policy Updates",
        plain:
          "The app's security settings were tightened to block any scripts or content that don't come from trusted sources. This protects your data and keeps the app safe.",
        tag: "security",
        icon: Shield,
        commits: ["eed630f", "fd95986"],
      },
    ],
  },
  {
    date: "April 22, 2026",
    iso: "2026-04-22",
    headline: "Smarter AI matching and sponsor features",
    entries: [
      {
        title: "Better AI Event Matching",
        plain:
          "The AI that recommends events to you was improved. It now does a better job of understanding what you like and surfacing events that genuinely match your interests and past activity.",
        tag: "improved",
        icon: Robot,
        commits: ["9339699"],
      },
      {
        title: "Sponsor Spotlight",
        plain:
          "GoOutside's first spotlight sponsor (supercar partner) is now featured in the app, showcasing brand partnerships in the event discovery feed.",
        tag: "new",
        commits: ["fecaf04"],
      },
      {
        title: "Performance Improvements",
        plain:
          "Several parts of the app were refactored under the hood to load faster and feel smoother during scrolling and navigation.",
        tag: "improved",
        commits: ["350766a", "953a65f"],
      },
    ],
  },
  {
    date: "April 21, 2026",
    iso: "2026-04-21",
    headline: "Pulse Rewards, notifications, posts, and personalised feed",
    entries: [
      {
        title: "Pulse Rewards Dashboard",
        plain:
          "The Rewards section is now fully live. You can view your Pulse Points balance, see what rewards are available to redeem, browse your points history, and check your badges — all from one dashboard.",
        detail:
          "Dashboard → Rewards. Points are earned automatically when you attend events, save events, or complete other actions in the app.",
        tag: "new",
        icon: Trophy,
        commits: ["9aad2d7", "bc5690b"],
      },
      {
        title: "Pulse Score History",
        plain:
          "You can now see a full timeline of how your Pulse Score has changed over time — every event attended, post made, and connection formed that contributed to your score.",
        tag: "new",
        icon: Trophy,
        commits: ["707b9dc"],
      },
      {
        title: "Notifications — Real Data",
        plain:
          "The Notifications tab is now connected to the real database. You'll see actual alerts for follows, likes, and activity — not placeholder content.",
        detail:
          "Dashboard → tap the bell icon. Tap any notification to jump directly to the related event, post, or profile.",
        tag: "new",
        icon: Bell,
        commits: ["96d8d72", "32e90a5"],
      },
      {
        title: "Like Posts",
        plain:
          "You can now like and unlike posts from other users. Tap the heart on any post — it updates instantly and the author gets notified.",
        tag: "new",
        commits: ["4d3de5a"],
      },
      {
        title: "Personalised Feed Sections",
        plain:
          "Your home feed is now split into named sections — 'Because You Saved', 'Trending Near You', 'Friends Are Going', and more — each curated specifically for you based on your behaviour in the app.",
        tag: "new",
        commits: ["7ff8fd0"],
      },
      {
        title: "User Discovery",
        plain:
          "A new 'People You May Know' feature was added, suggesting other users you might want to follow based on shared interests and mutual connections.",
        tag: "new",
        icon: UserCircle,
        commits: ["7d530f2"],
      },
      {
        title: "Follow Status in Real-Time",
        plain:
          "Follow buttons across the app now reflect the correct state instantly — whether you follow someone or not is always accurate and updates the moment you tap.",
        tag: "improved",
        commits: ["32e90a5"],
      },
      {
        title: "Security Hardening",
        plain:
          "Multiple layers of security were added to the app and its API to protect user data and prevent unauthorised access.",
        tag: "security",
        icon: Shield,
        commits: ["e3ad0a7"],
      },
      {
        title: "Cover Photo & Logo Uploads",
        plain:
          "Organisers can now upload event cover photos and organisation logos directly from the dashboard. Images are stored securely and load fast.",
        tag: "new",
        icon: Camera,
        commits: ["a40ae85"],
      },
    ],
  },
  {
    date: "April 20, 2026",
    iso: "2026-04-20",
    headline: "Ticket purchase flow on event pages",
    entries: [
      {
        title: "Buy Tickets from Event Pages",
        plain:
          "You can now tap 'Get Tickets' directly from any event detail page. A panel slides up showing available ticket types, quantities, and prices. Select your tickets and proceed to checkout.",
        detail:
          "Tap any event → scroll to the ticket section → tap 'Get Tickets' → choose your quantity → tap Checkout.",
        tag: "new",
        icon: Ticket,
        commits: ["5944fcd"],
      },
    ],
  },
  {
    date: "April 19, 2026",
    iso: "2026-04-19",
    headline: "Real-time messaging, Ghana seed data, and follow system",
    entries: [
      {
        title: "Real-Time Messaging (Stream Chat)",
        plain:
          "Direct messaging between users is now live. You can start a conversation with anyone on the platform, send messages, and see when they've read them — all in real time.",
        detail:
          "Dashboard → Messages → tap the compose button → search for a user → start chatting. Messages are delivered instantly.",
        tag: "new",
        icon: ChatCircleDots,
        commits: ["ad42475", "bd271fe", "433a139"],
      },
      {
        title: "Follow & Unfollow Users",
        plain:
          "You can now follow other users on GoOutside. Following someone means their activity shows up in your feed and you'll be notified when they RSVP to events you might like.",
        detail:
          "Visit any user's profile → tap Follow. To stop following, tap the same button again.",
        tag: "new",
        icon: UserCircle,
        commits: ["5a1790e"],
      },
      {
        title: "Real Ghana Event & User Data",
        plain:
          "The app is now running on real Ghana event data — 30 authentic events across Accra, Kumasi, Tamale, and beyond, with 120 real-feeling user profiles. No more placeholder content.",
        tag: "new",
        commits: ["7b65900"],
      },
      {
        title: "Error Handling Improvements",
        plain:
          "Behind the scenes, the app now gracefully handles situations where a database call fails or data is missing, instead of crashing or showing blank screens.",
        tag: "fix",
        commits: ["097c486"],
      },
      {
        title: "Responsive Home Layout",
        plain:
          "The home screen now adapts better to different screen sizes. On larger screens a sidebar appears; on phones the layout tightens up so you see more events without scrolling.",
        tag: "improved",
        commits: ["e7031b3"],
      },
      {
        title: "Dark Mode Detection",
        plain:
          "The app now correctly reads your device's dark/light mode setting on first load, so you always start in the right theme.",
        tag: "fix",
        commits: ["8fe5987"],
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   TAG PILL
───────────────────────────────────────────── */

const TAG_CONFIG: Record<Tag, { label: string; className: string }> = {
  new:      { label: "New",      className: "bg-[rgba(47,143,69,0.12)] text-[#2f8f45] border border-[rgba(47,143,69,0.22)]" },
  improved: { label: "Improved", className: "bg-[rgba(74,122,232,0.10)] text-[#4a7ae8] border border-[rgba(74,122,232,0.20)]" },
  fix:      { label: "Fix",      className: "bg-[rgba(232,93,138,0.10)] text-[#e85d8a] border border-[rgba(232,93,138,0.20)]" },
  security: { label: "Security", className: "bg-[rgba(255,170,0,0.10)] text-[#b97d00] border border-[rgba(255,170,0,0.20)]" },
};

function TagPill({ tag }: { tag: Tag }) {
  const { label, className } = TAG_CONFIG[tag];
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   ENTRY CARD
───────────────────────────────────────────── */

function EntryCard({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState(false);
  const Icon = entry.icon;

  return (
    <div className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[rgba(47,143,69,0.25)] transition-all duration-200 overflow-hidden">
      {/* accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2f8f45] to-[rgba(47,143,69,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        {/* icon */}
        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center">
          {Icon ? (
            <Icon size={16} weight="duotone" className="text-[#2f8f45]" />
          ) : (
            <Sparkle size={16} weight="duotone" className="text-[#2f8f45]" />
          )}
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-[var(--text-primary)] text-sm leading-snug">{entry.title}</span>
            <TagPill tag={entry.tag} />
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-2">{entry.plain}</p>
        </div>

        {/* caret */}
        {(entry.detail || (entry.commits && entry.commits.length > 0)) && (
          <CaretDown
            size={14}
            weight="bold"
            className={`shrink-0 mt-1.5 text-[var(--text-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* expanded panel */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-[var(--border-subtle)]">
          {entry.detail && (
            <div className="mt-4 rounded-lg bg-[var(--bg-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">How to use it</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{entry.detail}</p>
            </div>
          )}

          {entry.commits && entry.commits.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {entry.commits.map((hash) => (
                <a
                  key={hash}
                  href={`${REPO}/commit/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[#2f8f45] bg-[var(--bg-surface)] hover:bg-[var(--brand-dim)] border border-[var(--border-subtle)] hover:border-[rgba(47,143,69,0.25)] rounded-md px-2.5 py-1 transition-all duration-150"
                >
                  <GithubLogo size={11} weight="fill" />
                  {hash.slice(0, 7)}
                  <ArrowUpRight size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATE SECTION
───────────────────────────────────────────── */

function DateSection({ group, defaultOpen }: { group: DateGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const counts = group.entries.reduce(
    (acc, e) => { acc[e.tag] = (acc[e.tag] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="relative">
      {/* timeline dot */}
      <div className="absolute -left-[27px] top-[22px] w-3 h-3 rounded-full border-2 border-[#2f8f45] bg-[var(--bg-page)] z-10" />

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
        {/* date header */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-[var(--bg-surface)] transition-colors"
        >
          <div className="shrink-0 mt-0.5 w-10 h-10 rounded-xl bg-[var(--brand-dim)] flex items-center justify-center">
            <CalendarDots size={18} weight="duotone" className="text-[#2f8f45]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="font-bold text-base text-[var(--text-primary)]">{group.date}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {counts.new      ? <span className="text-[10px] font-semibold bg-[rgba(47,143,69,0.10)] text-[#2f8f45] rounded-full px-2 py-0.5">{counts.new} new</span> : null}
                {counts.improved ? <span className="text-[10px] font-semibold bg-[rgba(74,122,232,0.10)] text-[#4a7ae8] rounded-full px-2 py-0.5">{counts.improved} improved</span> : null}
                {counts.fix      ? <span className="text-[10px] font-semibold bg-[rgba(232,93,138,0.10)] text-[#e85d8a] rounded-full px-2 py-0.5">{counts.fix} fix</span> : null}
                {counts.security ? <span className="text-[10px] font-semibold bg-[rgba(255,170,0,0.10)] text-[#b97d00] rounded-full px-2 py-0.5">{counts.security} security</span> : null}
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{group.headline}</p>
          </div>

          <CaretDown
            size={16}
            weight="bold"
            className={`shrink-0 mt-1 text-[var(--text-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* entries */}
        {open && (
          <div className="px-6 pb-6 space-y-3 border-t border-[var(--border-subtle)]">
            <div className="pt-4 space-y-3">
              {group.entries.map((entry, i) => (
                <EntryCard key={i} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────── */

function StatsBar() {
  const all = CHANGELOG.flatMap((g) => g.entries);
  const total    = all.length;
  const newCount = all.filter((e) => e.tag === "new").length;
  const fixCount = all.filter((e) => e.tag === "fix").length;
  const impCount = all.filter((e) => e.tag === "improved").length;
  const secCount = all.filter((e) => e.tag === "security").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
      {[
        { label: "Total updates",    value: total,    color: "text-[var(--text-primary)]",  bg: "bg-[var(--bg-card)]" },
        { label: "New features",     value: newCount, color: "text-[#2f8f45]",               bg: "bg-[rgba(47,143,69,0.06)]" },
        { label: "Improvements",     value: impCount, color: "text-[#4a7ae8]",               bg: "bg-[rgba(74,122,232,0.06)]" },
        { label: "Fixes & Security", value: fixCount + secCount, color: "text-[#e85d8a]",   bg: "bg-[rgba(232,93,138,0.06)]" },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`rounded-xl ${bg} border border-[var(--border-subtle)] px-5 py-4`}>
          <div className={`text-3xl font-black ${color} tabular-nums`}>{value}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-0.5 font-medium">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function ChangelogPage() {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* ── Background grid pattern ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Top accent bar ── */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-[#2f8f45] via-[#4caf65] to-[#2f8f45]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-24">

        {/* ── Header ── */}
        <header className="pt-14 pb-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo-full.png"
              alt="GoOutside"
              width={160}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#2f8f45] bg-[rgba(47,143,69,0.08)] border border-[rgba(47,143,69,0.18)] rounded-full px-4 py-1.5 mb-5">
            <Sparkle size={12} weight="fill" />
            Product Changelog
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-tight mb-4">
            What&apos;s been built
          </h1>
          <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            A running record of every feature, improvement, and fix shipped to GoOutside — written in plain language, no technical jargon required.
          </p>

          {/* GitHub link */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-card)] rounded-full px-4 py-2 bg-[var(--bg-card)] transition-all duration-150"
            >
              <GithubLogo size={16} weight="fill" />
              View source on GitHub
              <ArrowUpRight size={12} />
            </a>
          </div>
        </header>

        {/* ── Stats ── */}
        <StatsBar />

        {/* ── Controls ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            {CHANGELOG.length} release dates
          </p>
          <button
            onClick={() => setExpandAll((v) => !v)}
            className="text-xs font-semibold text-[#2f8f45] hover:underline"
          >
            {expandAll ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {/* ── Timeline ── */}
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-[#2f8f45] via-[rgba(47,143,69,0.3)] to-transparent" />

          <div className="pl-10 space-y-5">
            {CHANGELOG.map((group, i) => (
              <DateSection key={group.iso} group={group} defaultOpen={i === 0 || expandAll} />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 pt-8 border-t border-[var(--border-subtle)] text-center">
          <div className="flex items-center justify-center mb-3">
            <Image src="/logo-mini.png" alt="GoOutside" width={28} height={28} className="h-7 w-auto opacity-60" />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            GoOutside — Social-first event discovery for Ghana.
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Built by{" "}
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="hover:text-[#2f8f45] transition-colors">
              Soro Technologies
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
