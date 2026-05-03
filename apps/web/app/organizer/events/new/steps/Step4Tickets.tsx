"use client";

import { useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { useWizard } from "../WizardContext";
import type { TicketTypeInput } from "../WizardContext";
import { DateTimePicker } from "../../../../../components/ui/DateTimePicker";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

type TicketFormState = {
  name: string;
  price: string;
  capacity: string;
  saleStartsAt: string;
  saleEndsAt: string;
};

const emptyForm: TicketFormState = {
  name: "",
  price: "0",
  capacity: "",
  saleStartsAt: "",
  saleEndsAt: "",
};

export function Step4Tickets() {
  const { state, dispatch } = useWizard();
  const [showForm, setShowForm] = useState(state.ticketTypes.length === 0);
  const [form, setForm] = useState<TicketFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  function addTicket() {
    if (!form.name.trim()) return;
    const ticket: TicketTypeInput = {
      id: editingId ?? generateId(),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      capacity: form.capacity ? Number(form.capacity) : null,
      saleStartsAt: form.saleStartsAt || null,
      saleEndsAt: form.saleEndsAt || null,
    };
    if (editingId) {
      dispatch({ type: "UPDATE_TICKET", id: editingId, ticket });
      setEditingId(null);
    } else {
      dispatch({ type: "ADD_TICKET", ticket });
    }
    setForm(emptyForm);
    setShowForm(false);
  }

  function startEdit(t: TicketTypeInput) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      price: String(t.price),
      capacity: t.capacity != null ? String(t.capacity) : "",
      saleStartsAt: t.saleStartsAt ?? "",
      saleEndsAt: t.saleEndsAt ?? "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {state.ticketTypes.length > 0 && (
        <div className="space-y-3">
          {state.ticketTypes.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                  {t.price === 0 ? "Free" : `GHS ${t.price.toLocaleString()}`}
                  {t.capacity ? ` · ${t.capacity} capacity` : " · Open capacity"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  type="button"
                  onClick={() => startEdit(t)}
                >
                  Edit
                </button>
                <button
                  className="rounded-full p-1.5 text-[var(--text-tertiary)] hover:text-rose-400"
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_TICKET", id: t.id })}
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-[20px] border border-[var(--brand)]/25 bg-[var(--bg-elevated)] p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            {editingId ? "Edit tier" : "New ticket tier"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Tier name
              </label>
              <input
                className="mt-1.5 w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                placeholder="e.g. General, VIP, Early Bird"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Price (GHS) — 0 for free
              </label>
              <input
                className="mt-1.5 w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none"
                min="0"
                placeholder="0"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Capacity (leave blank for unlimited)
              </label>
              <input
                className="mt-1.5 w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none"
                min="1"
                placeholder="Unlimited"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <DateTimePicker
              label="Sale opens (optional)"
              placeholder="When does sale open?"
              value={form.saleStartsAt}
              onChange={(val) => setForm({ ...form, saleStartsAt: val })}
              showTime
            />
            <DateTimePicker
              label="Sale closes (optional)"
              placeholder="When does sale close?"
              value={form.saleEndsAt}
              onChange={(val) => setForm({ ...form, saleEndsAt: val })}
              minDate={form.saleStartsAt || undefined}
              showTime
            />
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] disabled:opacity-40"
              disabled={!form.name.trim()}
              type="button"
              onClick={addTicket}
            >
              {editingId ? "Save changes" : "Add tier"}
            </button>
            <button
              className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] py-4 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
          type="button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Add ticket tier
        </button>
      )}

      {state.ticketTypes.length === 0 && !showForm && (
        <p className="text-center text-[12px] text-[var(--text-tertiary)]">
          Add at least one ticket tier to continue.
        </p>
      )}
    </div>
  );
}
