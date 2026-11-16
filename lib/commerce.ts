import type { CartItem, Product } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateCartTotals(items: CartItem[], coupon = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = subtotal * 0.05;
  const shipping = subtotal > 1500 ? 0 : 120;
  const discount = coupon > 0 ? subtotal * (coupon / 100) : 0;
  const total = subtotal + gst + shipping - discount;

  return {
    subtotal,
    gst,
    shipping,
    discount,
    total,
  };
}

export function getProductBySlug(products: Product[], slug: string) {
  return products.find((product) => product.slug === slug);
}

export function isProductAvailable(product: Product, requestedQty: number) {
  return product.available && product.stock >= requestedQty;
}

export function getOrderStatusColor(status: string) {
  if (["Delivered", "Completed"].includes(status)) return "bg-emerald-100 text-emerald-800";
  if (["Processing", "Supplier Accepted"].includes(status)) return "bg-amber-100 text-amber-800";
  if (["Cancelled", "Rejected"].includes(status)) return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

export function buildOrderStatusHistory() {
  return [
    { status: "Pending Payment", time: "09:30 AM" },
    { status: "Confirmed", time: "10:15 AM" },
    { status: "Supplier Assigned", time: "11:40 AM" },
    { status: "Dispatched", time: "Today, 3:00 PM" },
  ];
}
