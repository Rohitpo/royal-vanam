import { createHmac, timingSafeEqual } from "node:crypto";
import { confirmRazorpayPayment } from "@/lib/razorpay-confirm";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string };
    };
  };
};

function validWebhookSignature(body: string, received: string, secret: string) {
  const expectedBuffer = Buffer.from(createHmac("sha256", secret).update(body).digest("hex"), "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });

  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();
  if (!signature || !validWebhookSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    return Response.json({ received: true, ignored: true });
  }

  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity?.id || !paymentEntity.order_id) {
    return Response.json({ error: "Payment details are missing." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Database is not configured." }, { status: 503 });

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id")
    .eq("provider_order_id", paymentEntity.order_id)
    .eq("payment_method", "razorpay")
    .maybeSingle();
  if (paymentError || !payment) {
    console.error("Webhook payment lookup failed:", paymentError?.message ?? "no matching payment");
    return Response.json({ error: "Payment record was not found." }, { status: 404 });
  }

  const { error } = await confirmRazorpayPayment(payment.order_id, paymentEntity.order_id, paymentEntity.id);
  if (error) {
    console.error("Webhook payment confirmation failed:", error.message);
    return Response.json({ error: "Payment confirmation failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
