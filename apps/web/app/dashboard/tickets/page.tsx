"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Trash,
  Ticket,
} from "@phosphor-icons/react";
import { useCart } from "../../../components/cart/CartContext";

export default function CartPage() {
  const { items, totalCount, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[2rem] italic leading-none text-[var(--text-primary)]">
            My Cart
          </h1>
          {totalCount > 0 && (
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              {totalCount} ticket{totalCount !== 1 ? "s" : ""} · GHS {totalPrice.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              className="text-[13px] text-[var(--text-tertiary)] transition hover:text-red-500"
              onClick={clearCart}
              type="button"
            >
              Clear all
            </button>
          )}
          <Link
            className="flex items-center gap-2 rounded-full bg-[var(--bg-muted)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            href="/wallets"
          >
            <Ticket size={14} />
            My Tickets
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
            <ShoppingCart size={32} className="text-[var(--brand)]" weight="light" />
          </div>
          <p className="mt-5 text-[18px] font-semibold text-[var(--text-primary)]">
            Your cart is empty
          </p>
          <p className="mt-2 max-w-xs text-[14px] leading-7 text-[var(--text-secondary)]">
            Browse upcoming events and add tickets to get started.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-black transition hover:opacity-90"
            href="/events"
          >
            Explore events
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      ) : (
        <>
          {/* Cart items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.eventId}-${item.tier.id}`}
                className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
              >
                <div className="flex gap-4">
                  {item.eventImage && (
                    <img
                      alt={item.eventTitle}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      src={item.eventImage}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                      {item.eventTitle}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                      {item.tier.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                      {item.eventDate} · {item.eventVenue}
                    </p>
                  </div>
                  <button
                    className="shrink-0 self-start text-[var(--text-tertiary)] transition hover:text-red-500"
                    onClick={() => removeItem(item.eventId, item.tier.id)}
                    type="button"
                  >
                    <Trash size={15} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-30"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity - 1)}
                      type="button"
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span className="w-6 text-center text-[15px] font-semibold text-[var(--text-primary)]">
                      {item.quantity}
                    </span>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
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
          <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Order Summary
            </p>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[var(--text-secondary)]">Service fee</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {totalPrice === 0 ? "—" : `GHS ${Math.round(totalPrice * 0.05).toLocaleString()}`}
                </span>
              </div>
              <div className="my-3 border-t border-[var(--border-subtle)]" />
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">Total</span>
                <span className="text-[20px] font-bold text-[var(--text-primary)]">
                  {totalPrice === 0
                    ? "Free"
                    : `GHS ${Math.round(totalPrice * 1.05).toLocaleString()}`}
                </span>
              </div>
            </div>

            <button
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-4 text-[15px] font-semibold text-black transition hover:opacity-90 active:scale-[0.98]"
              onClick={() => router.push("/checkout")}
              type="button"
            >
              Proceed to checkout
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
