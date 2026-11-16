"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function ProductPurchaseControls({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [weight, setWeight] = useState(product.weights[0] ?? "");
  const [message, setMessage] = useState("");

  function addToCart(goToCart = false) {
    const error = addItem(product, weight);
    if (error) {
      setMessage(error);
      return;
    }
    if (goToCart) {
      router.push("/cart");
      return;
    }
    setMessage(`${product.name} (${weight}) added to your cart.`);
  }

  return (
    <>
      <div>
        <label htmlFor="product-weight" className="mb-2 block text-sm font-medium text-[#12372a]">Select weight</label>
        <select
          id="product-weight"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          className="rounded-full border border-[#d3c39b] bg-[#fffdf9] px-4 py-2 text-sm text-[#12372a]"
        >
          {product.weights.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={() => addToCart()} className="rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">
          Add to cart
        </button>
        <button type="button" onClick={() => addToCart(true)} className="rounded-full border border-[#12372a] px-6 py-3 text-sm font-medium text-[#12372a]">
          Buy now
        </button>
      </div>
      {message && <p role="status" className="text-sm text-[#4d5b54]">{message}</p>}
    </>
  );
}
