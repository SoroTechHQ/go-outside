"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  DotsThree,
  MinusCircle,
  PencilSimple,
  PlusCircle,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Trash,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";

type TicketType = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  price_type: string;
  currency: string;
  quantity_total: number | null;
  quantity_sold: number;
  max_per_user: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  is_active: boolean;
  sort_order: number;
};

type NewTicketForm = {
  name: string;
  description: string;
  price: string;
  isFree: boolean;
  quantity: string;
  maxPerUser: string;
  saleStartsAt: string;
  saleEndsAt: string;
};

const EMPTY_FORM: NewTicketForm = {
  name: "",
  description: "",
  price: "",
  isFree: false,
  quantity: "",
  maxPerUser: "",
  saleStartsAt: "",
  saleEndsAt: "",
};

function formatMoney(n: number) {
  if (n === 0) return "Free";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function TicketForm({
  eventId,
  initial,
  onSave,
  onCancel,
}: {
  eventId: string;
  initial?: Partial<NewTicketForm>;
  onSave: (t: TicketType) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NewTicketForm>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof NewTicketForm>(k: K, v: NewTicketForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Ticket name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const body = {
        eventId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.isFree ? 0 : form.price ? Number(form.price) : 0,
        priceType: form.isFree ? "free" : "paid",
        quantityTotal: form.quantity ? Number(form.quantity) : null,
        maxPerUser: form.maxPerUser ? Number(form.maxPerUser) : null,
        saleStartsAt: form.saleStartsAt || null,
        saleEndsAt: form.saleEndsAt || null,
      };
      const res = await fetch("/api/organizer/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create ticket type");
      const data = await res.json() as TicketType;
      onSave(data);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[18px] border border-[var(--brand)]/25 bg-[var(--bg-elevated)] p-5 shadow-[0_4px_20px_rgba(47,143,69,0.08)]"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">New ticket tier</p>
        <button type="button" onClick={onCancel} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Ticket name</label>
          <input
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
            placeholder="e.g. General Admission, VIP, Early Bird"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Description <span className="font-normal text-[var(--text-tertiary)]">(optional)</span></label>
          <textarea
            className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
            placeholder="What's included with this ticket?"
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {/* Price */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Price</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[var(--text-tertiary)]">GHS</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2.5 pl-10 pr-3 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none disabled:opacity-50"
                disabled={form.isFree}
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => { set("isFree", !form.isFree); if (!form.isFree) set("price", ""); }}
              className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              {form.isFree ? <ToggleRight size={15} weight="fill" className="text-[var(--brand)]" /> : <ToggleLeft size={15} />}
              Free ticket
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Quantity</label>
            <input
              type="number"
              min="1"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="Unlimited"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </div>
        </div>

        {/* Max per user + sale dates */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Max per person</label>
            <input
              type="number"
              min="1"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="—"
              value={form.maxPerUser}
              onChange={(e) => set("maxPerUser", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Sale starts</label>
            <input
              type="datetime-local"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none"
              value={form.saleStartsAt}
              onChange={(e) => set("saleStartsAt", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Sale ends</label>
            <input
              type="datetime-local"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[11px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none"
              value={form.saleEndsAt}
              onChange={(e) => set("saleEndsAt", e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-[12px] text-red-500">{error}</p>}

      <div className="mt-5 flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
          Cancel
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(47,143,69,0.2)] transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle size={13} weight="fill" />}
          Save ticket
        </motion.button>
      </div>
    </motion.div>
  );
}

function TicketCard({ ticket, onToggle, onDelete }: { ticket: TicketType; onToggle: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sold = ticket.quantity_sold ?? 0;
  const total = ticket.quantity_total;
  const pct = total ? Math.round((sold / total) * 100) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`relative rounded-[18px] border bg-[var(--bg-elevated)] p-5 transition ${ticket.is_active ? "border-[var(--border-subtle)]" : "border-dashed border-[var(--border-subtle)] opacity-60"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand)]/10">
            <Ticket size={18} weight="fill" className="text-[var(--brand)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{ticket.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ticket.is_active ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"}`}>
                {ticket.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {ticket.description && (
              <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">{ticket.description}</p>
            )}
            <p className="mt-1 text-[13px] font-bold text-[var(--text-primary)]">{formatMoney(Number(ticket.price))}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <DotsThree size={18} weight="bold" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-8 z-10 w-44 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(5,12,8,0.12)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => { onToggle(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <PencilSimple size={13} />
                  {ticket.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 transition hover:bg-red-500/5"
                >
                  <Trash size={13} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sales progress */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          {total ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] mb-1">
                <span>{sold} sold</span>
                <span>{total - sold} left</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--brand)] transition-[width]"
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{pct}% of {total} capacity</p>
            </>
          ) : (
            <p className="text-[12px] text-[var(--text-tertiary)]">{sold} sold · Unlimited capacity</p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0"
        >
          {ticket.is_active ? (
            <ToggleRight size={22} weight="fill" className="text-[var(--brand)]" />
          ) : (
            <ToggleLeft size={22} className="text-[var(--text-tertiary)]" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function TicketsClient({
  eventId,
  initialTicketTypes,
}: {
  eventId: string;
  initialTicketTypes: TicketType[];
}) {
  const [tickets, setTickets] = useState<TicketType[]>(initialTicketTypes);
  const [showForm, setShowForm] = useState(tickets.length === 0);

  async function toggleActive(id: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;
    setTickets((ts) => ts.map((x) => x.id === id ? { ...x, is_active: !x.is_active } : x));
    await fetch(`/api/organizer/ticket-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.is_active }),
    });
  }

  async function deleteTicket(id: string) {
    setTickets((ts) => ts.filter((x) => x.id !== id));
    await fetch(`/api/organizer/ticket-types/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-7 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Step 2</p>
        <h2 className="mt-0.5 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Add tickets</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Create ticket tiers. You can add multiple types — General Admission, VIP, Early Bird, and more.
        </p>
      </div>

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onToggle={() => toggleActive(t.id)}
                onDelete={() => deleteTicket(t.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence mode="wait">
        {showForm ? (
          <TicketForm
            key="form"
            eventId={eventId}
            onSave={(t) => { setTickets((ts) => [...ts, t]); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[var(--border-subtle)] py-5 text-[13px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
          >
            <PlusCircle size={17} weight="fill" className="text-[var(--brand)]/60" />
            Add ticket type
          </motion.button>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {tickets.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-10 text-center">
          <Ticket size={36} weight="thin" className="text-[var(--text-tertiary)]" />
          <p className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">No tickets yet</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Add your first ticket tier to start selling.</p>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
        <Link
          href={`/organizer/events/${eventId}/details`}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={14} weight="bold" /> Details
        </Link>
        <Link
          href={`/organizer/events/${eventId}/publish`}
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.2)] transition hover:opacity-90"
        >
          Next: Publish <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
