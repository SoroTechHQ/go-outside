import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, SectionBlock } from "../dashboard-primitives";
import { AdminTableControls } from "../AdminTableControls";
import { AdminPagination } from "../AdminPagination";
import { EventsDataTable, type EventRow } from "../events/EventsDataTable";

const SORT_OPTIONS = [
  { label: "Date created", value: "created_at" },
  { label: "Event date", value: "start_datetime" },
  { label: "Tickets sold", value: "tickets_sold" },
  { label: "Title A–Z", value: "title" },
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
  }

  return (
    <DashboardShell mode="admin" subtitle="Review, approve and feature events." title="Events">
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <MetricTile accent="brand" label="Live events" meta="Currently published and discoverable" trend="Published" value={String(live ?? 0)} />
          <MetricTile accent="amber" label="Draft events" meta="Awaiting organizer submission or admin approval" trend="Draft" value={String(draft ?? 0)} />
          <MetricTile accent="coral" label="Cancelled events" meta="Events that have been cancelled" trend="Cancelled" value={String(cancelled ?? 0)} />
        </div>

        <SectionBlock subtitle="Click a column header to sort. Select rows for bulk actions." title="Event index">
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? "asc" : "desc", sort2, order2: order2 ? "asc" : "desc", regex }}
            searchPlaceholder="Search title or slug…"
          />
          <EventsDataTable events={eventsData} searchQuery={q} />
          <AdminPagination total={total} page={page} limit={limit} currentParams={currentParams} />
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
