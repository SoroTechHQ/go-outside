"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const CART_STORAGE_KEY = "gooutside-cart";

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  priceType: "free" | "paid";
  description?: string;
  remaining?: number;
  maxPerUser?: number;
};

export type CartItem = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventImage?: string;
  tier: TicketTier;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (eventId: string, tierId: string) => void;
  updateQuantity: (eventId: string, tierId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.tier.price * i.quantity, 0);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.eventId === newItem.eventId && i.tier.id === newItem.tier.id,
      );
      if (existing) {
        return prev.map((i) =>
          i.eventId === newItem.eventId && i.tier.id === newItem.tier.id
            ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
            : i,
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((eventId: string, tierId: string) => {
    setItems((prev) => prev.filter((i) => !(i.eventId === eventId && i.tier.id === tierId)));
  }, []);

  const updateQuantity = useCallback((eventId: string, tierId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(eventId, tierId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.eventId === eventId && i.tier.id === tierId ? { ...i, quantity } : i,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
