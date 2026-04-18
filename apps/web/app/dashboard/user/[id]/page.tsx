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
  DotsThreeVertical,
  Fire,
} from "@phosphor-icons/react";
import { getEventImage } from "@gooutside/demo-data";
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from "../../../../components/ui/avatar";
import {
  getCommunityPastEvents,
  getCommunityProfileById,
} from "../../../../lib/mock-community";

type Tab = "been_there" | "friends" | "following";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("been_there");
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = typeof params.id === "string" ? params.id : "ama-k";
  const user = getCommunityProfileById(userId) ?? getCommunityProfileById("ama-k")!;
  const pastEvents = getCommunityPastEvents(user.id).map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    date: event.dateLabel,
    imageUrl: getEventImage(undefined, event.categorySlug),
    category: event.eyebrow,
  }));

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className="container-shell px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[32px] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[0_24px_80px_rgba(15,17,15,0.08)]">
            <div className="relative h-52 overflow-hidden md:h-72">
              {user.coverUrl ? (
                <img
                  alt="cover"
                  className="h-full w-full object-cover"
                  src={user.coverUrl}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[var(--brand)] to-[#256f36]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.58)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%)]" />

              <div className="absolute left-4 right-4 top-4 flex items-center justify-between md:left-6 md:right-6">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
                  onClick={() => router.back()}
                  type="button"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    {user.pulseTier}
                  </span>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
                    type="button"
                  >
                    <DotsThreeVertical size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative px-4 pb-6 md:px-8 md:pb-8">
              <div className="-mt-14 flex flex-col gap-6 md:-mt-16">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-[var(--bg-card)] shadow-[0_12px_36px_rgba(0,0,0,0.16)] md:h-28 md:w-28">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        <AvatarStatus status={user.isOnline ? "online" : "offline"} size="lg" />
                      </Avatar>
                    </div>

                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-[1.65rem] font-black tracking-[-0.04em] text-[var(--text-primary)] md:text-[2.15rem]">
                          {user.name}
                        </h1>
                        <span className="rounded-full border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                          {user.pulseTier}
                        </span>
                      </div>
                      <p className="mt-1 text-[15px] text-[var(--text-tertiary)]">{user.handle}</p>

                      {user.bio && (
                        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                          {user.bio}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-[var(--text-tertiary)]">
                        {user.location && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1.5">
                            <MapPin size={13} weight="fill" /> {user.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-muted)] px-3 py-1.5">
                          <CalendarBlank size={13} weight="fill" /> Joined {user.joinedAt}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {user.topCategories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-end">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                      onClick={() => router.push("/dashboard/messages")}
                      type="button"
                    >
                      <ChatCircleDots size={18} weight="regular" />
                    </button>
                    <button
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                        isFollowing
                          ? "border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                          : "bg-[var(--brand)] text-black"
                      }`}
                      onClick={() => setIsFollowing((value) => !value)}
                      type="button"
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <div className="rounded-[28px] border border-[var(--home-highlight-border)] bg-[linear-gradient(135deg,rgba(47,143,69,0.12),rgba(47,143,69,0.04)_56%,rgba(255,255,255,0.82)_100%)] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">Pulse status</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[2rem] font-black tracking-[-0.05em] text-[var(--text-primary)]">
                          {user.pulseScore.toLocaleString()}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">Scene Kid trending toward City Native</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--brand)] shadow-[var(--home-shadow)]">
                        <Fire size={22} weight="fill" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        <span>Current tier</span>
                        <span>Next unlock</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/60">
                        <div className="h-2 w-[68%] rounded-full bg-[var(--brand)]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: "Events", value: user.eventsAttended, icon: Ticket },
                      { label: "Friends", value: user.friendCount, icon: Users },
                      { label: "Following", value: user.followingCount, icon: Heart },
                      { label: "Pulse", value: user.pulseScore.toLocaleString(), icon: Fire },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-5 text-center shadow-[var(--home-shadow)]"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                          <Icon size={18} weight="fill" />
                        </div>
                        <p className="mt-3 text-[1.15rem] font-black tracking-[-0.03em] text-[var(--text-primary)]">
                          {value}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--home-border)] bg-[var(--bg-surface)] p-2 shadow-[var(--home-shadow)]">
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "been_there", label: "Been There" },
                      { id: "friends", label: "Friends" },
                      { id: "following", label: "Following" },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        className={`rounded-[20px] px-3 py-3 text-[12px] font-semibold transition-all ${
                          tab === t.id
                            ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_8px_20px_rgba(15,17,15,0.06)]"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                        onClick={() => setTab(t.id)}
                        type="button"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)] md:p-5">
                  {tab === "been_there" && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {pastEvents.map((event) => (
                        <button
                          key={event.id}
                          className="group relative aspect-[0.95] overflow-hidden rounded-[24px] text-left"
                          onClick={() => router.push(`/events/${event.slug}`)}
                          type="button"
                        >
                          <img
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                            src={event.imageUrl}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_38%,rgba(0,0,0,0.78)_100%)]" />
                          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
                            <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                              {event.category}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-[0.95rem] font-semibold leading-tight text-white">{event.title}</p>
                            <p className="mt-1 text-[11px] text-white/72">{event.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {tab === "friends" && (
                    <div className="rounded-[24px] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-14 text-center text-[var(--text-tertiary)]">
                      <Users size={32} weight="light" className="mx-auto mb-3" />
                      <p className="text-[14px] font-medium text-[var(--text-secondary)]">Friends list is private</p>
                      <p className="mt-1 text-[12px]">Shared connections will show up here once this profile opens it up.</p>
                    </div>
                  )}

                  {tab === "following" && (
                    <div className="rounded-[24px] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-14 text-center text-[var(--text-tertiary)]">
                      <Heart size={32} weight="light" className="mx-auto mb-3" />
                      <p className="text-[14px] font-medium text-[var(--text-secondary)]">Following list is private</p>
                      <p className="mt-1 text-[12px]">Organizers, people, and scenes this user follows will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
