import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default async function OrganizerEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateSupabaseUser();
  if (!user) return notFound();

  const [{ data: event }, { data: ticketTypes }, { data: snippets }] = await Promise.all([
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
      .from("snippets")
      .select("id, body, rating, created_at, users (first_name, last_name)")
      .eq("event_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
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
      <div className="flex items-center justify-between gap-4">
        <Link
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          href="/organizer/events"
        >
          <ArrowLeft size={16} weight="bold" />
          All events
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            href={`/events/${ev.slug}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ArrowSquareOut size={14} />
            Preview public page
          </Link>
          <Link
            className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[13px] font-semibold text-black transition hover:bg-[#4fa824]"
            href={`/organizer/events/new?edit=${ev.id}`}
          >
            <PencilSimple size={14} weight="bold" />
            Edit
          </Link>
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
          { label: "Tickets sold", value: ev.tickets_sold?.toLocaleString() ?? "0" },
          { label: "Capacity", value: ev.total_capacity ? ev.total_capacity.toLocaleString() : "Unlimited" },
          { label: "Revenue", value: formatMoney(totalRevenue) },
          { label: "Saves", value: ev.saves_count?.toLocaleString() ?? "0" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              {kpi.label}
            </p>
            <p className="mt-2 text-[1.4rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">
              {kpi.value}
            </p>
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

        {/* Snippets */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Attendee snippets
          </p>
          {snippets && snippets.length > 0 ? (
            <div className="mt-4 space-y-3">
              {snippets.map((s) => {
                const su = s.users as unknown as { first_name: string; last_name: string } | null;
                const name = su ? `${su.first_name} ${su.last_name[0] ?? ""}.` : "Attendee";
                return (
                  <div key={s.id} className="rounded-[16px] bg-[var(--bg-elevated)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
                      <span className="text-[12px] font-semibold text-amber-500">
                        {"★".repeat(s.rating ?? 5)}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">
              No snippets yet — they appear after attendees check in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
