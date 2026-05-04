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
  ReasonList,
  SnippetList,
  TrendPageShell,
} from "../../../../../components/trending/TrendDetailPrimitives";
import { getTrendingOrganizerDetail } from "../../../../../lib/trending/server";

type Props = {
  params: Promise<{ identifier: string }>;
};

export default async function TrendingOrganizerDetailPage({ params }: Props) {
  const { identifier } = await params;
  const detail = await getTrendingOrganizerDetail(identifier);

  if (!detail) notFound();

  const { organizer, top_events, snippets } = detail;

  return (
    <TrendPageShell
      eyebrow="Organizer trend"
      title={organizer.name}
      subtitle="This view explains why the organizer is on the trending list by combining follow momentum, event performance, and the snippet activity around their events."
    >
      <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[var(--bg-muted)]">
              {organizer.logo_url ? (
                <img alt={organizer.name} className="h-full w-full object-cover" src={organizer.logo_url} />
              ) : null}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
                <Fire size={10} weight="fill" />
                Trending organizer
              </div>
              <h2 className="mt-2 text-[24px] font-black text-[var(--text-primary)]">{organizer.name}</h2>
              <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                {Math.round(organizer.trending_score)} score · {organizer.follower_count.toLocaleString()} followers
              </p>
            </div>
          </div>
          {organizer.username && (
            <Link
              href={`/${organizer.username}`}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-center text-[13px] font-semibold text-white"
            >
              Open profile
            </Link>
          )}
        </div>
      </div>

      <MetricStrip
        items={[
          { label: "Followers", value: organizer.follower_count.toLocaleString(), icon: <Users size={14} /> },
          { label: "Events", value: organizer.event_count.toLocaleString(), icon: <Ticket size={14} /> },
          { label: "Snippets", value: organizer.snippet_count.toLocaleString(), icon: <ChatCircleDots size={14} /> },
          { label: "Trend score", value: Math.round(organizer.trending_score).toLocaleString(), icon: <Fire size={14} /> },
        ]}
      />

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Why It Is Trending
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Recent organizer momentum</h2>
        </div>
        <ReasonList reasons={organizer.reasons} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Events pushing the trend
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">Top related events</h2>
        </div>
        <EventMiniList events={top_events} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Snippets
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[var(--text-primary)]">What attendees are saying</h2>
        </div>
        <SnippetList snippets={snippets} emptyLabel="No public snippets yet for this organizer’s events." />
      </section>
    </TrendPageShell>
  );
}
