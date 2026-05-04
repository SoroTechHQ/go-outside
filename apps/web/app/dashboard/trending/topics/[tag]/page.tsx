import { notFound } from "next/navigation";
import {
  EventMiniList,
  OrganizerMiniList,
  ReasonList,
  SnippetList,
  TopicHeroCard,
  TopicMediaGrid,
  TopicMetricStrip,
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
      <TopicHeroCard topic={topic} organizerCount={related_organizers.length} />

      <TopicMetricStrip topic={topic} organizerCount={related_organizers.length} />

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
