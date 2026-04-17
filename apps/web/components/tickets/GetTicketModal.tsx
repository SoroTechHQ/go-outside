"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  MapPin,
  CalendarBlank,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle,
  ArrowRight,
  Clock,
  Tag,
} from "@phosphor-icons/react";
import { useCart, type TicketTier } from "../cart/CartContext";
import { useRouter } from "next/navigation";

export type EventForTicket = {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue: string;
  city?: string;
  imageUrl?: string;
  organizer: string;
  ticketTypes: TicketTier[];
};

type Step = "select" | "added";

type GetTicketModalProps = {
  event: EventForTicket;
  onClose: () => void;
};

function formatPrice(price: number, type: TicketTier["priceType"]) {
  if (type === "free") return "Free";
  return `GHS ${price.toLocaleString()}`;
}

export function GetTicketModal({ event, onClose }: GetTicketModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(
    event.ticketTypes[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();

  const maxQty = selectedTier?.maxPerUser ?? 10;
  const subtotal = selectedTier
    ? selectedTier.priceType === "free"
      ? 0
      : selectedTier.price * quantity
    : 0;

  function handleAddToCart() {
    if (!selectedTier) return;
    addItem({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue,
      eventImage: event.imageUrl,
      tier: selectedTier,
      quantity,
    });
    setStep("added");
  }

  function handleCheckout() {
    onClose();
    router.push("/dashboard/checkout");
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center md:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl md:rounded-3xl bg-[var(--bg-card)] shadow-2xl"
        exit={{ opacity: 0, y: 40 }}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-[var(--text-primary)]">
              {step === "added" ? "Added to cart!" : "Get Tickets"}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)] truncate max-w-[260px]">
              {event.title}
            </p>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-alt)] active:scale-95"
            onClick={onClose}
            type="button"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div
              key="select"
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              {/* Event info strip */}
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3">
                {event.imageUrl && (
                  <img
                    alt={event.title}
                    className="h-12 w-12 rounded-xl object-cover shrink-0"
                    src={event.imageUrl}
                  />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                    <CalendarBlank size={11} weight="fill" />
                    <span>{event.date}{event.time ? ` · ${event.time}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                    <MapPin size={11} weight="fill" />
                    <span className="truncate">{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2.5 py-1">
                  <ShieldCheck size={11} className="text-[var(--brand)]" weight="fill" />
                  <span className="text-[11px] font-semibold text-[var(--brand)]">Secure</span>
                </div>
              </div>

              {/* Ticket tiers */}
              <div className="px-5 py-4 space-y-2.5 max-h-[280px] overflow-y-auto">
                <p className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                  Ticket Types
                </p>
                {event.ticketTypes.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id;
                  const isSoldOut = tier.remaining !== undefined && tier.remaining === 0;
                  return (
                    <button
                      key={tier.id}
                      disabled={isSoldOut}
                      onClick={() => { setSelectedTier(tier); setQuantity(1); }}
                      type="button"
                      className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                        isSoldOut
                          ? "opacity-40 cursor-not-allowed border-[var(--border-subtle)]"
                          : isSelected
                          ? "border-[var(--brand)] bg-[var(--brand-dim)]"
                          : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                            {tier.name}
                          </p>
                          {tier.description && (
                            <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)] line-clamp-2">
                              {tier.description}
                            </p>
                          )}
                          {tier.remaining !== undefined && tier.remaining > 0 && tier.remaining <= 20 && (
                            <p className="mt-1 text-[11px] font-medium text-amber-600">
                              Only {tier.remaining} left
                            </p>
                          )}
                          {isSoldOut && (
                            <p className="mt-1 text-[11px] font-medium text-red-500">Sold out</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-[15px] font-bold text-[var(--text-primary)]">
                            {formatPrice(tier.price, tier.priceType)}
                          </p>
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "border-[var(--brand)] bg-[var(--brand)]"
                                : "border-[var(--border-default)]"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle size={12} weight="fill" className="text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quantity selector */}
              {selectedTier && (
                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Quantity</p>
                    {selectedTier.maxPerUser && (
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Max {selectedTier.maxPerUser} per person
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      type="button"
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-6 text-center text-[16px] font-bold text-[var(--text-primary)]">
                      {quantity}
                    </span>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                      disabled={quantity >= maxQty}
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      type="button"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-[var(--border-subtle)] px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[12px] text-[var(--text-tertiary)]">Subtotal</p>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">
                      {selectedTier?.priceType === "free" ? "Free" : `GHS ${subtotal.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                    <Tag size={12} weight="fill" />
                    <span>No hidden fees</span>
                  </div>
                </div>
                <button
                  className="w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] disabled:opacity-50"
                  disabled={!selectedTier}
                  onClick={handleAddToCart}
                  type="button"
                >
                  Add to Cart · {quantity} {quantity === 1 ? "ticket" : "tickets"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="added"
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-8 text-center"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0, y: 16 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-dim)]">
                <CheckCircle size={36} weight="fill" className="text-[var(--brand)]" />
              </div>
              <h3 className="text-[18px] font-bold text-[var(--text-primary)]">
                {quantity} {selectedTier?.name} {quantity === 1 ? "ticket" : "tickets"} added
              </h3>
              <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">
                {event.title}
              </p>

              <div className="mt-6 space-y-2.5">
                <button
                  className="w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                  type="button"
                >
                  Go to Checkout
                  <ArrowRight size={16} weight="bold" />
                </button>
                <button
                  className="w-full rounded-2xl border border-[var(--border-default)] py-3.5 text-[15px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)] active:scale-[0.98]"
                  onClick={onClose}
                  type="button"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
