"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { calculateCartTotals, formatCurrency } from "@/lib/commerce";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type PlacedOrder = { orderNumber: string; status: string; total: number; invoiceUrl?: string; invoiceSmsSent?: boolean };
type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void | Promise<void>;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const inputClass = "w-full rounded-xl border border-[#d9caa4] bg-[#fffdf9] px-4 py-3 text-[#12372a] outline-none transition focus:border-[#b48f3a] focus:ring-2 focus:ring-[#b48f3a]/20";

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const totals = calculateCartTotals(items);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const checkoutKey = useRef<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = sessionData.session?.access_token;
    if (paymentMethod === "razorpay" && !token) {
      setError("Please log in before choosing online payment.");
      return;
    }
    checkoutKey.current ??= crypto.randomUUID();
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          checkoutKey: checkoutKey.current,
          customerName: String(formData.get("fullName")),
          email: String(formData.get("email")),
          phone: String(formData.get("phone")),
          paymentMethod,
          address: {
            houseBuilding: String(formData.get("houseBuilding")),
            street: String(formData.get("street")),
            locality: String(formData.get("locality")),
            city: String(formData.get("city")),
            district: String(formData.get("district")),
            state: String(formData.get("state")),
            pinCode: String(formData.get("pinCode")),
            country: "India",
            deliveryInstructions: String(formData.get("deliveryInstructions") ?? ""),
          },
          items: items.map((item) => ({ slug: item.slug, weight: item.weight, quantity: item.qty })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error ?? "We could not place your order. Please try again.");
        return;
      }

      const placedOrder = result.order as PlacedOrder;
      if (paymentMethod === "cod") {
        setOrder(placedOrder);
        clearCart();
        return;
      }

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderNumber: placedOrder.orderNumber }),
      });
      const paymentDetails = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentDetails.success) {
        setError(paymentDetails.error ?? "Could not start online payment. Your order remains pending payment.");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError("Could not load the payment window. Your order remains pending payment; you can retry checkout.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: paymentDetails.keyId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        name: "Royal Vanam",
        description: `Order ${placedOrder.orderNumber}`,
        order_id: paymentDetails.razorpayOrderId,
        prefill: {
          name: String(formData.get("fullName")),
          email: String(formData.get("email")),
          contact: String(formData.get("phone")),
        },
        theme: { color: "#12372a" },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => {
          try {
            const verificationResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ orderNumber: placedOrder.orderNumber, ...response }),
            });
            const verification = await verificationResponse.json();
            if (!verificationResponse.ok || !verification.success) {
              setError(verification.error ?? "Payment needs verification. Contact support with your payment reference.");
              return;
            }
            setOrder({ ...(verification.order as PlacedOrder), invoiceUrl: placedOrder.invoiceUrl, invoiceSmsSent: placedOrder.invoiceSmsSent });
            clearCart();
          } catch {
            setError("Payment was submitted but could not be verified now. Contact support with your payment reference.");
          } finally {
            setLoading(false);
          }
        },
      });
      razorpay.open();
      setLoading(false);
    } catch {
      setError("Could not reach checkout. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <div className="container-shell py-20">
        <section className="mx-auto max-w-2xl rounded-[32px] border border-[#e6d7b1] bg-[#fffdf9] p-10 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Order placed</p>
          <h1 className="mt-3 font-serif text-4xl text-[#12372a]">Thank you for your order.</h1>
          <p className="mt-4 text-[#4d5b54]">Order <strong>{order.orderNumber}</strong> is {order.status.toLowerCase()}.</p>
          <p className="mt-2 text-lg font-semibold text-[#12372a]">Order total: {formatCurrency(order.total)}</p>
          {order.invoiceUrl && (
            <div className="mt-6 rounded-2xl border border-[#e6d7b1] bg-[#f8f3e8] p-5">
              <p className="text-sm text-[#4d5b54]">
                {order.invoiceSmsSent ? "Your invoice link was sent to your mobile by SMS." : "Your order invoice is ready to download."}
              </p>
              <a href={order.invoiceUrl} className="mt-4 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">
                Download invoice PDF
              </a>
            </div>
          )}
          <Link href="/shop" className="mt-8 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Continue shopping</Link>
        </section>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-shell py-20 text-center">
        <h1 className="font-serif text-4xl text-[#12372a]">Your cart is empty.</h1>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-16">
      <div className="mb-10 overflow-hidden rounded-[30px] border border-[#dfd0aa] bg-[radial-gradient(circle_at_85%_15%,rgba(180,143,58,0.2),transparent_34%),linear-gradient(120deg,#fffdf9_0%,#f2ead8_100%)] p-7 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Royal Vanam · Checkout</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#12372a] sm:text-5xl">A thoughtful choice, on its way.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#4d5b54]">Confirm your delivery details and choose how you’d like to pay. Your order total is checked against current product prices and stock.</p>
          </div>
          <div className="rounded-2xl border border-[#dfd0aa] bg-[#fffdf9]/90 px-5 py-4 text-sm text-[#12372a] shadow-sm">
            <div className="font-medium">A secure, simple checkout</div>
            <div className="mt-1 text-xs text-[#7c6a4d]">Your details are used to fulfil this order.</div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#dfd0aa] pt-5 text-xs uppercase tracking-[0.16em] text-[#756442]">
          <span><strong className="mr-2 text-[#b48f3a]">01</strong>Delivery</span>
          <span><strong className="mr-2 text-[#b48f3a]">02</strong>Payment</span>
          <span><strong className="mr-2 text-[#b48f3a]">03</strong>Confirmation</span>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-6 rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6" onSubmit={handleSubmit}>
          <section>
            <h2 className="text-2xl font-semibold text-[#12372a]">Delivery details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input name="fullName" autoComplete="name" required className={`${inputClass} md:col-span-2`} placeholder="Full name" />
              <input name="phone" type="tel" autoComplete="tel" required className={inputClass} placeholder="Mobile number" />
              <input name="email" type="email" autoComplete="email" required className={inputClass} placeholder="Email address" />
              <input name="houseBuilding" required className={`${inputClass} md:col-span-2`} placeholder="House / Building" />
              <input name="street" required className={`${inputClass} md:col-span-2`} placeholder="Street address" />
              <input name="locality" required className={inputClass} placeholder="Locality" />
              <input name="city" required className={inputClass} placeholder="City" />
              <input name="district" required className={inputClass} placeholder="District" />
              <input name="state" required className={inputClass} placeholder="State" />
              <input name="pinCode" inputMode="numeric" pattern="[0-9]{6}" required className={inputClass} placeholder="6-digit PIN code" />
              <textarea name="deliveryInstructions" className={`${inputClass} md:col-span-2`} rows={3} placeholder="Delivery instructions (optional)" />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#12372a]">Payment</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4 text-[#12372a]">
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                <span>Cash on Delivery</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4 text-[#12372a]">
                <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
                <span>Pay online with Razorpay</span>
              </label>
            </div>
          </section>

          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <button disabled={loading} className="w-full rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8] disabled:opacity-60">
            {loading ? "Processing…" : paymentMethod === "cod" ? "Place COD order" : "Continue to secure payment"}
          </button>
        </form>

        <aside className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8e7a53]">Your selection</p>
          <h2 className="mt-2 font-serif text-3xl text-[#12372a]">Order summary</h2>
          <div className="mt-6 divide-y divide-[#eee4ce] text-[#4d5b54]">
            {items.map((item) => (
              <div key={`${item.productId}-${item.weight}`} className="flex items-center gap-4 py-4 first:pt-0">
                <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e8dcc0] bg-[#f3ebdc]">
                  <Image src={item.image} alt="" width={56} height={64} unoptimized className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[#12372a]">{item.name}</div>
                  <div className="mt-1 text-xs text-[#7a6e58]">{item.weight} · Qty {item.qty}</div>
                </div>
                <span className="shrink-0 text-sm font-medium text-[#12372a]">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t border-[#e8dcc0] pt-5 text-sm text-[#4d5b54]">
            <div className="flex justify-between"><span>Estimated shipping</span><span>{totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}</span></div>
            <div className="flex justify-between"><span>Estimated GST</span><span>{formatCurrency(totals.gst)}</span></div>
            <div className="mt-3 flex justify-between border-t border-[#e8dcc0] pt-4 text-lg font-semibold text-[#12372a]"><span>Estimated total</span><span>{formatCurrency(totals.total)}</span></div>
            <p className="pt-2 text-xs leading-5 text-[#7a6e58]">Final amount is recalculated from current database prices, tax rules and stock at order submission.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
