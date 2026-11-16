import { Suspense } from "react";
import Link from "next/link";
import { getAuthContext } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { formatCurrency, getOrderStatusColor } from "@/lib/commerce";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center text-[#7c6a4d]" role="status">Loading your orders…</div>}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const auth = await getAuthContext();
  if (auth.status !== "signed-in") {
    return (
      <div className="container-shell py-20 text-center">
        <h1 className="font-serif text-4xl text-[#12372a]">Sign in to view your orders</h1>
        <p className="mt-3 text-[#4d5b54]">Your order history is private to your account.</p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Log in</Link>
      </div>
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return <div className="container-shell py-20 text-center text-[#4d5b54]">Order database is not configured.</div>;
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .eq("customer_id", auth.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">My orders</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Recent purchases</h1>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">Could not load your order history. Try again later.</p>}
      {!error && !orders?.length && (
        <div className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-8 text-center">
          <p className="text-[#4d5b54]">You have not placed any orders yet.</p>
          <Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Browse products</Link>
        </div>
      )}

      <div className="space-y-5">
        {(orders ?? []).map((order) => (
          <div key={order.id} className="flex flex-col gap-4 rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">{order.order_number}</div>
              <div className="mt-2 text-sm text-[#4d5b54]">{new Date(order.created_at).toLocaleDateString("en-IN")}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] ${getOrderStatusColor(order.status)}`}>{order.status}</span>
              <span className="text-lg font-semibold text-[#12372a]">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
