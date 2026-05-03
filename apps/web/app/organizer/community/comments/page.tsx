import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { ChatCircle } from "@phosphor-icons/react/dist/ssr";
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

  // Fetch posts tagged to the organizer's events
  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`
      id, body, likes_count, created_at,
      users (first_name, last_name, avatar_url),
      events (id, title, slug)
    `)
    .not("event_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  // Filter to only posts on the organizer's events
  const { data: orgEvents } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const ownEventIds = new Set((orgEvents ?? []).map((e: { id: string }) => e.id));

  type PostRow = {
    id: string;
    body: string;
    likes_count: number | null;
    created_at: string;
    users: { first_name: string; last_name: string; avatar_url: string | null } | null;
    events: { id: string; title: string; slug: string } | null;
  };

  const allPosts = (posts ?? []) as unknown as PostRow[];
  const filtered = allPosts.filter(
    (p) => p.events != null && ownEventIds.has(p.events.id),
  );

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Community
        </p>
        <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Comments
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Posts your community tagged to your events.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-20 text-center">
          <ChatCircle size={32} className="text-[var(--text-tertiary)]" weight="thin" />
          <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
            No comments yet
          </p>
          <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
            Comments appear when attendees post about your events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header */}
          <div className="hidden grid-cols-[1fr_180px_100px_80px] items-center gap-4 px-4 py-1 sm:grid">
            {["Comment", "Event", "User", "Posted"].map((label) => (
              <p
                key={label}
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"
              >
                {label}
              </p>
            ))}
          </div>

          {filtered.map((post) => {
            const u = post.users;
            const name = u ? `${u.first_name} ${u.last_name[0] ?? ""}.` : "User";
            const initials = name[0]?.toUpperCase() ?? "U";

            return (
              <div
                key={post.id}
                className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
              >
                <div className="sm:grid sm:grid-cols-[1fr_180px_100px_80px] sm:items-center sm:gap-4">
                  {/* Comment */}
                  <p className="text-[13px] leading-relaxed text-[var(--text-primary)] line-clamp-2">
                    {post.body}
                  </p>

                  {/* Event */}
                  <p className="mt-2 truncate text-[12px] text-[var(--brand)] sm:mt-0">
                    {post.events?.title ?? "—"}
                  </p>

                  {/* User */}
                  <div className="mt-2 flex items-center gap-2 sm:mt-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[10px] font-bold text-[var(--brand)]">
                      {initials}
                    </div>
                    <p className="truncate text-[12px] text-[var(--text-secondary)]">{name}</p>
                  </div>

                  {/* Date */}
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)] sm:mt-0">
                    {formatRelative(post.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
