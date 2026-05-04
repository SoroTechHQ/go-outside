import { supabaseAdmin } from "../../lib/supabase";
import { DashboardShell } from "../dashboard-shell";
import { MetricTile, MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";
import { TicketCsvExport } from "../tickets/TicketCsvExport";
import { RefundButton } from "../tickets/RefundButton";

function ticketStatusTone(status: string | null): "brand" | "amber" | "coral" | "cyan" | "violet" {
  if (status === "active" || status === "used") return "brand";
  if (status === "refunded") return "cyan";
  if (status === "cancelled") return "coral";
  return "amber";
}

function fmtGHS(n: number | null) {
  return `GHS ${(n ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function PlatformTicketsPage() {
  const [{ count: total }, { count: checkedIn }, { count: refunded }] = await Promise.all([
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
    supabaseAdmin.from("tickets").select("id", { count: "exact", head: true }).eq("status", "refunded"),
  ]);

  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select(`
      id, status, purchase_price, checked_in_at, created_at, attendee_name, attendee_email,
      event:events!tickets_event_id_fkey(title),
      ticket_type:ticket_types!tickets_ticket_type_id_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (tickets ?? []) as unknown as {
    id: string;
    status: string | null;
    purchase_price: number | null;
    checked_in_at: string | null;
    created_at: string | null;
    attendee_name: string | null;
    attendee_email: string | null;
    event: { title: string } | null;
    ticket_type: { name: string } | null;
  }[];

  const notRefunded = rows.filter((t) => t.status !== "refunded");

  return (
    <DashboardShell mode="admin" title="Tickets" subtitle="All issued tickets, check-ins and refunds.">
      <div className="space-y-6">
        <PageHero
          eyebrow="Platform Ops"
          title="Tickets"
          description="All issued tickets, check-ins and refunds."
        />

        {/* KPI Row */}
        <div className="grid gap-5 sm:grid-cols-3">
          <MetricTile
            accent="brand"
            label="Total tickets"
            value={String(total ?? 0)}
            trend="Issued"
            meta="All tickets ever created"
          />
          <MetricTile
            accent="cyan"
            label="Checked in"
            value={String(checkedIn ?? 0)}
            trend="Attended"
            meta="Scanned at entry"
          />
          <MetricTile
            accent="coral"
            label="Refunded"
            value={String(refunded ?? 0)}
            trend="Refunds"
            meta="Tickets marked refunded"
          />
        </div>

        {/* Table */}
        <SectionBlock
          title="Ticket index"
          subtitle="Last 100 tickets by issue date"
          action={<TicketCsvExport tickets={rows} />}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Attendee", "Event", "Type", "Price", "Status", "Checked In", "Issued", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)] pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {rows.map((ticket) => {
                  const attendee =
                    ticket.attendee_name?.trim() || ticket.attendee_email || "—";
                  const canRefund = ticket.status !== "refunded" && ticket.status !== "cancelled";
                  return (
                    <tr key={ticket.id}>
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{attendee}</td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{ticket.event?.title ?? "—"}</td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">{ticket.ticket_type?.name ?? "—"}</td>
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">
                        {fmtGHS(ticket.purchase_price)}
                      </td>
                      <td className="py-3 pr-4">
                        <MiniPill tone={ticketStatusTone(ticket.status)}>
                          {ticket.status ?? "unknown"}
                        </MiniPill>
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-tertiary)]">
                        {ticket.checked_in_at
                          ? new Date(ticket.checked_in_at).toLocaleString("en-GH")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-tertiary)]">
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString("en-GH")
                          : "—"}
                      </td>
                      <td className="py-3">
                        {canRefund ? <RefundButton ticketId={ticket.id} /> : null}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionBlock>
      </div>
    </DashboardShell>
  );
}
