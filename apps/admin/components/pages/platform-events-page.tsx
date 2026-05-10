import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { AvatarStack, MetricTile, MiniPill, SectionBlock } from "../dashboard-primitives";
import { EventActionsRow } from "../EventActionsRow";
import { AdminTableControls } from "../AdminTableControls";
import { AdminPagination } from "../AdminPagination";

const SORT_OPTIONS = [
  { label: "Date created", value: "created_at" },
  { label: "Event date", value: "start_datetime" },
  { label: "Tickets sold", value: "tickets_sold" },
  { label: "Title A–Z", value: "title" },
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string): "brand" | "amber" | "coral" | "violet" | "cyan" {
  switch (status) {
    case "published": return "brand";
    case "draft": return "amber";
    case "cancelled": return "coral";
    default: return "violet";
  }
}

type EventRow = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  start_datetime: string | null;
  tickets_sold: number | null;
  total_capacity: number | null;
  is_featured: boolean | null;
  is_landmark: boolean | null;
  is_sponsored: boolean | null;
  categories: { name: string } | null;
  organizer: { first_name: string | null; last_name: string | null } | null;
};

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
  const q = searchParams.q?.trim() ?? ""
  const regex = searchParams.regex === "1"
  const offset = (page - 1) * limit

  // KPI counts
  const [{ count: live }, { count: draft }, { count: cancelled }] = await Promise.all([
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
  ]);

  // Build paginated query
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

  const { data: rawEvents, count: filteredCount } = await query
    .order(sort, { ascending: order })
    .range(offset, offset + limit - 1)

  const eventsData = (rawEvents ?? []) as unknown as EventRow[]
  const total = filteredCount ?? 0

  const currentParams: Record<string, string> = {
    ...(q && { q }),
    limit: String(limit),
    sort,
    order: order ? "asc" : "desc",
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

        <SectionBlock subtitle="All events ordered by creation date — publish or feature directly from this table." title="Event index">
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? "asc" : "desc", regex }}
            searchPlaceholder="Search title or slug…"
          />

          {eventsData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              {q ? `No events matching "${q}".` : "No events found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    {["Title", "Organizer", "Category", "Date", "Tickets", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)] pr-4">
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
                      <tr key={event.id}>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)]">{event.title}</span>
                            {event.is_landmark && <MiniPill tone="amber">Landmark</MiniPill>}
                            {event.is_sponsored && <MiniPill tone="violet">Sponsored</MiniPill>}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <AvatarStack names={[organizerName]} />
                            <span className="font-medium text-[var(--text-primary)]">{organizerName}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{categoryName}</td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{formatDate(event.start_datetime)}</td>
                        <td className="py-4 pr-4 text-[var(--text-secondary)]">{event.tickets_sold ?? 0} / {event.total_capacity ?? "∞"}</td>
                        <td className="py-4 pr-4">
                          <MiniPill tone={statusTone(event.status)}>{event.status}</MiniPill>
                        </td>
                        <td className="py-4">
                          <EventActionsRow id={event.id} slug={event.slug ?? event.id} status={event.status} isFeatured={event.is_featured ?? false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination total={total} page={page} limit={limit} currentParams={currentParams} />
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
