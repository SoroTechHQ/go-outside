"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  ArrowRight,
  Trash,
  Minus,
  Plus,
  ArrowsOut,
  Warning,
} from "@phosphor-icons/react";
import { useCart } from "../cart/CartContext";
import { useRouter, usePathname } from "next/navigation";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";
import { useAppShell } from "../layout/AppShellContext";

type MiniCartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 40,
  mass: 0.9,
};

export function MiniCartDrawer({ open, onClose }: MiniCartDrawerProps) {
  const { items, totalCount, totalPrice, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const { reduceMotion } = useAnimationConfig();
  const { peekPanelWidth } = useAppShell();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // When the event side pane is open on home, expand to full screen
  const isHome = pathname === "/" || pathname === "/home";
  const isFullscreen = isHome && peekPanelWidth > 0;

  function handleCheckout() {
    onClose();
    router.push("/dashboard/checkout");
  }

  function handleOpenFullPage() {
    onClose();
    router.push("/dashboard/checkout");
  }

  const slideProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: SPRING };

  const drawerClass = isFullscreen
    ? "fixed inset-0 z-[501] flex flex-col bg-[var(--bg-page)]"
    : "fixed right-0 top-0 z-[501] flex h-full w-full max-w-[380px] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-page)] shadow-[-12px_0_56px_rgba(0,0,0,0.22)]";

  const cartContent = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          <motion.div
            {...slideProps}
            className={drawerClass}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <ShoppingCart size={17} className="text-[var(--brand)]" weight="fill" />
                <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                  Cart
                  {totalCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                      {totalCount}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] active:scale-95"
                  onClick={handleOpenFullPage}
                  type="button"
                >
                  <ArrowsOut size={13} />
                  Full page
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)] active:scale-95"
                  onClick={onClose}
                  type="button"
                  aria-label="Close cart"
                >
                  <X size={13} weight="bold" />
                </button>
              </div>
            </div>

            <CartItemsList
              items={items}
              confirmDelete={confirmDelete}
              reduceMotion={reduceMotion}
              onTrash={(key) => setConfirmDelete(key)}
              onConfirmDelete={(eventId, tierId) => { removeItem(eventId, tierId); setConfirmDelete(null); }}
              onCancelDelete={() => setConfirmDelete(null)}
              onUpdateQuantity={updateQuantity}
            />

            {items.length > 0 && (
              <CartFooter totalPrice={totalPrice} onCheckout={handleCheckout} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(cartContent, document.body);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type CartItem = ReturnType<typeof useCart>["items"][number];

function CartItemsList({
  items,
  confirmDelete,
  reduceMotion,
  onTrash,
  onConfirmDelete,
  onCancelDelete,
  onUpdateQuantity,
}: {
  items: CartItem[];
  confirmDelete: string | null;
  reduceMotion: boolean;
  onTrash: (key: string) => void;
  onConfirmDelete: (eventId: string, tierId: string) => void;
  onCancelDelete: () => void;
  onUpdateQuantity: (eventId: string, tierId: string, qty: number) => void;
}) {
  const CONFIRM = { type: "spring" as const, stiffness: 500, damping: 42, mass: 0.7 };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
          <ShoppingCart size={36} className="text-[var(--text-tertiary)]" weight="light" />
          <p className="text-[14px] font-semibold text-[var(--text-secondary)]">Your cart is empty</p>
          <p className="text-[12px] text-[var(--text-tertiary)]">Browse events and add tickets to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {items.map((item) => {
            const key = `${item.eventId}-${item.tier.id}`;
            const isConfirming = confirmDelete === key;

            return (
              <div key={key} className="relative overflow-hidden px-4 py-3.5">
                <div className="flex gap-2.5">
                  {item.eventImage && (
                    <img
                      alt={item.eventTitle}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      src={item.eventImage}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{item.eventTitle}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{item.tier.name}</p>
                  </div>
                  <button
                    className="mt-0.5 shrink-0 text-[var(--text-tertiary)] transition-colors hover:text-red-500 active:scale-90"
                    onClick={() => onTrash(key)}
                    type="button"
                    aria-label="Remove item"
                  >
                    <Trash size={14} weight="regular" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95 disabled:opacity-30"
                      disabled={item.quantity <= 1}
                      onClick={() => onUpdateQuantity(item.eventId, item.tier.id, item.quantity - 1)}
                      type="button"
                    >
                      <Minus size={10} weight="bold" />
                    </button>
                    <span className="w-4 text-center text-[13px] font-semibold text-[var(--text-primary)]">
                      {item.quantity}
                    </span>
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                      onClick={() => onUpdateQuantity(item.eventId, item.tier.id, item.quantity + 1)}
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

                <AnimatePresence>
                  {isConfirming && (
                    <motion.div
                      initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                      animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                      transition={reduceMotion ? { duration: 0.12 } : CONFIRM}
                      className="absolute inset-0 flex items-center justify-between gap-3 bg-[var(--bg-card)] px-4"
                    >
                      <div className="flex items-center gap-2">
                        <Warning size={15} weight="fill" className="shrink-0 text-red-500" />
                        <p className="text-[12px] font-medium text-[var(--text-primary)]">Remove this ticket?</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onCancelDelete}
                          className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] active:scale-95"
                          type="button"
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => onConfirmDelete(item.eventId, item.tier.id)}
                          className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-600 active:scale-95"
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartFooter({ totalPrice, onCheckout }: { totalPrice: number; onCheckout: () => void }) {
  return (
    <div className="shrink-0 border-t border-[var(--border-subtle)] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-secondary)]">Total</p>
        <p className="text-[18px] font-bold text-[var(--text-primary)]">
          {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
        </p>
      </div>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
        onClick={onCheckout}
        type="button"
      >
        Checkout
        <ArrowRight size={15} weight="bold" />
      </button>
    </div>
  );
}
