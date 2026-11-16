"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function AddToCartButton({ product, weight, className }: { product: Product; weight: string; className?: string }) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");

  function handleAdd() {
    const error = addItem(product, weight);
    setMessage(error ?? `${product.name} (${weight}) added to your cart.`);
  }

  return (
    <div>
      <button type="button" onClick={handleAdd} className={className ?? "rounded-full bg-[#12372a] px-4 py-3 text-sm font-medium text-[#f8f3e8]"}>
        Add to Cart
      </button>
      {message && <span role="status" className="sr-only">{message}</span>}
    </div>
  );
}
