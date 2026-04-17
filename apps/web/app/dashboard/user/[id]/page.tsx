"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarBlank,
  Users,
  Ticket,
  Heart,
  ChatCircleDots,
  UserPlus,
  UserMinus,
  DotsThreeVertical,
  Star,
  Fire,
} from "@phosphor-icons/react";
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from "../../../../components/ui/avatar";

// ── Mock profile data ─────────────────────────────────────────────────────────
const MOCK_USER = {
  id: "user-456",
  name: "Ama Owusu",
  handle: "@ama.owusu",
  bio: "Festival lover 🎵 | Foodie 🍲 | Accra born, Accra raised | Chasing experiences not things",
  location: "Accra, Ghana",
  avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5bd?auto=format&w=160&h=160&fit=crop&crop=faces",
  coverUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=1200&fit=crop",
  joinedAt: "March 2024",
  eventsAttended: 18,
  friendCount: 42,
  followingCount: 76,
  pulseScore: 2840,
  pulseTier: "Insider",
  isOnline: true,
  topCategories: ["Music", "Food", "Culture"],
  pastEvents: [
    {
      id: "e1",
      title: "Afrobeats Night",
      date: "Apr 5, 2025",
      imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=400&fit=crop",
      category: "Music",
    },
    {
      id: "e2",
      title: "Chale Wote 2024",
      date: "Aug 20, 2024",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&w=400&fit=crop",
      category: "Culture",
    },
    {
      id: "e3",
      title: "Accra Food Festival",
      date: "Dec 12, 2024",
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&w=400&fit=crop",
      category: "Food",
    },
  ],
};

type Tab = "been_there" | "friends" | "following";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("been_there");
  const [following, setFollowing] = useState(false);

  const user = MOCK_USER;

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell">
        {/* Cover */}
        <div className="relative">
          <div className="h-40 md:h-52 overflow-hidden">
            {user.coverUrl ? (
              <img
                alt="cover"
                className="h-full w-full object-cover"
                src={user.coverUrl}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[var(--brand)] to-[#256f36]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Back button */}
          <button
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>
        </div>

        {/* Avatar + actions */}
        <div className="relative px-4 pb-0">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-[var(--bg-card)]">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-lg">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                <AvatarStatus status={user.isOnline ? "online" : "offline"} size="lg" />
              </Avatar>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                onClick={() => router.push("/messages")}
                type="button"
              >
                <ChatCircleDots size={18} weight="regular" />
              </button>

              <button
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95 ${
                  following
                    ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                }`}
                onClick={() => setFollowing((v) => !v)}
                type="button"
              >
                {following ? (
                  <><UserMinus size={14} weight="bold" /> Following</>
                ) : (
                  <><UserPlus size={14} weight="bold" /> Follow</>
                )}
              </button>
            </div>
          </div>

          {/* Profile info */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-black text-[var(--text-primary)]">{user.name}</h1>
              {/* Pulse tier badge */}
              <span className="rounded-full bg-[var(--brand-dim)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--brand)]">
                {user.pulseTier}
              </span>
            </div>
            <p className="text-[14px] text-[var(--text-tertiary)]">{user.handle}</p>

            {user.bio && (
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{user.bio}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-[var(--text-tertiary)]">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} weight="fill" /> {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarBlank size={12} weight="fill" /> Joined {user.joinedAt}
              </span>
            </div>

            {/* Category tags */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.topCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-5 grid grid-cols-4 gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
            {[
              { label: "Events", value: user.eventsAttended, icon: Ticket },
              { label: "Friends", value: user.friendCount, icon: Users },
              { label: "Following", value: user.followingCount, icon: Heart },
              { label: "Pulse", value: user.pulseScore.toLocaleString(), icon: Fire },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon size={16} className="text-[var(--text-tertiary)]" weight="fill" />
                <p className="text-[15px] font-black text-[var(--text-primary)]">{value}</p>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex rounded-2xl bg-[var(--bg-muted)] p-1 gap-1">
            {([
              { id: "been_there", label: "Been There" },
              { id: "friends", label: "Friends" },
              { id: "following", label: "Following" },
            ] as const).map((t) => (
              <button
                key={t.id}
                className="flex-1 rounded-xl py-2 text-[12px] font-semibold transition-all"
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "var(--bg-card)" : "transparent",
                  color: tab === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "been_there" && (
            <div className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3">
              {user.pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer"
                  onClick={() => router.push(`/`)}
                >
                  <img
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={event.imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[12px] font-bold text-white line-clamp-2 leading-tight">{event.title}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">{event.date}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {event.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "friends" && (
            <div className="pb-8 text-center py-12 text-[var(--text-tertiary)]">
              <Users size={32} weight="light" className="mx-auto mb-2" />
              <p className="text-[14px]">Friends list is private</p>
            </div>
          )}

          {tab === "following" && (
            <div className="pb-8 text-center py-12 text-[var(--text-tertiary)]">
              <Heart size={32} weight="light" className="mx-auto mb-2" />
              <p className="text-[14px]">Following list is private</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
