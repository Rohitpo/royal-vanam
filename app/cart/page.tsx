"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-provider";
import { calculateCartTotals, formatCurrency } from "@/lib/commerce";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const totals = calculateCartTotals(items);

  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Your cart</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Shopping bag</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-10 text-center">
          <h2 className="font-serif text-3xl text-[#12372a]">Your cart is waiting for something good.</h2>
          <p className="mt-3 text-[#4d5b54]">Explore our naturally sourced pantry essentials.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {items.map((item) => (
              <article key={`${item.productId}-${item.weight}`} className="flex flex-col gap-4 rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Image src={item.image} alt="" width={80} height={80} sizes="80px" className="h-20 w-20 rounded-2xl object-cover" />
                  <div>
                    <Link href={`/products/${item.slug}`} className="text-xl font-semibold text-[#12372a]">{item.name}</Link>
                    <p className="text-sm text-[#4d5b54]">{item.weight}</p>
                    <p className="mt-1 text-sm font-medium text-[#12372a]">{formatCurrency(item.price)} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#4d5b54]">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.qty}
                      onChange={(event) => updateQuantity(item.productId, item.weight, Number(event.target.value))}
                      className="w-20 rounded-lg border border-[#d9caa4] bg-white px-3 py-2 text-[#12372a]"
                    />
                  </label>
                  <div className="min-w-24 text-right font-semibold text-[#12372a]">{formatCurrency(item.price * item.qty)}</div>
                  <button type="button" onClick={() => removeItem(item.productId, item.weight)} className="rounded-full border border-[#12372a] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#12372a]">
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6">
            <h2 className="text-2xl font-semibold text-[#12372a]">Summary</h2>
            <div className="mt-6 space-y-3 text-[#4d5b54]">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}</span></div>
              <div className="flex justify-between"><span>Estimated GST</span><span>{formatCurrency(totals.gst)}</span></div>
              <div className="flex justify-between text-lg font-semibold text-[#12372a]"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
              <p className="pt-2 text-xs leading-5 text-[#7a6e58]">Final tax and shipping are confirmed at checkout using current product and delivery rules.</p>
            </div>
            <Link href="/checkout" className="mt-8 block w-full rounded-full bg-[#12372a] px-5 py-3 text-center text-sm font-medium text-[#f8f3e8]">Proceed to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
