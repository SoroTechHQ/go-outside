import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { ChatCircle, Heart } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";

function formatRelative(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function OrganizerCommentsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/organizer");

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`id, body, like_count, created_at, users (first_name, last_name, avatar_url), events (id, title, slug)`)
    .not("event_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: orgEvents } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const ownEventIds = new Set((orgEvents ?? []).map((e: { id: string }) => e.id));

  type PostRow = {
    id: string; body: string; like_count: number | null; created_at: string;
    users: { first_name: string; last_name: string; avatar_url: string | null } | null;
    events: { id: string; title: string; slug: string } | null;
  };

  const filtered = ((posts ?? []) as unknown as PostRow[]).filter(
    (p) => p.events != null && ownEventIds.has(p.events.id),
  );

  return (
    <div>
      {/* ── Hero header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Community</p>
        <h1 className="relative mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Comments</h1>
        <p className="relative mt-1 text-[13px] text-[var(--text-secondary)]">Posts your community tagged to your events.</p>
      </div>

      <div className="p-5 md:p-7">
        {/* ── Count chip ──────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-3 py-1 text-[12px] font-semibold text-[var(--brand)]">
              {filtered.length} comment{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-20 text-center shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
              <ChatCircle size={24} weight="thin" style={{ color: "var(--text-tertiary)" }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No comments yet</p>
            <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
              Comments appear when attendees post about your events.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_180px_120px_80px] items-center gap-4 px-4 py-1 sm:grid">
              {["Comment", "Event", "User", "Posted"].map((label) => (
                <p key={label} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
              ))}
            </div>

            {filtered.map((post) => {
              const u = post.users;
              const name = u ? `${u.first_name} ${u.last_name[0] ?? ""}.` : "User";
              const initials = name[0]?.toUpperCase() ?? "U";

              return (
                <div
                  key={post.id}
                  className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand)]/20 hover:shadow-[0_4px_16px_rgba(5,12,8,0.06)]"
                >
                  <div className="sm:grid sm:grid-cols-[1fr_180px_120px_80px] sm:items-center sm:gap-4">
                    {/* Comment */}
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-primary)]">{post.body}</p>

                    {/* Event */}
                    <p className="mt-2 truncate text-[12px] font-medium text-[var(--brand)] sm:mt-0">
                      {post.events?.title ?? "—"}
                    </p>

                    {/* User */}
                    <div className="mt-2 flex items-center gap-2 sm:mt-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[10px] font-bold text-[var(--brand)]">
                        {initials}
                      </div>
                      <p className="truncate text-[12px] text-[var(--text-secondary)]">{name}</p>
                    </div>

                    {/* Date + likes */}
                    <div className="mt-2 sm:mt-0">
                      <p className="text-[11px] text-[var(--text-tertiary)]">{formatRelative(post.created_at)}</p>
                      {(post.like_count ?? 0) > 0 && (
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-rose-400">
                          <Heart size={10} weight="fill" />
                          {post.like_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
