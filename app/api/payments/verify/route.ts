import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { confirmRazorpayPayment } from "@/lib/razorpay-confirm";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-f0-9]+$/i),
});

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ success: false, error: "Please sign in again." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ success: false, error: "Invalid payment verification details." }, { status: 400 });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const supabase = getSupabaseAdminClient();
  if (!secret || !supabase) return Response.json({ success: false, error: "Payment verification is not configured." }, { status: 503 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ success: false, error: "Your session has expired." }, { status: 401 });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total, customer_id")
    .eq("order_number", parsed.data.orderNumber)
    .eq("customer_id", userData.user.id)
    .maybeSingle();
  if (orderError || !order) return Response.json({ success: false, error: "Order not found." }, { status: 404 });

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, provider_order_id, amount, status")
    .eq("order_id", order.id)
    .eq("payment_method", "razorpay")
    .maybeSingle();
  if (paymentError || !payment || payment.provider_order_id !== parsed.data.razorpay_order_id) {
    return Response.json({ success: false, error: "Payment does not match this order." }, { status: 409 });
  }
  if (Math.round(Number(payment.amount) * 100) <= 0) {
    return Response.json({ success: false, error: "Invalid payment amount." }, { status: 409 });
  }

  const expected = createHmac("sha256", secret)
    .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
    .digest("hex");
  if (!signaturesMatch(expected, parsed.data.razorpay_signature)) {
    return Response.json({ success: false, error: "Payment signature verification failed." }, { status: 400 });
  }

  const { data, error } = await confirmRazorpayPayment(
    order.id,
    parsed.data.razorpay_order_id,
    parsed.data.razorpay_payment_id
  );
  if (error) {
    console.error("Payment confirmation failed:", error.message);
    return Response.json({ success: false, error: "Payment could not be confirmed yet. Contact support with your payment reference." }, { status: 500 });
  }

  return Response.json({ success: true, order: data });
}
