import { Suspense } from "react";
import { getAuthContext } from "@/lib/supabase-server";
import { PortalAccessGate } from "@/components/portal-access-gate";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center text-[#7c6a4d]" role="status">Loading admin portal…</div>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const auth = await getAuthContext();
  if (auth.status !== "signed-in" || auth.role !== "admin") {
    return <PortalAccessGate auth={auth} expectedRole="admin" />;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <PortalAccessGate auth={{ status: "role-unavailable" }} expectedRole="admin" />;

  const [{ data: orderRows }, { count: customerCount }, { count: supplierCount }, { data: productRows }] = await Promise.all([
    supabase.from("orders").select("total, status, created_at"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["retail_customer", "wholesale_customer"]),
    supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("id, stock_quantity, available"),
  ]);

  const orders = orderRows ?? [];
  const completedOrLiveOrders = orders.filter((order) => !["Cancelled", "Refunded"].includes(order.status));
  const revenue = completedOrLiveOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => String(order.created_at).slice(0, 10) === today).length;
  const lowStock = (productRows ?? []).filter((product) => product.available && product.stock_quantity <= 10).length;
  const stats = [
    { label: "Revenue", value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(revenue) },
    { label: "Total orders", value: String(orders.length) },
    { label: "Customers", value: String(customerCount ?? 0) },
    { label: "Low stock products", value: String(lowStock) },
  ];
  const pipelineStatuses = ["Pending Payment", "Confirmed", "Awaiting Supplier", "Supplier Assigned", "Supplier Accepted", "Processing", "Packed", "Dispatched", "Delivered", "Cancelled"];

  return (
    <div className="container-shell py-16">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Admin portal</p>
          <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Operations dashboard</h1>
        </div>
        <div className="text-right text-sm text-[#4d5b54]">Today: {todayOrders} orders · Active suppliers: {supplierCount ?? 0}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-[#e7d8b1] bg-[#fffdf9] p-5 shadow-sm">
            <div className="text-sm text-[#6b6258]">{stat.label}</div>
            <div className="mt-4 text-3xl font-semibold text-[#12372a]">{stat.value}</div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Database totals</div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Order pipeline</h2>
          <ul className="mt-6 space-y-4 text-[#4d5b54]">
            {pipelineStatuses.map((status) => (
              <li key={status} className="flex items-center justify-between border-b border-[#f0e3c7] pb-3">
                <span>{status}</span>
                <span className="rounded-full bg-[#f5edd8] px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#6f5f3a]">{orders.filter((order) => order.status === status).length}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Core modules</h2>
          <div className="mt-6 grid gap-3 text-sm text-[#4d5b54]">
            {[
              "Product Management",
              "Inventory Management",
              "Customer Management",
              "Supplier Management",
              "Financial Management",
              "Reports and Exports",
            ].map((module) => (
              <div key={module} className="rounded-2xl border border-[#efe1bb] bg-[#fcf8f2] p-4">
                {module}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
