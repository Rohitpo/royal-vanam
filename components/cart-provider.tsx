"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  addItem: (product: Product, weight: string, quantity?: number) => string | null;
  removeItem: (productId: string, weight: string) => void;
  updateQuantity: (productId: string, weight: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "royal-vanam-cart-v1";
const EMPTY_CART: CartItem[] = [];
let cartSnapshot: CartItem[] | null = null;
const listeners = new Set<() => void>();

function readStoredItems(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CartItem =>
      item &&
      typeof item.productId === "string" &&
      typeof item.slug === "string" &&
      typeof item.name === "string" &&
      typeof item.weight === "string" &&
      Number.isInteger(item.qty) &&
      item.qty > 0 &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      typeof item.image === "string" &&
      typeof item.stock === "number"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getCartSnapshot, () => EMPTY_CART);

  const addItem = useCallback((product: Product, weight: string, quantity = 1) => {
    const availableStock = product.weightStock?.[weight] ?? product.stock;
    if (!product.available || availableStock < quantity) {
      return "This product is currently unavailable in the requested quantity.";
    }

    updateCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.weight === weight);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && item.weight === weight
            ? { ...item, stock: availableStock, qty: Math.min(item.qty + quantity, availableStock) }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          weight,
          qty: Math.min(quantity, availableStock),
          price: product.weightPrices?.[weight] ?? product.retailPrice,
          stock: availableStock,
          image: product.image,
        },
      ];
    });

    return null;
  }, []);

  const removeItem = useCallback((productId: string, weight: string) => {
    updateCart((current) => current.filter((item) => item.productId !== productId || item.weight !== weight));
  }, []);

  const updateQuantity = useCallback((productId: string, weight: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, weight);
      return;
    }
    updateCart((current) => current.map((item) =>
      item.productId === productId && item.weight === weight ? { ...item, qty: Math.min(quantity, item.stock) } : item
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => updateCart(() => []), []);
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

  const value = useMemo(() => ({ items, totalCount, addItem, removeItem, updateQuantity, clearCart }), [
    items,
    totalCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function getCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_CART;
  cartSnapshot ??= readStoredItems();
  return cartSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cartSnapshot = readStoredItems();
      listeners.forEach((notify) => notify());
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateCart(updater: (items: CartItem[]) => CartItem[]) {
  const next = updater(getCartSnapshot());
  cartSnapshot = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
