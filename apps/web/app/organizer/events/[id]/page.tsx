import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowSquareOut, BookmarkSimple, ChartBar, ChatCircle, Heart, Star, Ticket, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { CopyLinkButton } from "./CopyLinkButton";
import { EventDetailActions } from "./EventDetailActions";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatRelative(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function OrganizerEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const [{ data: event }, { data: ticketTypes }, { data: communityPosts }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select(`
        id, title, slug, short_description, description, banner_url,
        start_datetime, end_datetime, status, tickets_sold, total_capacity,
        saves_count, views_count, tags,
        categories (name, slug),
        venues (name, city, address),
        custom_location, is_online, organizer_id
      `)
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("ticket_types")
      .select("id, name, price, price_type, quantity_total, quantity_sold")
      .eq("event_id", id)
      .order("price", { ascending: true }),
    supabaseAdmin
      .from("posts")
      .select("id, body, like_count, created_at, users (first_name, last_name)")
      .eq("event_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!event || event.organizer_id !== user.id) return notFound();

  const ev = event as typeof event & {
    categories: { name: string; slug: string } | null;
    venues: { name: string; city: string; address: string | null } | null;
  };

  const totalRevenue = (ticketTypes ?? []).reduce(
    (sum, t) => sum + (t.quantity_sold ?? 0) * Number(t.price),
    0
  );
  const statusLabel =
    ev.status !== "published" ? "Draft" :
    ev.total_capacity && ev.tickets_sold >= ev.total_capacity ? "Sold Out" :
    new Date(ev.start_datetime) < new Date() ? "Past" : "Live";

  const statusColor =
    statusLabel === "Live" ? "bg-[var(--brand)]/12 text-[var(--brand)]" :
    statusLabel === "Sold Out" ? "bg-amber-500/12 text-amber-500" :
    "bg-[var(--bg-muted)] text-[var(--text-tertiary)]";

  const location = ev.is_online
    ? "Online"
    : ev.venues?.name
    ? `${ev.venues.name}, ${ev.venues.city}`
    : ev.custom_location ?? "—";

  return (
    <div className="p-5 md:p-7 space-y-6">
      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          href="/organizer/events"
        >
          <ArrowLeft size={16} weight="bold" />
          All events
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <CopyLinkButton slug={ev.slug} />
          <Link
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--brand)] hover:border-[var(--brand)]/30"
            href={`/organizer/events/${ev.id}/analytics`}
          >
            <ChartBar size={14} weight="fill" />
            Analytics
          </Link>
          <Link
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            href={`/events/${ev.slug}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ArrowSquareOut size={14} />
            Preview
          </Link>
          <EventDetailActions
            eventId={ev.id}
            eventSlug={ev.slug}
            eventName={ev.title}
            status={ev.status}
            ticketsSold={ev.tickets_sold ?? 0}
            attendeeCount={ev.tickets_sold ?? 0}
          />
        </div>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
        {ev.banner_url && (
          <img alt={ev.title} className="h-48 w-full object-cover" src={ev.banner_url} />
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                {ev.categories?.name ?? "Event"}
              </p>
              <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
                {ev.title}
              </h1>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {formatDate(ev.start_datetime)} · {location}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          {ev.short_description && (
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {ev.short_description}
            </p>
          )}
          {ev.tags && ev.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ev.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-[11px] text-[var(--text-tertiary)]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Tickets sold", value: ev.tickets_sold?.toLocaleString() ?? "0",                            accent: "#2f8f45", icon: <Ticket     size={16} weight="fill" /> },
          { label: "Capacity",     value: ev.total_capacity ? ev.total_capacity.toLocaleString() : "Unlimited", accent: "#3b82f6", icon: <UsersThree size={16} weight="fill" /> },
          { label: "Revenue",      value: formatMoney(totalRevenue),                                            accent: "#f59e0b", icon: <ChartBar   size={16} weight="fill" /> },
          { label: "Saves",        value: ev.saves_count?.toLocaleString() ?? "0",                              accent: "#8b5cf6", icon: <BookmarkSimple size={16} weight="fill" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
            <div className="h-[3px]" style={{ background: kpi.accent }} />
            <div className="p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${kpi.accent}1a`, color: kpi.accent }}>
                {kpi.icon}
              </span>
              <p className="mt-3 text-[1.7rem] font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)]">{kpi.value}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Ticket tiers */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Ticket tiers
          </p>
          {ticketTypes && ticketTypes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {ticketTypes.map((t) => {
                const sold = t.quantity_sold ?? 0;
                const total = t.quantity_total;
                const ratio = total ? Math.round((sold / total) * 100) : 0;
                return (
                  <div key={t.id} className="rounded-[16px] bg-[var(--bg-elevated)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                          {Number(t.price) === 0 ? "Free" : formatMoney(Number(t.price))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
                          {sold}{total ? `/${total}` : ""}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">sold</p>
                      </div>
                    </div>
                    {total && (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-[var(--bg-muted)]">
                          <div
                            className="h-1.5 rounded-full bg-[var(--brand)] transition-[width]"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{ratio}% sold</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">No ticket tiers configured.</p>
          )}
        </div>

        {/* Posts */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Attendee posts
          </p>
          {communityPosts && communityPosts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {communityPosts.slice(0, 6).map((s) => {
                const su = s.users as unknown as { first_name: string; last_name: string } | null;
                const name = su ? `${su.first_name} ${su.last_name[0] ?? ""}.` : "Attendee";
                return (
                  <div key={s.id} className="rounded-[16px] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">
              No posts yet — they appear after attendees check in.
            </p>
          )}
        </div>
      </div>

      {/* Comments / posts tagged to this event */}
      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
        <div className="flex items-center gap-2">
          <ChatCircle size={16} className="text-[var(--brand)]" weight="fill" />
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Comments & posts</p>
        </div>
        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
          Posts your community tagged to this event.
        </p>

        {communityPosts && communityPosts.length > 0 ? (
          <div className="mt-4 space-y-3">
            {communityPosts.map((post) => {
              const pu = post.users as unknown as { first_name: string; last_name: string } | null;
              const name = pu ? `${pu.first_name} ${pu.last_name[0] ?? ""}.` : "User";
              return (
                <div key={post.id} className="rounded-[16px] bg-[var(--bg-elevated)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[12px] font-bold text-[var(--brand)]">
                        {name[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{formatRelative(post.created_at)}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
                      <Heart size={12} weight={(post.like_count ?? 0) > 0 ? "fill" : "regular"} style={{ color: (post.like_count ?? 0) > 0 ? "#f43f5e" : undefined }} />
                      {post.like_count ?? 0}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{post.body}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center py-8 text-center">
            <ChatCircle size={28} className="text-[var(--text-tertiary)]" weight="thin" />
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
              No comments yet — they appear when attendees post about your event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
