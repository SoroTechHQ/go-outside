"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, ArrowRight, Trash, Minus, Plus } from "@phosphor-icons/react";
import { useCart } from "../cart/CartContext";
import { useRouter } from "next/navigation";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppShell } from "../layout/AppShellContext";

type MiniCartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MiniCartDrawer({ open, onClose }: MiniCartDrawerProps) {
  const { items, totalCount, totalPrice, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const { reduceMotion, springs } = useAnimationConfig();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { setPeekPanelWidth } = useAppShell();
  const paneWidth = 380;

  useEffect(() => {
    setPeekPanelWidth(open && isDesktop ? paneWidth : 0);
    return () => setPeekPanelWidth(0);
  }, [isDesktop, open, setPeekPanelWidth]);

  function handleCheckout() {
    onClose();
    router.push("/dashboard/checkout");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {!isDesktop && (
            <motion.div
              className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
            />
          )}

          {/* Drawer */}
          <motion.div
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            className="fixed right-0 top-0 z-[56] flex h-full w-full max-w-[380px] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-page)] shadow-[-8px_0_48px_rgba(0,0,0,0.16)]"
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={reduceMotion ? { duration: 0.15 } : springs.sheet}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-[var(--brand)]" weight="fill" />
                <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                  Cart
                  {totalCount > 0 && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
                      {totalCount}
                    </span>
                  )}
                </h2>
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-alt)] active:scale-95"
                onClick={onClose}
                type="button"
              >
                <X size={13} weight="bold" />
              </button>
            </div>

            {/* Items */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-5">
                  <ShoppingCart size={36} className="text-[var(--text-tertiary)]" weight="light" />
                  <p className="text-[14px] font-semibold text-[var(--text-secondary)]">Your cart is empty</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">Browse events and add tickets to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {items.map((item) => (
                    <div key={`${item.eventId}-${item.tier.id}`} className="px-4 py-3.5">
                      <div className="flex gap-2.5">
                        {item.eventImage && (
                          <img
                            alt={item.eventTitle}
                            className="h-11 w-11 rounded-xl object-cover shrink-0"
                            src={item.eventImage}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{item.eventTitle}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{item.tier.name}</p>
                        </div>
                        <button
                          className="shrink-0 text-[var(--text-tertiary)] hover:text-red-500 transition-colors mt-0.5"
                          onClick={() => removeItem(item.eventId, item.tier.id)}
                          type="button"
                        >
                          <Trash size={13} weight="regular" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity - 1)}
                            type="button"
                          >
                            <Minus size={10} weight="bold" />
                          </button>
                          <span className="w-4 text-center text-[13px] font-semibold text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                            onClick={() => updateQuantity(item.eventId, item.tier.id, item.quantity + 1)}
                            type="button"
                          >
                            <Plus size={10} weight="bold" />
                          </button>
                        </div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">
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
              <div className="border-t border-[var(--border-subtle)] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] text-[var(--text-secondary)]">Total</p>
                  <p className="text-[18px] font-bold text-[var(--text-primary)]">
                    {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
                  </p>
                </div>
                <button
                  className="w-full rounded-2xl bg-[var(--brand)] py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                  type="button"
                >
                  Checkout
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
