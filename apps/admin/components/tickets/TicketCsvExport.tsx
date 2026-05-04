"use client";

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

export function TicketCsvExport({ tickets }: { tickets: TicketRow[] }) {
  function handleExport() {
    const headers = ["ID", "Attendee", "Email", "Event", "Ticket Type", "Price (GHS)", "Status", "Checked In", "Created"];
    const rows = tickets.map((t) => [
      t.id,
      t.attendee_name ?? "",
      t.attendee_email ?? "",
      t.event?.title ?? "",
      t.ticket_type?.name ?? "",
      t.purchase_price?.toFixed(2) ?? "0.00",
      t.status ?? "",
      t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-GH") : "",
      t.created_at ? new Date(t.created_at).toLocaleDateString("en-GH") : "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
    >
      Export CSV
    </button>
  );
}
