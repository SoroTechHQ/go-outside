"use client";

import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Avatar from "boring-avatars";
import {
  MapPin,
  PencilSimple,
  GearSix,
  SignOut,
  X,
  CalendarBlank,
  CheckCircle,
  ArrowRight,
  Ticket,
  Users,
  UserCheck,
  Lightning,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useClerk } from "@clerk/nextjs";
import type { AttendeeTicket, EventItem } from "@gooutside/demo-data";
import type { UserProfile } from "./types";
import { getTierInfo } from "./types";
import { ProfileAvatar, SmallAvatar } from "./components/UserAvatar";
import { PulseScoreBanner, PulseBreakdown } from "./components/PulseScoreBanner";
import { ScenePersonalityCard } from "./components/ScenePersonalityCard";
import { BeenThereTab } from "./components/BeenThereTab";
import { SnippetsTab } from "./components/SnippetsTab";
import { TweetsTab } from "./components/TweetsTab";
import { FollowingTab } from "./components/FollowingTab";
import { FriendsTab } from "./components/FriendsTab";
import { EditProfileSheet } from "./components/EditProfileSheet";

/* ── Types ────────────────────────────────────────────────────────────────── */

type TabId = "been-there" | "snippets" | "tweets" | "following" | "friends";

const TABS: { id: TabId; label: string }[] = [
  { id: "been-there", label: "Been There" },
  { id: "snippets",   label: "Snippets" },
  { id: "tweets",     label: "Tweets" },
  { id: "following",  label: "Following" },
  { id: "friends",    label: "Friends" },
];

type Props = {
  profile: UserProfile;
  pastTickets: AttendeeTicket[];
  pastEvents: EventItem[];
};

/* ── Avatar colors for boring-avatars ────────────────────────────────────── */

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

/* ── Slim stats row (IG/TikTok style) ────────────────────────────────────── */

type StatItem = {
  icon: React.ElementType;
  value: number | string;
  label: string;
  onClick?: () => void;
};

function ProfileStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex items-stretch border-y border-[var(--border-subtle)]">
      {stats.map((stat, i, arr) => (
        <Fragment key={stat.label}>
          <button
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className="flex flex-1 flex-col items-center gap-0.5 py-4 transition hover:bg-[var(--bg-card)] active:scale-[0.97] disabled:cursor-default"
          >
            <div className="flex items-center gap-1.5">
              <stat.icon size={13} className="text-[var(--text-tertiary)]" />
              <span className="text-[1.05rem] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                {typeof stat.value === "number"
                  ? stat.value >= 1000
                    ? `${(stat.value / 1000).toFixed(1)}K`
                    : stat.value
                  : stat.value}
              </span>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              {stat.label}
            </span>
          </button>
          {i < arr.length - 1 && (
            <div className="self-center h-7 w-px bg-[var(--border-subtle)]" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ── Followers sheet ─────────────────────────────────────────────────────── */

type MiniFollower = { id: string; name: string; handle: string; tier: string; tierColor: string };

const MOCK_MY_FOLLOWERS: MiniFollower[] = [
  { id: "ama-k",        name: "Ama Koomson",  handle: "@ama.k",         tier: "Scene Kid",   tierColor: "#4a9f63" },
  { id: "yaw-darko",    name: "Yaw Darko",    handle: "@yawdarko",       tier: "City Native", tierColor: "#c87c2a" },
  { id: "esi-m",        name: "Esi Mensah",   handle: "@esi.m_accra",    tier: "Scene Kid",   tierColor: "#4a9f63" },
  { id: "user-kwame",   name: "Kwame Asante", handle: "@kwame.asante",   tier: "Regular",     tierColor: "#4a9f63" },
  { id: "user-abena",   name: "Abena Kyei",   handle: "@abena.k",        tier: "Explorer",    tierColor: "#4a9f63" },
  { id: "user-nii",     name: "Nii Ofori",    handle: "@nii.ofori",      tier: "Scene Kid",   tierColor: "#4a9f63" },
];

function FollowersSheet({
  open,
  onClose,
  count,
  label,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  label: string;
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = MOCK_MY_FOLLOWERS.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.handle.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const inner = (
    <>
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <p className="font-display text-[17px] font-bold italic text-[var(--text-primary)]">
          {label} · {count}
        </p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
        >
          <X size={15} weight="bold" />
        </button>
      </div>
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
          <MagnifyingGlass size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => { onClose(); router.push(`/dashboard/user/${f.id}`); }}
            className="flex w-full items-center gap-3 px-5 py-3 transition hover:bg-[var(--bg-card)] active:scale-[0.99]"
          >
            <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 40, height: 40 }}>
              <Avatar size={40} name={f.name} variant="beam" colors={AVATAR_COLORS} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{f.name}</p>
              <p className="truncate text-[11px] text-[var(--text-tertiary)]">{f.handle}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold"
              style={{
                color: f.tierColor,
                backgroundColor: `${f.tierColor}18`,
                border: `1px solid ${f.tierColor}30`,
              }}
            >
              {f.tier}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-[12px] text-[var(--text-tertiary)]">No results found.</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Mobile: bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {inner}
      </div>
      {/* Desktop: centered modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 hidden w-[500px] max-h-[82vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#4a9f63]/15 bg-[var(--bg-base)] shadow-[0_32px_72px_rgba(0,0,0,0.65)] transition-[opacity,transform] duration-200 md:flex ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.96] pointer-events-none"
        }`}
      >
        {inner}
      </div>
    </>
  );
}

/* ── Overlay (sheet on mobile / modal on desktop) ────────────────────────── */

function Overlay({
  open,
  onClose,
  title,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Mobile: slide-up sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-[#4a9f63]/15 bg-[#0c1a10] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {children}
      </div>
      {/* Desktop: centered modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 hidden -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#4a9f63]/15 bg-[#0c1a10] shadow-[0_32px_72px_rgba(0,0,0,0.65)] transition-[opacity,transform] duration-200 md:flex ${
          wide ? "w-[560px]" : "w-[480px]"
        } max-h-[85vh] ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.96] pointer-events-none"
        }`}
      >
        {children}
      </div>
    </>
  );
}

/* ── Sidebar mini rows ────────────────────────────────────────────────────── */

const SIDEBAR_FRIENDS = [
  { id: "ama-k",      name: "Ama Koomson",  avatarUrl: null, eventsInCommon: 4 },
  { id: "yaw-darko",  name: "Kwame Asante", avatarUrl: null, eventsInCommon: 2 },
  { id: "user-abena", name: "Abena Kyei",   avatarUrl: null, eventsInCommon: 1 },
];

const SIDEBAR_SUGGESTIONS = [
  { id: "user-sug-1", name: "Akua Mensah", avatarUrl: null, mutualCount: 3 },
  { id: "user-sug-2", name: "Koby Appiah", avatarUrl: null, mutualCount: 2 },
];

const SIDEBAR_FOLLOWING = [
  { id: "org-sankofa-sessions", name: "Sankofa Sessions", tag: "Organizer", verified: true,  isOrg: true },
  { id: "org-build-ghana",      name: "Build Ghana",      tag: "Organizer", verified: true,  isOrg: true },
  { id: "esi-m",                name: "Esi Badu",         tag: "Scene Kid", verified: false, isOrg: false },
];

/* ── Main component ───────────────────────────────────────────────────────── */

export function ProfileClient({ profile, pastTickets, pastEvents }: Props) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeTab,      setActiveTab]      = useState<TabId>("been-there");
  const [editOpen,       setEditOpen]       = useState(false);
  const [pulseOpen,      setPulseOpen]      = useState(false);
  const [followersOpen,  setFollowersOpen]  = useState(false);
  const [followingOpen,  setFollowingOpen]  = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  const tierInfo = getTierInfo(currentProfile.pulseTier);

  function handleSaveProfile(updates: Partial<UserProfile>) {
    setCurrentProfile((prev) => ({ ...prev, ...updates }));
  }

  function goToTab(id: TabId) {
    setActiveTab(id);
    document.getElementById("profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const profileStats: StatItem[] = [
    { icon: Ticket,    value: currentProfile.eventsAttended, label: "Events",    onClick: () => goToTab("been-there") },
    { icon: Users,     value: currentProfile.friendCount,    label: "Followers", onClick: () => setFollowersOpen(true) },
    { icon: UserCheck, value: currentProfile.followingCount, label: "Following", onClick: () => setFollowingOpen(true) },
    { icon: Lightning, value: currentProfile.pulseScore,     label: "XP",        onClick: () => setPulseOpen(true) },
  ];

  return (
    <>
      {/* ── Cover ────────────────────────────────────────────────────────────── */}
      <div className="relative h-[180px] w-full overflow-hidden md:h-[220px]">
        {currentProfile.coverUrl ? (
          <Image src={currentProfile.coverUrl} alt="Cover" fill className="object-cover object-center" priority />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]"
            style={{
              backgroundImage: [
                "linear-gradient(135deg,#0e2212 0%,#152a1a 50%,#0b1a10 100%)",
              ].join(","),
            }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.4),transparent_65%)]" />
        {!currentProfile.coverUrl && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle,rgba(74,159,99,0.9) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        )}

        {/* Edit cover button */}
        {currentProfile.isOwnProfile && (
          <button
            onClick={() => setEditOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 backdrop-blur-sm transition hover:bg-black/55 hover:text-white active:scale-[0.97]"
          >
            <PencilSimple size={12} />
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_288px] md:gap-6 md:px-6 lg:grid-cols-[1fr_304px] lg:gap-8 lg:px-8">

        {/* ════ MAIN COLUMN ═══════════════════════════════════════════════════ */}
        <div className="min-w-0">

          {/* Avatar row — overlaps cover */}
          <div className="relative z-10 -mt-11 flex items-end justify-between pb-4 md:-mt-14">
            <ProfileAvatar
              name={currentProfile.name}
              avatarUrl={currentProfile.avatarUrl}
              ringClass={tierInfo.ringClass}
              borderClass="border-[3px] border-[var(--bg-base)]"
            />
            {/* Mobile edit + settings + sign out buttons */}
            {currentProfile.isOwnProfile && (
              <div className="mb-1 flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97]"
                >
                  <PencilSimple size={13} />
                  Edit
                </button>
                <button
                  onClick={() => router.push("/dashboard/settings")}
                  className="flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97]"
                  aria-label="Settings"
                >
                  <GearSix size={14} />
                </button>
                <button
                  onClick={() => signOut(() => router.push("/"))}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-400 shadow-sm transition hover:bg-red-500/20 active:scale-[0.97]"
                >
                  <SignOut size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)] md:text-[26px]">
                  {currentProfile.name}
                </h1>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                  @{currentProfile.handle}
                </p>
              </div>
              {/* Desktop edit + settings + sign out buttons */}
              {currentProfile.isOwnProfile && (
                <div className="hidden items-center gap-2 md:flex">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97]"
                  >
                    <PencilSimple size={13} />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/settings")}
                    className="flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97]"
                    aria-label="Settings"
                  >
                    <GearSix size={14} />
                  </button>
                  <button
                    onClick={() => signOut(() => router.push("/"))}
                    className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-400 shadow-sm transition hover:bg-red-500/20 active:scale-[0.97]"
                  >
                    <SignOut size={13} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {currentProfile.bio && (
              <p className="mt-3 max-w-[480px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {currentProfile.bio}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {currentProfile.location && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <MapPin size={11} />
                  {currentProfile.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                <CalendarBlank size={11} />
                Joined {currentProfile.joinedAt}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentProfile.topCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-medium text-[#4a9f63]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* ── Slim stats row ──────────────────────────────────────────────── */}
          <ProfileStats stats={profileStats} />

          {/* Pulse banner + Scene card */}
          <div className="space-y-3 py-4">
            <PulseScoreBanner
              score={currentProfile.pulseScore}
              tier={currentProfile.pulseTier}
              neighbourhoodRank={currentProfile.neighbourhoodRank}
              cityRankPercent={currentProfile.cityRankPercent}
              onTap={() => setPulseOpen(true)}
            />
            {pastTickets.length >= 2 && <ScenePersonalityCard />}
          </div>

          {/* ── Sticky tab bar ──────────────────────────────────────────────── */}
          <div id="profile-tabs" className="sticky top-0 z-20 -mx-4 bg-[var(--bg-base)] pt-1 md:mx-0">
            <div className="no-scrollbar flex overflow-x-auto border-b border-[var(--border-subtle)] px-4 md:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    activeTab === tab.id
                      ? "text-[#4a9f63]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#4a9f63]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ─────────────────────────────────────────────────── */}
          <div className="pb-12 pt-4">
            {activeTab === "been-there" && <BeenThereTab tickets={pastTickets} events={pastEvents} />}
            {activeTab === "snippets"   && <SnippetsTab />}
            {activeTab === "tweets"     && <TweetsTab tweetIds={currentProfile.importedTweetIds} />}
            {activeTab === "following"  && <FollowingTab />}
            {activeTab === "friends"    && <FriendsTab />}
          </div>
        </div>

        {/* ════ SIDEBAR (desktop only) ════════════════════════════════════════ */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">

            {/* Stats */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Activity</p>
              <div className="space-y-2">
                {profileStats.map((stat) => (
                  <button
                    key={stat.label}
                    onClick={stat.onClick}
                    disabled={!stat.onClick}
                    className="flex w-full items-center justify-between rounded-[10px] px-2 py-1.5 transition hover:bg-[var(--bg-surface)] active:scale-[0.98] disabled:cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <stat.icon size={13} className="text-[var(--text-tertiary)]" />
                      <span className="text-[12px] text-[var(--text-secondary)]">{stat.label}</span>
                    </div>
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">
                      {typeof stat.value === "number"
                        ? stat.value >= 1000
                          ? `${(stat.value / 1000).toFixed(1)}K`
                          : stat.value
                        : stat.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Friends preview */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Friends</p>
                <button
                  onClick={() => goToTab("friends")}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-[#4a9f63] hover:underline"
                >
                  See all <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-2.5">
                {SIDEBAR_FRIENDS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => router.push(`/dashboard/user/${f.id}`)}
                    className="flex w-full items-center gap-2.5 transition hover:opacity-80"
                  >
                    <SmallAvatar name={f.name} avatarUrl={f.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{f.eventsInCommon} events in common</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* People you might know */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">People you might know</p>
              <div className="space-y-3">
                {SIDEBAR_SUGGESTIONS.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <SmallAvatar name={s.name} avatarUrl={s.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{s.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{s.mutualCount} mutual friends</p>
                    </div>
                    <button className="shrink-0 rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-2.5 py-1 text-[9px] font-bold text-[#4a9f63] transition hover:bg-[#4a9f63]/20 active:scale-[0.95]">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Following preview */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Following</p>
                <button
                  onClick={() => goToTab("following")}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-[#4a9f63] hover:underline"
                >
                  See all <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-2.5">
                {SIDEBAR_FOLLOWING.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => router.push(f.isOrg ? `/organizers/${f.id}` : `/dashboard/user/${f.id}`)}
                    className="flex w-full items-center gap-2.5 transition hover:opacity-80"
                  >
                    <SmallAvatar name={f.name} avatarUrl={null} size={32} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        {f.tag}
                        {f.verified && <CheckCircle size={10} weight="fill" className="text-[#4a9f63]" />}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* ── Pulse breakdown overlay ───────────────────────────────────────────── */}
      <Overlay open={pulseOpen} onClose={() => setPulseOpen(false)} title="Pulse Breakdown">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="font-display text-[17px] font-bold italic text-white">Pulse Breakdown</p>
          <button
            onClick={() => setPulseOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white active:scale-[0.95]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8 pt-4">
          <PulseBreakdown score={currentProfile.pulseScore} />
        </div>
      </Overlay>

      {/* ── Edit profile overlay ─────────────────────────────────────────────── */}
      <Overlay open={editOpen} onClose={() => setEditOpen(false)} wide>
        <EditProfileSheet
          profile={currentProfile}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
        />
      </Overlay>

      {/* ── Followers sheet ───────────────────────────────────────────────────── */}
      <FollowersSheet
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        count={currentProfile.friendCount}
        label="Followers"
      />

      {/* ── Following sheet ───────────────────────────────────────────────────── */}
      <FollowersSheet
        open={followingOpen}
        onClose={() => setFollowingOpen(false)}
        count={currentProfile.followingCount}
        label="Following"
      />
    </>
  );
}
