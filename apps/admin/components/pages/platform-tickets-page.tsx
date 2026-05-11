import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, PageGuide, SectionBlock } from "../dashboard-primitives";
import { TicketCsvExport } from "../tickets/TicketCsvExport";
import { AdminTableControls } from "../AdminTableControls";
import { AdminPagination } from "../AdminPagination";
import { TicketsDataTable } from "../tickets/TicketsDataTable";

const SORT_OPTIONS = [
  { label: "Date issued", value: "created_at" },
  { label: "Price (highest)", value: "purchase_price" },
  { label: "Status", value: "status" },
  { label: "Attendee name", value: "attendee_name" },
]

function ticketStatusTone(status: string | null): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "active" || status === "used") return "brand";
  if (status === "refunded") return "cyan";
  if (status === "cancelled") return "coral";
  return "amber";
}

function fmtGHS(n: number | null) {
  return `GHS ${(n ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type TicketRow = {
  id: string;
  status: string | null;
  purchase_price: number | null;
  checked_in_at: string | null;
  created_at: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  event: { title: string } | null;
  ticket_type: { name: string } | null;
};

type Props = { searchParams: Record<string, string> }

export async function PlatformTicketsPage({ searchParams }: Props) {
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

  // KPI counts
  const [{ count: total }, { count: checkedIn }, { count: refunded }] = await Promise.all([
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }).eq("status", "refunded"),
  ]);

  // Build paginated query
  let query = supabaseAdmin
    .from("tickets")
    .select(
      `id, status, purchase_price, checked_in_at, created_at, attendee_name, attendee_email,
       event:events!tickets_event_id_fkey(title),
       ticket_type:ticket_types!tickets_ticket_type_id_fkey(name)`,
      { count: "exact" }
    )

  if (q) {
    if (regex) {
      query = query.filter("attendee_email", "imatch", q)
    } else {
      query = query.or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%`)
    }
  }

  let ticketsQuery = query.order(sort, { ascending: order })
  if (sort2) ticketsQuery = ticketsQuery.order(sort2, { ascending: order2 })
  const { data: tickets, count: filteredCount } = await ticketsQuery.range(offset, offset + limit - 1)

  const rows = (tickets ?? []) as unknown as TicketRow[]
  const filteredTotal = filteredCount ?? 0

  const currentParams: Record<string, string> = {
    ...(q && { q }),
    limit: String(limit),
    sort,
    order: order ? "asc" : "desc",
    ...(sort2 && { sort2, order2: order2 ? "asc" : "desc" }),
    ...(regex && { regex: "1" }),
  }

  return (
    <DashboardShell mode="admin" title="Tickets" subtitle="All issued tickets, check-ins and refunds.">
      <div className="space-y-6">
        <PageGuide
          title="Manage tickets across all events"
          tips={[
            "Each row is a ticket purchase — the status shows whether it's active, checked-in, or refunded.",
            "Click Refund on any active ticket to process a refund for an attendee.",
            "Use the CSV Export button to download the current page for reconciliation or reporting.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <MetricTile accent="brand" label="Total tickets" value={String(total ?? 0)} trend="Issued" meta="All tickets ever created" />
          <MetricTile accent="cyan" label="Checked in" value={String(checkedIn ?? 0)} trend="Attended" meta="Scanned at entry" />
          <MetricTile accent="coral" label="Refunded" value={String(refunded ?? 0)} trend="Refunds" meta="Tickets marked refunded" />
        </div>

        <SectionBlock
          title="Ticket index"
          subtitle="Click a column header to sort. Use ••• to refund."
          action={<TicketCsvExport tickets={rows} />}
        >
          <AdminTableControls
            sortOptions={SORT_OPTIONS}
            currentParams={{ q, limit: String(limit), sort, order: order ? "asc" : "desc", sort2, order2: order2 ? "asc" : "desc", regex }}
            searchPlaceholder="Search attendee name or email…"
          />
          <TicketsDataTable tickets={rows as any} searchQuery={q} />
          <AdminPagination total={filteredTotal} page={page} limit={limit} currentParams={currentParams} />
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
