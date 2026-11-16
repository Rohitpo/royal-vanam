import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createInvoiceToken, sendInvoiceSms } from "@/lib/invoice-delivery";

const orderSchema = z.object({
  checkoutKey: z.string().uuid(),
  customerName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(24),
  paymentMethod: z.enum(["razorpay", "cod"]),
  address: z.object({
    houseBuilding: z.string().trim().min(1).max(160),
    street: z.string().trim().min(1).max(200),
    locality: z.string().trim().min(1).max(160),
    city: z.string().trim().min(1).max(120),
    district: z.string().trim().min(1).max(120),
    state: z.string().trim().min(1).max(120),
    pinCode: z.string().trim().regex(/^\d{6}$/),
    country: z.string().trim().min(2).max(80).default("India"),
    deliveryInstructions: z.string().trim().max(500).optional().default(""),
  }),
  items: z.array(z.object({
    slug: z.string().trim().min(1).max(160),
    weight: z.string().trim().min(1).max(40),
    quantity: z.number().int().min(1).max(1000),
  })).min(1).max(50),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Please check the delivery and order details." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return Response.json({
      success: false,
      error: "Checkout needs a Supabase server key. Add SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server. Do not use the publishable key here.",
    }, { status: 503 });
  }

  let customerId: string | null = null;
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return Response.json({ success: false, error: "Your session has expired. Please sign in again." }, { status: 401 });
    }
    customerId = userData.user.id;
  }

  if (parsed.data.paymentMethod === "razorpay") {
    if (!customerId) {
      return Response.json({ success: false, error: "Sign in before choosing online payment." }, { status: 401 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return Response.json({ success: false, error: "Online payments are not configured on this server yet." }, { status: 503 });
    }
  }

  const typedSupabase = supabase as unknown as {
    rpc: (
      functionName: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
  };
  const { data, error } = await typedSupabase.rpc("place_customer_order", {
    p_checkout_key: parsed.data.checkoutKey,
    p_customer_id: customerId,
    p_customer_name: parsed.data.customerName,
    p_customer_email: parsed.data.email,
    p_customer_phone: parsed.data.phone,
    p_address: parsed.data.address,
    p_items: parsed.data.items,
    p_payment_method: parsed.data.paymentMethod,
  });

  if (error) {
    console.error("Order creation failed:", error.message);
    if (error.code === "23503" && error.message.includes("addresses_profile_id_fkey")) {
      return Response.json({
        success: false,
        error: "Your account profile is missing from the database. Run supabase/migrations/009_backfill_auth_profiles.sql in the Supabase SQL Editor, then try checkout again.",
      }, { status: 409 });
    }
    const schemaMissing = error.code === "PGRST202" || error.code === "PGRST205" ||
      /schema cache|place_customer_order|relation .* does not exist|could not find the table/i.test(error.message);
    if (schemaMissing) {
      return Response.json({
        success: false,
        error: "The Supabase checkout schema is missing. Run migrations 001_initial_schema.sql through 009_backfill_auth_profiles.sql in the documented order, including supabase/seed.sql after migration 006. Checkout saves the submitted delivery address to the addresses table and links it to the order.",
      }, { status: 503 });
    }
    const conflict = /stock|unavailable|size/i.test(error.message);
    return Response.json({
      success: false,
      error: conflict
        ? "A product or quantity is no longer available. Refresh your cart and try again."
        : "We could not place your order. Please try again or contact support.",
    }, { status: conflict ? 409 : 500 });
  }

  const order = data as Record<string, unknown> | null;
  const orderId = typeof order?.id === "string" ? order.id : "";
  const orderNumber = typeof order?.orderNumber === "string" ? order.orderNumber : "";
  if (!order || !orderId || !orderNumber) {
    console.error("Order creation returned an unexpected result.");
    return Response.json({ success: false, error: "The order was created but its confirmation details could not be prepared. Contact support before retrying." }, { status: 500 });
  }

  const invoiceToken = createInvoiceToken(orderNumber);
  const invoiceUrl = new URL(`/api/invoices/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(invoiceToken)}`, request.url).toString();
  const { data: previousInvoice } = await supabase
    .from("invoices")
    .select("id, sms_sent_at")
    .eq("order_id", orderId)
    .maybeSingle();
  const { error: invoiceError } = await supabase
    .from("invoices")
    .upsert({
      order_id: orderId,
      invoice_number: `RV-INV-${orderNumber}`,
      invoice_url: invoiceUrl,
      total: Number(order.total),
      status: "issued",
    }, { onConflict: "order_id" });

  if (invoiceError) {
    console.error("Could not save invoice link:", invoiceError.message);
  }

  let invoiceSmsSent = Boolean(previousInvoice?.sms_sent_at);
  if (!invoiceSmsSent && !invoiceError) {
    invoiceSmsSent = await sendInvoiceSms(parsed.data.phone, orderNumber, invoiceUrl);
    if (invoiceSmsSent && previousInvoice?.id) {
      const { error: smsUpdateError } = await supabase
        .from("invoices")
        .update({ sms_sent_at: new Date().toISOString() })
        .eq("id", previousInvoice.id);
      if (smsUpdateError) console.error("Could not record invoice SMS delivery:", smsUpdateError.message);
    } else if (invoiceSmsSent) {
      const { error: smsUpdateError } = await supabase
        .from("invoices")
        .update({ sms_sent_at: new Date().toISOString() })
        .eq("order_id", orderId);
      if (smsUpdateError) console.error("Could not record invoice SMS delivery:", smsUpdateError.message);
    }
  }

  return Response.json({
    success: true,
    order: { ...order, invoiceUrl, invoiceSmsSent },
  }, { status: 201 });
}
