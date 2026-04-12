import Link from "next/link";
import { PencilLine, Star } from "@phosphor-icons/react/dist/ssr";

type Snippet = {
  id: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  rating: number;
  body: string;
  vibeTags: string[];
  hasGoldBadge: boolean;
};

const MOCK_SNIPPETS: Snippet[] = [
  {
    id: "snip-1",
    eventSlug: "ga-rooftop-after-hours",
    eventName: "Ga Rooftop After Hours",
    eventDate: "April 5, 2025",
    rating: 5,
    body: "Cinematic without feeling staged. The event felt curated, but still social. Easy to meet people, music pacing was strong, and the venue flow made sense.",
    vibeTags: ["Rooftop", "Afrobeats", "Nightlife"],
    hasGoldBadge: true,
  },
  {
    id: "snip-2",
    eventSlug: "accra-jazz-night",
    eventName: "Accra Jazz Night",
    eventDate: "March 7, 2025",
    rating: 4,
    body: "The production value was high, but the atmosphere stayed warm. Two sets from resident ensembles, a guest feature, and an open-floor closing hour.",
    vibeTags: ["Jazz", "Live Music", "Intimate"],
    hasGoldBadge: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          weight={i < rating ? "fill" : "regular"}
          className={i < rating ? "text-[#DAA520]" : "text-[var(--text-tertiary)]"}
        />
      ))}
    </div>
  );
}

export function SnippetsTab() {
  if (MOCK_SNIPPETS.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <PencilLine size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-[var(--text-secondary)]">No snippets yet</p>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
          Attend an event and write your first review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {MOCK_SNIPPETS.map((snippet) => (
        <Link
          key={snippet.id}
          href={`/events/${snippet.eventSlug}`}
          className="group block overflow-hidden rounded-[18px] border border-white/5 bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] p-4 transition hover:border-[#4a9f63]/20 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-[13px] font-bold italic leading-tight text-white">
                {snippet.eventName}
              </p>
              <p className="mt-0.5 text-[10px] text-white/30">{snippet.eventDate}</p>
            </div>
            {snippet.hasGoldBadge && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  color: "#DAA520",
                  backgroundColor: "rgba(218,165,32,0.12)",
                  border: "1px solid rgba(218,165,32,0.28)",
                }}
              >
                ✦ Gold
              </span>
            )}
          </div>

          <div className="mt-2.5">
            <StarRating rating={snippet.rating} />
          </div>

          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-white/50">
            {snippet.body}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {snippet.vibeTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] text-[#4a9f63]"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
