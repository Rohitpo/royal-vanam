"use client";

import { useCart } from "@/components/cart-provider";

export function CartCount() {
  const { totalCount } = useCart();
  return <span aria-live="polite">Cart ({totalCount})</span>;
}
