import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-[12px] font-semibold text-amber-500">
      {"★".repeat(Math.min(5, Math.max(0, rating)))}
      {"☆".repeat(Math.max(0, 5 - Math.min(5, rating)))}
    </span>
  );
}

export default async function OrganizerSnippetsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/organizer");

  // Get the organizer's events
  const { data: orgEvents } = await supabaseAdmin
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  const ownEventIds = (orgEvents ?? []).map((e: { id: string }) => e.id);

  type SnippetRow = {
    id: string;
    body: string;
    rating: number | null;
    created_at: string;
    event_id: string;
    users: { first_name: string; last_name: string; avatar_url: string | null } | null;
    events: { id: string; title: string } | null;
  };

  let snippets: SnippetRow[] = [];
  if (ownEventIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("snippets")
      .select(`
        id, body, rating, created_at, event_id,
        users (first_name, last_name, avatar_url),
        events (id, title)
      `)
      .in("event_id", ownEventIds)
      .order("created_at", { ascending: false })
      .limit(200);
    snippets = (data ?? []) as unknown as SnippetRow[];
  }

  const eventMap = new Map((orgEvents ?? []).map((e: { id: string; title: string }) => [e.id, e.title]));

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Community
        </p>
        <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Snippets
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Attendee reviews and reactions across all your events.
        </p>
      </div>

      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <Star size={32} className="text-[var(--text-tertiary)]" weight="thin" />
          <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
            No snippets yet
          </p>
          <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
            Snippets appear after attendees check in and rate your events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            {[
              { label: "Total snippets", value: snippets.length },
              {
                label: "Avg rating",
                value:
                  snippets.length > 0
                    ? (
                        snippets.reduce((s, sn) => s + (sn.rating ?? 5), 0) /
                        snippets.length
                      ).toFixed(1)
                    : "—",
              },
              {
                label: "5-star",
                value: snippets.filter((s) => (s.rating ?? 5) === 5).length,
              },
              { label: "Events covered", value: new Set(snippets.map((s) => s.event_id)).size },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  {stat.label}
                </p>
                <p className="mt-2 text-[1.4rem] font-bold tabular-nums text-[var(--text-primary)]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Snippets list */}
          {snippets.map((snippet) => {
            const u = snippet.users;
            const name = u ? `${u.first_name} ${u.last_name[0] ?? ""}.` : "Attendee";
            const initials = name[0]?.toUpperCase() ?? "A";
            const eventTitle = eventMap.get(snippet.event_id) ?? snippet.events?.title ?? "Unknown event";

            return (
              <div
                key={snippet.id}
                className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[13px] font-bold text-[var(--brand)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {name}
                        </p>
                        <StarRating rating={snippet.rating ?? 5} />
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate max-w-[160px]">
                        {eventTitle}
                      </p>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {snippet.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
