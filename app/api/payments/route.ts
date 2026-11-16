import Razorpay from "razorpay";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const paymentSchema = z.object({ orderNumber: z.string().trim().min(4).max(40) });

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return Response.json({ success: false, error: "Sign in before starting an online payment." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid order number." }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabase = getSupabaseAdminClient();
  if (!keyId || !keySecret || !supabase) {
    return Response.json({ success: false, error: "Online payments are not configured on this server yet." }, { status: 503 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ success: false, error: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total, status, customer_id, payment_method")
    .eq("order_number", parsed.data.orderNumber)
    .eq("customer_id", userData.user.id)
    .maybeSingle();

  if (orderError || !order) {
    return Response.json({ success: false, error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "Pending Payment" || order.payment_method !== "razorpay") {
    return Response.json({ success: false, error: "This order is not awaiting online payment." }, { status: 409 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, provider_order_id, amount, status")
    .eq("order_id", order.id)
    .eq("payment_method", "razorpay")
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  if (paymentError || !payment) {
    return Response.json({ success: false, error: "Pending payment record was not found." }, { status: 409 });
  }

  try {
    let razorpayOrderId = payment.provider_order_id;
    if (!razorpayOrderId) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(order.total) * 100),
        currency: "INR",
        receipt: order.order_number,
        notes: { internal_order_id: order.id },
      });
      razorpayOrderId = razorpayOrder.id;

      const { error: updateError } = await supabase
        .from("payments")
        .update({ provider_order_id: razorpayOrderId })
        .eq("id", payment.id)
        .eq("status", "pending");
      if (updateError) throw updateError;
    }

    return Response.json({
      success: true,
      keyId,
      razorpayOrderId,
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ success: false, error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
