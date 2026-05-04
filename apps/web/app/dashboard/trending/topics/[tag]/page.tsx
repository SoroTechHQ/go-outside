import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChatCircleDots,
  Fire,
  Ticket,
  Users,
} from "@phosphor-icons/react";
import {
  EventMiniList,
  MetricStrip,
  OrganizerMiniList,
  ReasonList,
  SnippetList,
  TopicMediaGrid,
  TrendPageShell,
} from "../../../../../components/trending/TrendDetailPrimitives";
import { getTrendingTopicDetail } from "../../../../../lib/trending/server";

type Props = {
  params: Promise<{ tag: string }>;
};

export default async function TrendingTopicDetailPage({ params }: Props) {
  const { tag } = await params;
  const detail = await getTrendingTopicDetail(tag);

  if (!detail) notFound();

  const { topic, events, snippets, related_organizers } = detail;

  return (
    <TrendPageShell
      eyebrow="Topic trend"
      title={`#${topic.tag}`}
      subtitle="This works like a topic search surface: live mentions first, visual posts next, then the events and organizers driving the conversation."
    >
      <div className="overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(74,159,99,0.08)_0%,rgba(255,255,255,0)_100%)]">
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
              <Fire size={10} weight="fill" />
              Trending topic
            </span>
            <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              {Math.round(topic.trending_score)} score
            </span>
            <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              {topic.count} mentions
            </span>
            <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              {topic.event_count} linked events
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#mentions" className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
              Mentions
            </a>
            <a href="#media" className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
              Media
            </a>
            <a href="#events" className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
              Events
            </a>
            <a href="#organizers" className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
              Organizers
            </a>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {topic.lead_event_slug && (
              <Link
                href={`/events/${topic.lead_event_slug}`}
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Open lead event
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/70 px-5 py-4 md:px-6">
          <p className="text-[12px] leading-relaxed text-[var(--text-tertiary)]">
            The topic index only accepts cleaned tags and hashtags. Generic filler terms are filtered out so this page surfaces actual scenes, interests, and event conversations instead of random words.
          </p>
        </div>
      </div>

      <MetricStrip
        items={[
          { label: "Snippets", value: topic.count.toLocaleString(), icon: <ChatCircleDots size={14} /> },
          { label: "Events", value: topic.event_count.toLocaleString(), icon: <Ticket size={14} /> },
          { label: "Organizers", value: related_organizers.length.toLocaleString(), icon: <Users size={14} /> },
          { label: "Trend score", value: Math.round(topic.trending_score).toLocaleString(), icon: <Fire size={14} /> },
        ]}
      />

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Why It Is Trending
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Signals behind the topic</h2>
        </div>
        <ReasonList reasons={topic.reasons} />
      </section>

      <section id="media" className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Media wall
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Visual posts tied to this topic</h2>
        </div>
        <TopicMediaGrid snippets={snippets} />
      </section>

      <section id="mentions" className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Mentions feed
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">How people are talking about it</h2>
        </div>
        <SnippetList snippets={snippets} emptyLabel="No public snippets yet for this topic." />
      </section>

      <section id="events" className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Event cluster
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Events people are connecting to this topic</h2>
        </div>
        <EventMiniList events={events} />
      </section>

      <section id="organizers" className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Related organizers
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Who is helping drive the conversation</h2>
        </div>
        <OrganizerMiniList organizers={related_organizers} />
      </section>
    </TrendPageShell>
  );
}
