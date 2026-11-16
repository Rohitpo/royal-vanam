"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getOrderStatusColor } from "@/lib/commerce";

type Assignment = {
  id: string;
  order_id: string;
  status: string;
  assigned_at: string;
  reason: string | null;
  order: null | {
    order_number: string;
    status: string;
    customer_name: string | null;
    customer_phone: string | null;
    address: null | { city: string | null; state: string | null; pin_code: string | null; full_address: string | null; house_building: string | null; street: string | null; locality: string | null };
    items: Array<{ product_name: string; sku: string; weight_label: string | null; quantity: number }>;
  };
};

export function SupplierAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadAssignments = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) {
      setError("Your supplier session is not available. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/supplier/assignments", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "Could not load orders.");
      setAssignments(result.assignments as Assignment[]);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load assigned orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAssignments(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAssignments]);

  async function performAction(assignment: Assignment, action: "accept" | "reject" | "processing" | "packed" | "dispatched") {
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) return setError("Your session has expired. Please sign in again.");

    let reason: string | undefined;
    let courier: string | undefined;
    let trackingNumber: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Please enter a reason for rejecting this order:")?.trim();
      if (!reason) return;
    }
    if (action === "dispatched") {
      courier = window.prompt("Courier company:")?.trim();
      if (!courier) return;
      trackingNumber = window.prompt("Tracking number:")?.trim();
      if (!trackingNumber) return;
    }

    setBusyId(assignment.id);
    setError("");
    try {
      const response = await fetch("/api/supplier/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignmentId: assignment.id, action, reason, courier, trackingNumber }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "Could not update order.");
      await loadAssignments();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update order status.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {loading && <p className="rounded-xl bg-[#fffdf9] p-6 text-[#4d5b54]">Loading assigned orders…</p>}
      {!loading && !error && assignments.length === 0 && (
        <p className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-8 text-[#4d5b54]">There are no orders assigned to your supplier account.</p>
      )}

      {assignments.map((assignment) => {
        const order = assignment.order;
        if (!order) return null;
        const address = order.address;
        const status = assignment.status.toLowerCase();
        const nextAction = status === "assigned" || status === "awaiting_assignment"
          ? ["accept", "reject"] as const
          : status === "accepted"
            ? ["processing"] as const
            : status === "processing"
              ? ["packed"] as const
              : status === "packed"
                ? ["dispatched"] as const
                : [];

        return (
          <article key={assignment.id} className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-[#7c6a4d]">{order.order_number}</div>
                <h2 className="mt-2 text-2xl font-semibold text-[#12372a]">{order.items.map((item) => item.product_name).join(", ") || "Order items"}</h2>
                <div className="mt-2 text-sm text-[#4d5b54]">{order.items.map((item) => `${item.sku} · ${item.weight_label ?? "Standard"} × ${item.quantity}`).join(" | ")}</div>
              </div>
              <span className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.2em] ${getOrderStatusColor(order.status)}`}>{order.status}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Customer</div>
                <div className="mt-2 text-[#12372a]">{order.customer_name ?? "Customer"}</div>
                <div className="text-sm text-[#4d5b54]">{order.customer_phone ?? ""}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Delivery city</div>
                <div className="mt-2 text-[#12372a]">{[address?.city, address?.state, address?.pin_code].filter(Boolean).join(", ") || "Address on order"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Assignment date</div>
                <div className="mt-2 text-[#12372a]">{new Date(assignment.assigned_at).toLocaleDateString("en-IN")}</div>
              </div>
            </div>

            {address && <p className="mt-4 text-sm text-[#4d5b54]">{[address.house_building, address.street, address.locality, address.full_address].filter(Boolean).join(", ")}</p>}
            {assignment.reason && <p className="mt-3 text-sm text-rose-800">Previous response: {assignment.reason}</p>}

            {nextAction.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {nextAction.map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled={busyId === assignment.id}
                    onClick={() => void performAction(assignment, action)}
                    className={action === "reject" ? "rounded-full border border-[#12372a] px-5 py-2 text-sm font-medium text-[#12372a] disabled:opacity-50" : "rounded-full bg-[#12372a] px-5 py-2 text-sm font-medium capitalize text-[#f8f3e8] disabled:opacity-50"}
                  >
                    {busyId === assignment.id ? "Saving…" : action}
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
