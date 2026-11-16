import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

async function getSupplier(request: Request) {
  const supabase = getSupabaseAdminClient();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supabase || !token) return { error: "Please sign in with your supplier account.", status: 401 as const };

  const { data: userResult, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userResult.user) return { error: "Your session has expired.", status: 401 as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle();
  if (profile?.role !== "supplier") return { error: "Supplier access is required.", status: 403 as const };

  const { data: supplier } = await supabase.from("suppliers").select("id").eq("profile_id", userResult.user.id).eq("active", true).maybeSingle();
  if (!supplier) return { error: "No active supplier profile is linked to this account.", status: 403 as const };

  return { supabase, userId: userResult.user.id, supplierId: supplier.id };
}

export async function GET(request: Request) {
  const auth = await getSupplier(request);
  if ("error" in auth) return Response.json({ success: false, error: auth.error }, { status: auth.status });

  const { data: assignments, error } = await auth.supabase
    .from("supplier_assignments")
    .select("id, order_id, status, assigned_at, reason")
    .eq("supplier_id", auth.supplierId)
    .order("assigned_at", { ascending: false });
  if (error) {
    console.error("Supplier assignment query failed:", error.message);
    return Response.json({ success: false, error: "Could not load assigned orders." }, { status: 500 });
  }
  if (!assignments?.length) return Response.json({ success: true, assignments: [] });

  const orderIds = [...new Set(assignments.map((assignment) => assignment.order_id))];
  const [{ data: orders }, { data: items }] = await Promise.all([
    auth.supabase.from("orders").select("id, order_number, status, customer_name, customer_phone, shipping_address_id, created_at").in("id", orderIds),
    auth.supabase.from("order_items").select("order_id, product_name, sku, weight_label, quantity").in("order_id", orderIds),
  ]);
  const addressIds = [...new Set((orders ?? []).flatMap((order) => order.shipping_address_id ? [order.shipping_address_id] : []))];
  const { data: addresses } = addressIds.length
    ? await auth.supabase.from("addresses").select("id, city, state, pin_code, house_building, street, locality").in("id", addressIds)
    : { data: [] };

  const orderMap = new Map((orders ?? []).map((order) => [order.id, order]));
  const addressMap = new Map((addresses ?? []).map((address) => [address.id, address]));
  return Response.json({
    success: true,
    assignments: assignments.map((assignment) => {
      const order = orderMap.get(assignment.order_id);
      return {
        ...assignment,
        order: order ? {
          ...order,
          address: order.shipping_address_id ? addressMap.get(order.shipping_address_id) ?? null : null,
          items: (items ?? []).filter((item) => item.order_id === order.id),
        } : null,
      };
    }),
  });
}

const actionSchema = z.object({
  assignmentId: z.string().uuid(),
  action: z.enum(["accept", "reject", "processing", "packed", "dispatched"]),
  reason: z.string().trim().max(500).optional(),
  courier: z.string().trim().max(120).optional(),
  trackingNumber: z.string().trim().max(160).optional(),
});

export async function POST(request: Request) {
  const auth = await getSupplier(request);
  if ("error" in auth) return Response.json({ success: false, error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return Response.json({ success: false, error: "Invalid supplier action." }, { status: 400 });

  const { data, error } = await auth.supabase.rpc("transition_supplier_assignment", {
    p_assignment_id: parsed.data.assignmentId,
    p_supplier_profile_id: auth.userId,
    p_action: parsed.data.action,
    p_reason: parsed.data.reason ?? null,
    p_courier: parsed.data.courier ?? null,
    p_tracking_number: parsed.data.trackingNumber ?? null,
  });

  if (error) {
    console.error("Supplier action failed:", error.message);
    return Response.json({ success: false, error: "That supplier status change is not allowed or could not be saved." }, { status: 409 });
  }
  return Response.json({ success: true, result: data });
}
