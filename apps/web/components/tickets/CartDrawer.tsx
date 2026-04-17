"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash, ShoppingCart, ArrowRight, Minus, Plus } from "@phosphor-icons/react";
import { useCart } from "../cart/CartContext";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { items, totalCount, totalPrice, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  function handleCheckout() {
    closeCart();
    router.push("/checkout");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.div
            animate={{ x: 0 }}
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-sm flex-col bg-[var(--bg-card)] shadow-2xl"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-[var(--brand)]" weight="fill" />
                <h2 className="text-[17px] font-bold text-[var(--text-primary)]">
                  Cart
                  {totalCount > 0 && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">
                      {totalCount}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    className="text-[12px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                    onClick={clearCart}
                    type="button"
                  >
                    Clear all
                  </button>
                )}
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-alt)] active:scale-95"
                  onClick={closeCart}
                  type="button"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
                  <ShoppingCart size={40} className="text-[var(--text-tertiary)]" weight="light" />
                  <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
                    Your cart is empty
                  </p>
                  <p className="text-[13px] text-[var(--text-tertiary)]">
                    Browse events and add tickets to get started
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {items.map((item) => (
                    <div key={`${item.eventId}-${item.tier.id}`} className="px-5 py-4">
                      <div className="flex gap-3">
                        {item.eventImage && (
                          <img
                            alt={item.eventTitle}
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                            src={item.eventImage}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                            {item.eventTitle}
                          </p>
                          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                            {item.tier.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                            {item.eventDate} · {item.eventVenue}
                          </p>
                        </div>
                        <button
                          className="shrink-0 text-[var(--text-tertiary)] hover:text-red-500 transition-colors mt-0.5"
                          onClick={() => removeItem(item.eventId, item.tier.id)}
                          type="button"
                        >
                          <Trash size={14} weight="regular" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity - 1)}
                            type="button"
                          >
                            <Minus size={11} weight="bold" />
                          </button>
                          <span className="w-5 text-center text-[14px] font-semibold text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                            onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity + 1)}
                            type="button"
                          >
                            <Plus size={11} weight="bold" />
                          </button>
                        </div>
                        <p className="text-[14px] font-bold text-[var(--text-primary)]">
                          {item.tier.priceType === "free"
                            ? "Free"
                            : `GHS ${(item.tier.price * item.quantity).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[var(--border-subtle)] px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[14px] text-[var(--text-secondary)]">Total</p>
                  <p className="text-[20px] font-bold text-[var(--text-primary)]">
                    {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
                  </p>
                </div>
                <button
                  className="w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                  type="button"
                >
                  Checkout
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
