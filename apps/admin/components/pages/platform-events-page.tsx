import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, SectionBlock, AvatarStack } from "../dashboard-primitives";
import { AdminTableControls } from "../AdminTableControls";
import { AdminPagination } from "../AdminPagination";
import { EventsDataTable, type EventRow } from "../events/EventsDataTable";
import { EventActionsRow } from "../EventActionsRow";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "published") return "brand";
  if (status === "draft") return "amber";
  if (status === "cancelled") return "coral";
  return "cyan";
}

const SORT_OPTIONS = [
  { label: "Date created", value: "created_at" },
  { label: "Event date", value: "start_datetime" },
  { label: "Tickets sold", value: "tickets_sold" },
  { label: "Title A–Z", value: "title" },
]

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Live", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Cancelled", value: "cancelled" },
]

type Props = { searchParams: Record<string, string> }

export async function PlatformEventsPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const limit = [25, 50, 100].includes(parseInt(searchParams.limit ?? "", 10))
    ? parseInt(searchParams.limit, 10)
    : 50
  const sort = SORT_OPTIONS.some((o) => o.value === searchParams.sort)
    ? searchParams.sort
    : "created_at"
  const order = searchParams.order === "asc"
  const sort2 = SORT_OPTIONS.some((o) => o.value === searchParams.sort2)
    ? searchParams.sort2
    : ""
  const order2 = searchParams.order2 === "asc"
  const q = searchParams.q?.trim() ?? ""
  const regex = searchParams.regex === "1"
  const statusFilter = STATUS_FILTERS.some((s) => s.value === searchParams.status)
    ? searchParams.status
    : ""
  const offset = (page - 1) * limit

  const [{ count: live }, { count: draft }, { count: cancelled }] = await Promise.all([
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
  ]);

  let query = supabaseAdmin
    .from("events")
    .select(
      `id, title, slug, status, start_datetime, tickets_sold, total_capacity,
       is_featured, is_landmark, is_sponsored,
       categories(name),
       organizer:users!events_organizer_id_fkey(first_name, last_name)`,
      { count: "exact" }
    )

  if (statusFilter) {
    query = query.eq("status", statusFilter)
  }

  if (q) {
    if (regex) {
      query = query.filter("title", "imatch", q)
    } else {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
    }
  }

  let eventsQuery = query.order(sort, { ascending: order })
  if (sort2) eventsQuery = eventsQuery.order(sort2, { ascending: order2 })
  const { data: rawEvents, count: filteredCount } = await eventsQuery.range(offset, offset + limit - 1)

  const eventsData = (rawEvents ?? []) as unknown as EventRow[]
  const total = filteredCount ?? 0

  const currentParams: Record<string, string> = {
    ...(q && { q }),
    limit: String(limit),
    sort,
    order: order ? "asc" : "desc",
    ...(sort2 && { sort2, order2: order2 ? "asc" : "desc" }),
    ...(regex && { regex: "1" }),
    ...(statusFilter && { status: statusFilter }),
  }

  const tableControlParams = {
    q,
    limit: String(limit),
    sort,
    order: order ? "asc" : "desc",
    sort2,
    order2: order2 ? "asc" : "desc",
    regex,
  }

  return (
    <DashboardShell mode="admin" subtitle="Review, approve and feature events." title="Events">
      <div className="space-y-6">
        {/* KPI tiles */}
        <div className="grid gap-5 sm:grid-cols-3">
          <MetricTile accent="brand" label="Live events" meta="Currently published and discoverable" trend="Published" value={String(live ?? 0)} />
          <MetricTile accent="amber" label="Draft events" meta="Awaiting organizer submission or admin approval" trend="Draft" value={String(draft ?? 0)} />
          <MetricTile accent="coral" label="Cancelled events" meta="Events that have been cancelled" trend="Cancelled" value={String(cancelled ?? 0)} />
        </div>

        {/* Events table */}
        <SectionBlock
          subtitle={`${total.toLocaleString()} event${total !== 1 ? "s" : ""} — search, filter, and manage directly from this table.`}
          title="Event index"
        >
          {/* Status filter tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((sf) => {
              const params = new URLSearchParams({ ...currentParams, status: sf.value, page: "1" })
              if (!sf.value) params.delete("status")
              const isActive = statusFilter === sf.value
              return (
                <a
                  key={sf.value || "all"}
                  href={`?${params.toString()}`}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                    isActive
                      ? "bg-[var(--brand)]/15 text-[var(--brand)]"
                      : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {sf.label}
                  {sf.value === "published" && live != null && (
                    <span className="ml-1.5 rounded-full bg-[var(--brand)]/20 px-1.5 py-0.5 text-[10px]">{live}</span>
                  )}
                  {sf.value === "draft" && draft != null && (
                    <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-500">{draft}</span>
                  )}
                  {sf.value === "cancelled" && cancelled != null && (
                    <span className="ml-1.5 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-500">{cancelled}</span>
                  )}
                </a>
              )
            })}
          </div>

          {/* Search + sort controls */}
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={tableControlParams}
            searchPlaceholder="Search by title or slug…"
          />

          {eventsData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No events found matching your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Title", "Organizer", "Category", "Date", "Tickets", "Status", "Actions"].map((heading) => (
                      <th
                        key={heading}
                        className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {eventsData.map((event) => {
                    const organizerName = event.organizer
                      ? [event.organizer.first_name, event.organizer.last_name].filter(Boolean).join(" ") || "Unknown"
                      : "Unknown";
                    const categoryName = event.categories?.name ?? "General";

                    return (
                      <tr key={event.id} className="transition-colors hover:bg-[var(--bg-muted)]/40">
                        {/* Title */}
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)]">{event.title}</span>
                            {event.is_featured && (
                              <MiniPill tone="cyan">Featured</MiniPill>
                            )}
                            {event.is_landmark && (
                              <MiniPill tone="amber">Landmark</MiniPill>
                            )}
                            {event.is_sponsored && (
                              <MiniPill tone="violet">Sponsored</MiniPill>
                            )}
                          </div>
                        </td>

                        {/* Organizer */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <AvatarStack names={[organizerName]} />
                            <span className="font-medium text-[var(--text-primary)]">{organizerName}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{categoryName}</td>

                        {/* Date */}
                        <td className="py-4 pr-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {event.start_datetime ? formatDate(event.start_datetime) : "TBD"}
                        </td>

                        {/* Tickets */}
                        <td className="py-4 pr-4 whitespace-nowrap text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{event.tickets_sold ?? 0}</span>
                          <span className="text-[var(--text-tertiary)]"> / {event.total_capacity ?? "∞"}</span>
                        </td>

                        {/* Status badge */}
                        <td className="py-4 pr-4">
                          <MiniPill tone={statusTone(event.status)}>{event.status}</MiniPill>
                        </td>

                        {/* Actions (client component) */}
                        <td className="py-4">
                          <EventActionsRow
                            id={event.id}
                            slug={event.slug ?? event.id}
                            status={event.status}
                            isFeatured={event.is_featured ?? false}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <AdminPagination
            total={total}
            page={page}
            limit={limit}
            currentParams={currentParams}
          />
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
