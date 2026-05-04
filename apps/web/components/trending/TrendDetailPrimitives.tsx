import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  Fire,
  Heart,
  Ticket,
  Users,
} from "@phosphor-icons/react";
import { bannerUrl as withBannerTransform, thumbnailUrl as withThumbnailTransform } from "../../lib/image-url";
import type {
  TrendReason,
  TrendingEvent,
  TrendingOrganizer,
  TrendingSnippet,
} from "../../lib/trending/types";

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(diffMs / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export function TrendPageShell({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 pb-6 pt-8 md:py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/trending"
            className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--brand)]"
          >
            <ArrowLeft size={14} />
            Back to trending
          </Link>
          {eyebrow && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[28px] font-black tracking-tight text-[var(--text-primary)] md:text-[36px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-tertiary)]">
              {subtitle}
            </p>
          )}
          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function ReasonList({ reasons }: { reasons: TrendReason[] }) {
  if (!reasons.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {reasons.map((reason) => (
        <div
          key={`${reason.label}-${reason.value}`}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            {reason.label}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">{reason.value}</p>
        </div>
      ))}
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; icon?: ReactNode }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-4"
        >
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            {item.icon}
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{item.label}</p>
          </div>
          <p className="mt-2 text-[22px] font-black tracking-tight text-[var(--text-primary)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function FeaturedTrendEvent({ event }: { event: TrendingEvent }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="relative h-56 overflow-hidden">
        {event.banner_url ? (
          <img
            alt={event.title}
            className="h-full w-full object-cover"
            src={withBannerTransform(event.banner_url) ?? event.banner_url}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.62)_100%)]" />
        <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Fire size={10} weight="fill" />
            Trending
          </span>
          <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {Math.round(event.trending_score)} score
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="max-w-2xl text-[22px] font-black leading-tight text-white md:text-[28px]">
            {event.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-white/80">
            {event.start_datetime && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank size={12} weight="fill" />
                {new Date(event.start_datetime).toLocaleDateString("en-GH", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Ticket size={12} weight="fill" />
              {event.price_label ?? "Free"}
            </span>
            {event.organizer?.username && (
              <Link href={`/${event.organizer.username}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Users size={12} weight="fill" />
                {event.organizer.name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventMiniList({ events }: { events: TrendingEvent[] }) {
  if (!events.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.slug}`}
          className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 transition hover:border-[var(--border-default)]"
        >
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
            {event.banner_url ? (
              <img
                alt={event.title}
                className="h-full w-full object-cover"
                src={withThumbnailTransform(event.banner_url) ?? event.banner_url}
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[14px] font-bold leading-tight text-[var(--text-primary)]">
              {event.title}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
              {event.snippet_count} snippets · {compactNumber(event.saves_count)} saves
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)]">
              Open event
              <ArrowRight size={12} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function OrganizerMiniList({ organizers }: { organizers: TrendingOrganizer[] }) {
  if (!organizers.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {organizers.map((organizer) => (
        <Link
          key={organizer.id}
          href={organizer.username ? `/${organizer.username}` : `/dashboard/trending/organizers/${organizer.id}`}
          className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 transition hover:border-[var(--border-default)]"
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
            {organizer.logo_url ? (
              <img alt={organizer.name} className="h-full w-full object-cover" src={organizer.logo_url} />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[var(--text-primary)]">{organizer.name}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {compactNumber(organizer.follower_count)} followers · {organizer.snippet_count} snippets
            </p>
          </div>
          <ArrowRight size={13} className="text-[var(--text-tertiary)]" />
        </Link>
      ))}
    </div>
  );
}

export function SnippetList({
  snippets,
  emptyLabel,
}: {
  snippets: TrendingSnippet[];
  emptyLabel: string;
}) {
  if (!snippets.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-4 py-10 text-center text-[13px] text-[var(--text-tertiary)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snippets.map((snippet) => (
        <article key={snippet.id} className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                {snippet.user?.avatar_url ? (
                  <img alt={snippet.user.name} className="h-full w-full object-cover" src={snippet.user.avatar_url} />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {snippet.user?.username ? (
                    <Link href={`/${snippet.user.username}`} className="text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand)]">
                      {snippet.user.name}
                    </Link>
                  ) : (
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{snippet.user?.name ?? "Community member"}</p>
                  )}
                  <span className="text-[11px] text-[var(--text-tertiary)]">{timeAgo(snippet.created_at)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    <Heart size={10} weight="fill" />
                    {snippet.rating.toFixed(1)}
                  </span>
                </div>
                {snippet.event && (
                  <Link href={`/events/${snippet.event.slug}`} className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--brand)] hover:underline">
                    <Ticket size={11} weight="fill" />
                    {snippet.event.title}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {([snippet.photo_url, ...snippet.media_urls].filter(Boolean) as string[]).slice(0, 3).length > 0 && (
            <div className="grid grid-cols-1 gap-px bg-[var(--border-subtle)] sm:grid-cols-2">
              {([snippet.photo_url, ...snippet.media_urls].filter(Boolean) as string[]).slice(0, 3).map((mediaUrl) => (
                <div key={`${snippet.id}-${mediaUrl}`} className="relative h-48 bg-[var(--bg-muted)] sm:h-40">
                  <img alt="" className="h-full w-full object-cover" src={mediaUrl} />
                </div>
              ))}
            </div>
          )}
          <div className="p-4">
            {snippet.body && (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {snippet.body}
              </p>
            )}
            {!!snippet.vibe_tags.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {snippet.vibe_tags.slice(0, 6).map((tag) => (
                  <Link
                    key={`${snippet.id}-${tag}`}
                    href={`/dashboard/trending/topics/${encodeURIComponent(tag.toLowerCase())}`}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--brand)]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function TopicMediaGrid({ snippets }: { snippets: TrendingSnippet[] }) {
  const items = snippets
    .flatMap((snippet) =>
      ([snippet.photo_url, ...snippet.media_urls].filter(Boolean) as string[]).map((mediaUrl) => ({
        snippetId: snippet.id,
        mediaUrl,
        userName: snippet.user?.name ?? "Community member",
        eventSlug: snippet.event?.slug ?? null,
        eventTitle: snippet.event?.title ?? null,
      })),
    )
    .slice(0, 8);

  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => {
        const content = (
          <div className="group relative aspect-[0.82] overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <img
              alt={item.eventTitle ?? item.userName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={item.mediaUrl}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.78)_100%)]" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="line-clamp-2 text-[12px] font-bold text-white">
                {item.eventTitle ?? item.userName}
              </p>
              <p className="mt-1 text-[10px] text-white/70">{item.userName}</p>
            </div>
          </div>
        );

        if (item.eventSlug) {
          return (
            <Link key={`${item.snippetId}-${item.mediaUrl}`} href={`/events/${item.eventSlug}`}>
              {content}
            </Link>
          );
        }

        return <div key={`${item.snippetId}-${item.mediaUrl}`}>{content}</div>;
      })}
    </div>
  );
}
