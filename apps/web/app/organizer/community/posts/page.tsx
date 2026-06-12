import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          weight={i < rating ? "fill" : "regular"}
          style={{ color: i < rating ? "#f59e0b" : "var(--text-tertiary)" }}
        />
      ))}
    </span>
  );
}

export default async function OrganizerPostsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/organizer");

  const { data: orgEvents } = await supabaseAdmin
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  const ownEventIds = (orgEvents ?? []).map((e: { id: string }) => e.id);

  type PostRow = {
    id: string; body: string; rating: number | null; created_at: string; event_id: string;
    users: { first_name: string; last_name: string; avatar_url: string | null } | null;
    events: { id: string; title: string } | null;
  };

  let posts: PostRow[] = [];
  if (ownEventIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("snippets")
      .select(`id, body, rating, created_at, event_id, users (first_name, last_name, avatar_url), events (id, title)`)
      .in("event_id", ownEventIds)
      .order("created_at", { ascending: false })
      .limit(200);
    posts = (data ?? []) as unknown as PostRow[];
  }

  const eventMap = new Map((orgEvents ?? []).map((e: { id: string; title: string }) => [e.id, e.title]));
  const avgRating = posts.length > 0
    ? (posts.reduce((s, sn) => s + (sn.rating ?? 5), 0) / posts.length).toFixed(1)
    : "—";

  const accents = ["#2f8f45", "#f59e0b", "#3b82f6", "#8b5cf6"];

  return (
    <div>
      {/* ── Hero header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Community</p>
        <h1 className="relative mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Posts</h1>
        <p className="relative mt-1 text-[13px] text-[var(--text-secondary)]">Attendee reviews and reactions across all your events.</p>
      </div>

      <div className="p-5 md:p-7">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
              <Star size={24} weight="thin" style={{ color: "var(--text-tertiary)" }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No posts yet</p>
            <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
              Posts appear after attendees check in and rate your events.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Stats KPI row ──────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total posts",   value: posts.length.toString(),                                    accent: accents[0]! },
                { label: "Avg rating",        value: avgRating,                                                    accent: accents[1]! },
                { label: "5-star reviews",    value: posts.filter((s) => (s.rating ?? 5) === 5).length.toString(), accent: accents[2]! },
                { label: "Events covered",    value: new Set(posts.map((s) => s.event_id)).size.toString(),     accent: accents[3]! },
              ].map((k) => (
                <div key={k.label} className="relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
                  <div className="h-[3px]" style={{ background: k.accent }} />
                  <div className="p-4">
                    <p className="text-[1.8rem] font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)]">{k.value}</p>
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Posts list ──────────────────────────────── */}
            <div className="space-y-2.5">
              {posts.map((post) => {
                const u = post.users;
                const name = u ? `${u.first_name} ${u.last_name[0] ?? ""}.` : "Attendee";
                const initials = name[0]?.toUpperCase() ?? "A";
                const eventTitle = eventMap.get(post.event_id) ?? post.events?.title ?? "Unknown event";

                return (
                  <div key={post.id} className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand)]/20 hover:shadow-[0_4px_16px_rgba(5,12,8,0.06)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[13px] font-bold text-[var(--brand)]">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
                            <StarRow rating={post.rating ?? 5} />
                          </div>
                          <p className="truncate text-[11px] text-[var(--brand)] max-w-[180px]">{eventTitle}</p>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{post.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
