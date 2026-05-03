"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Trash,
} from "@phosphor-icons/react";
import { useCart } from "../../components/cart/CartContext";

export default function CartPage() {
  const router = useRouter();
  const { items, totalCount, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main className="page-grid min-h-screen pb-24">
        <div className="container-shell flex flex-col items-center justify-center gap-5 py-28 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--bg-card)] shadow-sm">
            <ShoppingCart size={36} className="text-[var(--text-tertiary)]" weight="light" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Your cart is empty</h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
              Browse events and add tickets to get started.
            </p>
          </div>
          <Link
            href="/home"
            className="mt-1 rounded-2xl bg-[var(--brand)] px-7 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
          >
            Browse Events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 py-6 md:py-10">
        <div className="mx-auto max-w-4xl">
          {/* Back */}
          <button
            className="mb-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
            Back
          </button>

          {/* Title row */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
                Your Cart
              </h1>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[12px] font-bold text-white">
                {totalCount}
              </span>
            </div>
            <button
              className="text-[13px] font-medium text-[var(--text-tertiary)] transition hover:text-red-500"
              onClick={clearCart}
              type="button"
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Cart items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.eventId}-${item.tier.id}`}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex gap-4">
                    {item.eventImage && (
                      <img
                        alt={item.eventTitle}
                        className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                        src={item.eventImage}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
                          {item.eventTitle}
                        </p>
                        <button
                          className="shrink-0 text-[var(--text-tertiary)] transition hover:text-red-500"
                          onClick={() => removeItem(item.eventId, item.tier.id)}
                          title="Remove"
                          type="button"
                        >
                          <Trash size={15} />
                        </button>
                      </div>

                      <p className="mt-0.5 text-[12px] font-medium text-[var(--brand)]">
                        {item.tier.name}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {item.eventDate && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                            <CalendarBlank size={11} weight="fill" />
                            {item.eventDate}
                          </span>
                        )}
                        {item.eventVenue && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                            <MapPin size={11} weight="fill" />
                            {item.eventVenue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity + price */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity - 1)}
                        type="button"
                      >
                        <Minus size={12} weight="bold" />
                      </button>
                      <span className="w-6 text-center text-[15px] font-bold text-[var(--text-primary)]">
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                        onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity + 1)}
                        type="button"
                      >
                        <Plus size={12} weight="bold" />
                      </button>
                    </div>
                    <p className="text-[16px] font-bold text-[var(--text-primary)]">
                      {item.tier.priceType === "free"
                        ? "Free"
                        : `GHS ${(item.tier.price * item.quantity).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h2 className="mb-4 text-[16px] font-bold text-[var(--text-primary)]">
                  Order Summary
                </h2>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Subtotal ({totalCount} ticket{totalCount !== 1 ? "s" : ""})</span>
                    <span>{totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Processing fee</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5 text-[17px] font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span>{totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}</span>
                  </div>
                </div>

                <button
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
                  onClick={() => router.push("/dashboard/checkout")}
                  type="button"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} weight="bold" />
                </button>

                <p className="mt-3 text-center text-[11px] text-[var(--text-tertiary)]">
                  Secured by Paystack · 256-bit SSL
                </p>

                <Link
                  href="/home"
                  className="mt-3 block text-center text-[13px] font-medium text-[var(--brand)] transition hover:opacity-70"
                >
                  Continue browsing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
