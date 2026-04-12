"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  PencilSimple,
  X,
  CalendarBlank,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
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

/* ── Responsive overlay (sheet on mobile, modal on desktop) ──────────────── */

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
      {/* Backdrop */}
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

/* ── Sidebar stat chip ────────────────────────────────────────────────────── */

function SidebarStat({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-surface)] py-3 transition hover:border-[#4a9f63]/30 hover:bg-[var(--bg-card-hover)] active:scale-[0.96]"
    >
      <span className="font-display text-xl font-bold italic text-[var(--text-primary)]">
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {label}
      </span>
    </button>
  );
}

/* ── Sidebar mini friend row ─────────────────────────────────────────────── */

const SIDEBAR_FRIENDS = [
  { id: "f1", name: "Ama Darko",    avatarUrl: null, eventsInCommon: 4 },
  { id: "f2", name: "Kwame Asante", avatarUrl: null, eventsInCommon: 2 },
  { id: "f3", name: "Abena Kyei",   avatarUrl: null, eventsInCommon: 1 },
];

const SIDEBAR_SUGGESTIONS = [
  { id: "s1", name: "Akua Mensah", avatarUrl: null, mutualCount: 3 },
  { id: "s2", name: "Koby Appiah", avatarUrl: null, mutualCount: 2 },
];

const SIDEBAR_FOLLOWING = [
  { id: "o1", name: "Sankofa Sessions",    tag: "Organizer", avatarUrl: null, verified: true },
  { id: "o2", name: "Build Ghana",          tag: "Organizer", avatarUrl: null, verified: true },
  { id: "o3", name: "Esi Badu",            tag: "Scene Kid",  avatarUrl: null, verified: false },
];

/* ── Main component ───────────────────────────────────────────────────────── */

export function ProfileClient({ profile, pastTickets, pastEvents }: Props) {
  const [activeTab,       setActiveTab]       = useState<TabId>("been-there");
  const [editOpen,        setEditOpen]        = useState(false);
  const [pulseOpen,       setPulseOpen]       = useState(false);
  const [currentProfile,  setCurrentProfile]  = useState(profile);

  const tierInfo = getTierInfo(currentProfile.pulseTier);

  function handleSaveProfile(updates: Partial<UserProfile>) {
    setCurrentProfile((prev) => ({ ...prev, ...updates }));
  }

  function goToTab(id: TabId) {
    setActiveTab(id);
    // Scroll to tabs on mobile
    document.getElementById("profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ── Cover — full width ─────────────────────────────────────────────── */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] md:h-52">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.4),transparent_65%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(74,159,99,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Cover actions */}
        {currentProfile.isOwnProfile && (
          <button
            onClick={() => setEditOpen(true)}
            className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white active:scale-[0.97]"
          >
            <PencilSimple size={12} />
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Two-column grid ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_288px] md:gap-6 md:px-6 lg:grid-cols-[1fr_304px] lg:gap-8 lg:px-8">

        {/* ════ LEFT / MAIN COLUMN ════════════════════════════════════════ */}
        <div className="min-w-0">

          {/* Avatar row — overlaps cover */}
          <div className="-mt-11 flex items-end justify-between pb-4 md:-mt-14">
            <ProfileAvatar
              name={currentProfile.name}
              avatarUrl={currentProfile.avatarUrl}
              ringClass={tierInfo.ringClass}
              borderClass="border-[3px] border-[var(--bg-base)]"
            />
            {/* Mobile edit button */}
            {currentProfile.isOwnProfile && (
              <button
                onClick={() => setEditOpen(true)}
                className="mb-1 flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97] md:hidden"
              >
                <PencilSimple size={13} />
                Edit
              </button>
            )}
          </div>

          {/* Name, handle, bio, meta, tags */}
          <div className="pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)] md:text-[26px]">
                  {currentProfile.name}
                </h1>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                  @{currentProfile.handle}
                </p>
              </div>
              {/* Desktop edit button */}
              {currentProfile.isOwnProfile && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="hidden items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/50 hover:text-[#4a9f63] active:scale-[0.97] md:flex"
                >
                  <PencilSimple size={13} />
                  Edit Profile
                </button>
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

            <div className="mt-3 flex flex-wrap gap-2">
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

          {/* Mobile-only: stats row */}
          <div className="mb-3 grid grid-cols-4 gap-2 md:hidden">
            {[
              { label: "events",    value: currentProfile.eventsAttended, tab: "been-there" as TabId },
              { label: "friends",   value: currentProfile.friendCount,    tab: "friends"    as TabId },
              { label: "following", value: currentProfile.followingCount,  tab: "following"  as TabId },
              { label: "snippets",  value: currentProfile.snippetCount,    tab: "snippets"   as TabId },
            ].map(({ label, value, tab }) => (
              <button
                key={label}
                onClick={() => goToTab(tab)}
                className="flex flex-col items-center rounded-[16px] border border-[var(--border-card)] bg-[var(--bg-card)] py-3 text-center shadow-[var(--card-shadow)] transition hover:border-[#4a9f63]/30 active:scale-[0.96]"
              >
                <span className="font-display text-lg font-bold italic text-[var(--text-primary)]">{value}</span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</span>
              </button>
            ))}
          </div>

          {/* Pulse banner + Scene card */}
          <div className="space-y-3">
            <PulseScoreBanner
              score={currentProfile.pulseScore}
              tier={currentProfile.pulseTier}
              neighbourhoodRank={currentProfile.neighbourhoodRank}
              cityRankPercent={currentProfile.cityRankPercent}
              onTap={() => setPulseOpen(true)}
            />
            {pastTickets.length >= 2 && <ScenePersonalityCard />}
          </div>

          {/* ── Sticky tab bar ──────────────────────────────────────────── */}
          <div id="profile-tabs" className="sticky top-0 z-20 -mx-4 bg-[var(--bg-base)] pt-3 md:mx-0">
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

          {/* ── Tab content ─────────────────────────────────────────────── */}
          <div className="pb-12 pt-4">
            {activeTab === "been-there" && <BeenThereTab tickets={pastTickets} events={pastEvents} />}
            {activeTab === "snippets"   && <SnippetsTab />}
            {activeTab === "tweets"     && <TweetsTab tweetIds={currentProfile.importedTweetIds} />}
            {activeTab === "following"  && <FollowingTab />}
            {activeTab === "friends"    && <FriendsTab />}
          </div>
        </div>

        {/* ════ RIGHT / SIDEBAR COLUMN (desktop only) ═════════════════════ */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">

            {/* Stats 2×2 */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Activity
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SidebarStat value={currentProfile.eventsAttended} label="events"    onClick={() => goToTab("been-there")} />
                <SidebarStat value={currentProfile.friendCount}    label="friends"   onClick={() => goToTab("friends")} />
                <SidebarStat value={currentProfile.followingCount} label="following" onClick={() => goToTab("following")} />
                <SidebarStat value={currentProfile.snippetCount}   label="snippets"  onClick={() => goToTab("snippets")} />
              </div>
            </div>

            {/* Friends preview */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Friends
                </p>
                <button
                  onClick={() => goToTab("friends")}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-[#4a9f63] hover:underline"
                >
                  See all <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-2.5">
                {SIDEBAR_FRIENDS.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <SmallAvatar name={f.name} avatarUrl={f.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {f.eventsInCommon} events in common
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* People you might know */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                People you might know
              </p>
              <div className="space-y-3">
                {SIDEBAR_SUGGESTIONS.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <SmallAvatar name={s.name} avatarUrl={s.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{s.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {s.mutualCount} mutual friends
                      </p>
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
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Following
                </p>
                <button
                  onClick={() => goToTab("following")}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-[#4a9f63] hover:underline"
                >
                  See all <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-2.5">
                {SIDEBAR_FOLLOWING.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <SmallAvatar name={f.name} avatarUrl={f.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        {f.tag}
                        {f.verified && <CheckCircle size={10} weight="fill" className="text-[#4a9f63]" />}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* ── Pulse breakdown overlay ───────────────────────────────────────── */}
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

      {/* ── Edit profile overlay ──────────────────────────────────────────── */}
      <Overlay open={editOpen} onClose={() => setEditOpen(false)} wide>
        <EditProfileSheet
          profile={currentProfile}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
        />
      </Overlay>
    </>
  );
}
