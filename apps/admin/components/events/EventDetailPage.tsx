import Link from "next/link"
import { supabaseAdmin } from "../../lib/supabase"
import { DashboardShell } from "../dashboard-shell"
import { MiniPill, SectionBlock } from "../dashboard-primitives"
import { EventDetailActions } from "./EventDetailActions"

function formatDate(dateStr: string | null, withTime = false): string {
  if (!dateStr) return "—"
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "long", year: "numeric" }
  return new Date(dateStr).toLocaleDateString("en-GB", opts)
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-3 last:border-0">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="text-right text-sm text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

type Props = { params: Promise<{ id: string }> }

export async function EventDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: event }, { data: ticketTypes }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select(
        `id, title, slug, description, status, start_datetime, end_datetime,
         location_name, location_address, location_city,
         tickets_sold, total_capacity, is_featured, is_landmark, is_sponsored,
         cover_url, created_at, updated_at,
         categories(name),
         organizer:users!events_organizer_id_fkey(id, first_name, last_name, email, location_city)`
      )
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("ticket_types")
      .select("id, name, price, capacity, sold_count")
      .eq("event_id", id),
  ])

  if (!event) {
    return (
      <DashboardShell mode="admin" title="Event not found" subtitle="">
        <div className="py-16 text-center">
          <p className="text-[var(--text-tertiary)]">No event found with this ID.</p>
          <Link
            href="/events"
            className="mt-4 inline-block text-sm text-[var(--brand)] hover:underline"
          >
            ← Back to Events
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const ev = event as any
  const organizer = ev.organizer as {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    location_city: string | null
  } | null
  const category = (ev.categories as { name: string } | null)?.name ?? "—"
  const organizerName = organizer
    ? [organizer.first_name, organizer.last_name].filter(Boolean).join(" ") || "Unknown"
    : "Unknown"

  const statusTone = (s: string) => {
    if (s === "published") return "brand" as const
    if (s === "draft") return "amber" as const
    if (s === "cancelled") return "coral" as const
    return "violet" as const
  }

  const soldPct =
    ev.total_capacity && ev.total_capacity > 0
      ? Math.round(((ev.tickets_sold ?? 0) / ev.total_capacity) * 100)
      : 0

  return (
    <DashboardShell
      mode="admin"
      title={ev.title}
      subtitle={`Event ID: ${id}`}
    >
      <div className="space-y-6">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link href="/events" className="hover:text-[var(--brand)] transition-colors">
            ← Events
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">{ev.title}</span>
        </div>

        {/* Header card */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <MiniPill tone={statusTone(ev.status ?? "draft")}>
                {ev.status ?? "draft"}
              </MiniPill>
              {ev.is_featured && <MiniPill tone="brand">Featured</MiniPill>}
              {ev.is_landmark && <MiniPill tone="amber">Landmark</MiniPill>}
              {ev.is_sponsored && <MiniPill tone="violet">Sponsored</MiniPill>}
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {ev.title}
            </h1>
            {ev.description && (
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
                {ev.description}
              </p>
            )}
          </div>

          {/* Quick actions */}
          <EventDetailActions
            id={id}
            status={ev.status ?? "draft"}
            isFeatured={ev.is_featured ?? false}
            slug={ev.slug ?? id}
          />
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event details */}
          <SectionBlock title="Event details" subtitle="Core metadata">
            <DataRow label="Category" value={category} />
            <DataRow label="Slug" value={<span className="font-mono text-xs">{ev.slug ?? "—"}</span>} />
            <DataRow label="Start" value={formatDate(ev.start_datetime, true)} />
            <DataRow label="End" value={formatDate(ev.end_datetime, true)} />
            <DataRow
              label="Location"
              value={
                [ev.location_name, ev.location_address, ev.location_city]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <DataRow label="Created" value={formatDate(ev.created_at)} />
            <DataRow label="Last updated" value={formatDate(ev.updated_at)} />
          </SectionBlock>

          {/* Organizer */}
          <SectionBlock title="Organizer" subtitle="Event owner">
            <DataRow label="Name" value={organizerName} />
            <DataRow label="Email" value={organizer?.email ?? "—"} />
            <DataRow label="City" value={organizer?.location_city ?? "—"} />
            <DataRow
              label="Profile"
              value={
                organizer ? (
                  <Link
                    href={`/users/${organizer.id}`}
                    className="text-[var(--accent-cyan)] hover:underline"
                  >
                    View lens →
                  </Link>
                ) : (
                  "—"
                )
              }
            />
          </SectionBlock>
        </div>

        {/* Ticket sales */}
        <SectionBlock
          title="Ticket sales"
          subtitle={`${ev.tickets_sold ?? 0} sold of ${ev.total_capacity ?? "∞"} total capacity`}
        >
          {/* Progress bar */}
          {ev.total_capacity && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>{soldPct}% sold</span>
                <span>{ev.tickets_sold ?? 0} / {ev.total_capacity}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${Math.min(soldPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Ticket types */}
          {(ticketTypes ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Type", "Price (GHS)", "Capacity", "Sold"].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {(ticketTypes ?? []).map((tt: any) => (
                    <tr key={tt.id}>
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                        {tt.name}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {tt.price != null
                          ? Number(tt.price).toLocaleString("en-GH", {
                              minimumFractionDigits: 2,
                            })
                          : "Free"}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {tt.capacity ?? "∞"}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {tt.sold_count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              No ticket types configured.
            </p>
          )}

          {/* View all tickets link */}
          {(ev.tickets_sold ?? 0) > 0 && (
            <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
              <Link
                href={`/tickets?q=${encodeURIComponent(ev.title)}`}
                className="text-sm text-[var(--accent-cyan)] hover:underline"
              >
                View all tickets for this event →
              </Link>
            </div>
          )}
        </SectionBlock>
      </div>
    </DashboardShell>
  )
}
