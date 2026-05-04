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
      subtitle="Topics rise when people keep mentioning them in snippets and when the strongest events on the platform cluster around the same theme."
    >
      <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
            <Fire size={10} weight="fill" />
            Trending topic
          </span>
          <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
            {Math.round(topic.trending_score)} score
          </span>
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

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Event cluster
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Events people are connecting to this topic</h2>
        </div>
        <EventMiniList events={events} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Snippets
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">How people are talking about it</h2>
        </div>
        <SnippetList snippets={snippets} emptyLabel="No public snippets yet for this topic." />
      </section>

      <section className="space-y-4">
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
