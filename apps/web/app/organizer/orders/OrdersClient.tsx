"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  DownloadSimple,
  FunnelSimple,
  MagnifyingGlass,
  Ticket,
  XCircle,
} from "@phosphor-icons/react";

type Order = {
  id: string;
  status: string;
  purchase_price: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  created_at: string;
  events: { id: string; title: string; slug: string } | null;
  ticket_types: { name: string; price: number } | null;
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20",
  pending:   "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-500 border border-red-500/20",
  refunded:  "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(n: number | null) {
  if (!n || n === 0) return "Free";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.attendee_name?.toLowerCase().includes(q) ||
          o.attendee_email?.toLowerCase().includes(q) ||
          o.events?.title.toLowerCase().includes(q) ||
          o.ticket_types?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter]);

  const totalRevenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((s, o) => s + Number(o.purchase_price ?? 0), 0);

  const STATUS_OPTIONS = ["all", "confirmed", "pending", "cancelled", "refunded"];

  const exportCsv = useCallback(() => {
    const rows = filtered.map((o) => ({
      "Order ID": o.id,
      "Event": o.events?.title ?? "",
      "Attendee Name": o.attendee_name ?? "",
      "Attendee Email": o.attendee_email ?? "",
      "Ticket Type": o.ticket_types?.name ?? "General",
      "Price (GHS)": o.purchase_price ?? 0,
      "Status": o.status,
      "Date": new Date(o.created_at).toLocaleDateString("en-GH"),
    }));
    const header = Object.keys(rows[0] ?? {}).join(",");
    const body = rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gooutside-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="p-5 md:p-7 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Orders</p>
        <h1 className="mt-0.5 text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">Ticket orders</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">All ticket purchases across your events.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total orders", value: orders.length.toLocaleString(), color: "#2f8f45" },
          { label: "Confirmed", value: orders.filter((o) => o.status === "confirmed").length.toLocaleString(), color: "#3b82f6" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending").length.toLocaleString(), color: "#f59e0b" },
          { label: "Total revenue", value: formatMoney(totalRevenue), color: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_2px_10px_rgba(5,12,8,0.05)]">
            <p className="text-[1.5rem] font-bold tabular-nums tracking-tight text-[var(--text-primary)]" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + export */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            className="w-56 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2 pl-8 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
            placeholder="Search attendees, events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <FunnelSimple size={14} className="text-[var(--text-tertiary)]" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-[var(--brand)] text-white"
                  : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="ml-auto flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] disabled:opacity-40"
        >
          <DownloadSimple size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  {["Attendee", "Event / Ticket", "Status", "Price", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-[var(--bg-elevated)] transition"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{order.attendee_name || "—"}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{order.attendee_email || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{order.events?.title || "—"}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{order.ticket_types?.name || "General"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}>
                        {order.status === "confirmed" ? <CheckCircle size={11} weight="fill" /> : <XCircle size={11} weight="fill" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatMoney(order.purchase_price)}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--text-tertiary)]">
                      {formatDate(order.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <Ticket size={40} weight="thin" className="text-[var(--text-tertiary)]" />
          <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
            {search || statusFilter !== "all" ? "No orders match your filters" : "No orders yet"}
          </p>
          <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
            Orders will appear here once attendees start buying tickets.
          </p>
        </div>
      )}
    </div>
  );
}
