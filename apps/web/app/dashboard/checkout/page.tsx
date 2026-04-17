"use client";

import { useState } from "react";
import { useCart } from "../../../components/cart/CartContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarBlank,
  Ticket,
  Lock,
  Tag,
  User,
  EnvelopeSimple,
  Phone,
} from "@phosphor-icons/react";
import { Progress } from "../../../components/ui/progress";

export default function CheckoutPage() {
  const { items, totalPrice, totalCount, clearCart } = useCart();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const discount = promoApplied ? Math.floor(totalPrice * 0.1) : 0;
  const finalTotal = totalPrice - discount;

  function handleApplyPromo() {
    if (promoCode.toLowerCase() === "gooutside10") {
      setPromoApplied(true);
    }
  }

  function handleProceedToPayment() {
    if (!form.name || !form.email) return;
    router.push("/dashboard/checkout/payment");
  }

  if (items.length === 0) {
    return (
      <main className="page-grid min-h-screen pb-24">
        <div className="container-shell flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Ticket size={48} className="text-[var(--text-tertiary)]" weight="light" />
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Your cart is empty</h1>
          <p className="text-[var(--text-tertiary)]">Browse events and add tickets to checkout.</p>
          <button
            className="mt-2 rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
            onClick={() => router.push("/")}
            type="button"
          >
            Browse Events
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 py-6 md:py-10">
        {/* Back + Progress */}
        <div className="mx-auto max-w-2xl">
          <button
            className="mb-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
            Back
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Checkout</h1>
              <span className="text-[13px] text-[var(--text-tertiary)]">Step 1 of 2</span>
            </div>
            <Progress value={50} className="h-1.5" />
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_340px]">
            {/* Left: contact info */}
            <div className="space-y-5">
              {/* Contact details */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h2 className="mb-4 text-[15px] font-bold text-[var(--text-primary)]">
                  Contact Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                      Full Name *
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                      <User size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Kofi Mensah"
                        type="text"
                        value={form.name}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                      Email Address *
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                      <EnvelopeSimple size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="kofi@example.com"
                        type="email"
                        value={form.email}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                      <Phone size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+233 24 000 0000"
                        type="tel"
                        value={form.phone}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo code */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h2 className="mb-3 text-[15px] font-bold text-[var(--text-primary)]">Promo Code</h2>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                    <Tag size={15} className="text-[var(--text-tertiary)] shrink-0" />
                    <input
                      className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] uppercase"
                      disabled={promoApplied}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="GOOUTSIDE10"
                      type="text"
                      value={promoCode}
                    />
                  </div>
                  <button
                    className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${
                      promoApplied
                        ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                        : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                    }`}
                    disabled={promoApplied}
                    onClick={handleApplyPromo}
                    type="button"
                  >
                    {promoApplied ? "Applied ✓" : "Apply"}
                  </button>
                </div>
                {promoApplied && (
                  <p className="mt-2 text-[12px] text-[var(--brand)]">
                    10% discount applied! You saved GHS {discount.toLocaleString()}.
                  </p>
                )}
              </div>
            </div>

            {/* Right: order summary */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sticky top-4">
                <h2 className="mb-4 text-[15px] font-bold text-[var(--text-primary)]">Order Summary</h2>

                <div className="space-y-3 divide-y divide-[var(--border-subtle)]">
                  {items.map((item) => (
                    <div key={`${item.eventId}-${item.tier.id}`} className="pt-3 first:pt-0">
                      {item.eventImage && (
                        <img
                          alt={item.eventTitle}
                          className="mb-2.5 h-28 w-full rounded-xl object-cover"
                          src={item.eventImage}
                        />
                      )}
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                        {item.eventTitle}
                      </p>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                          <CalendarBlank size={11} weight="fill" />
                          {item.eventDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                          <MapPin size={11} weight="fill" />
                          {item.eventVenue}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] text-[var(--text-tertiary)]">
                          {item.tier.name} × {item.quantity}
                        </span>
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {item.tier.priceType === "free"
                            ? "Free"
                            : `GHS ${(item.tier.price * item.quantity).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-[var(--border-subtle)] pt-4">
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Subtotal ({totalCount} tickets)</span>
                    <span>GHS {totalPrice.toLocaleString()}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-[13px] text-[var(--brand)]">
                      <span>Discount (10%)</span>
                      <span>-GHS {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Processing fee</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-[16px] font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span>{finalTotal === 0 ? "Free" : `GHS ${finalTotal.toLocaleString()}`}</span>
                  </div>
                </div>

                <button
                  className="mt-4 w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={!form.name || !form.email}
                  onClick={handleProceedToPayment}
                  type="button"
                >
                  <Lock size={15} weight="bold" />
                  Proceed to Payment
                </button>

                <p className="mt-3 text-center text-[11px] text-[var(--text-tertiary)]">
                  Secured by Paystack · 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
