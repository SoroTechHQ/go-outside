import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EventMetricStrip,
  FeaturedTrendEvent,
  ReasonList,
  SnippetList,
  TrendPageShell,
} from "../../../../../components/trending/TrendDetailPrimitives";
import { getTrendingEventDetail } from "../../../../../lib/trending/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TrendingEventDetailPage({ params }: Props) {
  const { slug } = await params;
  const detail = await getTrendingEventDetail(slug);

  if (!detail) notFound();

  const { event, related_topics, snippets } = detail;

  return (
    <TrendPageShell
      eyebrow="Event trend"
      title={event.title}
      subtitle="This breakdown pulls from recent saves, views, ticket demand, and snippet activity to show why this event is climbing right now."
    >
      <FeaturedTrendEvent event={event} />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/events/${event.slug}`}
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-white"
        >
          Open event page
        </Link>
        {event.organizer?.username && (
          <Link
            href={`/${event.organizer.username}`}
            className="rounded-full border border-[var(--border-default)] px-4 py-2 text-[13px] font-semibold text-[var(--text-primary)]"
          >
            View organizer
          </Link>
        )}
      </div>

      <EventMetricStrip event={event} />

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Why It Is Trending
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Signals from the app and database</h2>
        </div>
        <ReasonList reasons={event.reasons} />
      </section>

      {related_topics.length > 0 && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Related topics
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {related_topics.map((topic) => (
              <Link
                key={topic}
                href={`/dashboard/trending/topics/${encodeURIComponent(topic)}`}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--brand)]"
              >
                #{topic}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Snippets behind the trend
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">What people are saying</h2>
        </div>
        <SnippetList snippets={snippets} emptyLabel="No public snippets yet for this event." />
      </section>
    </TrendPageShell>
  );
}
