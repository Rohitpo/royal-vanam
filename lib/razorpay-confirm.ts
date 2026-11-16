import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function confirmRazorpayPayment(orderId: string, providerOrderId: string, providerPaymentId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: null, error: new Error("Supabase server credentials are not configured") };

  const typedSupabase = supabase as unknown as {
    rpc: (
      functionName: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  return typedSupabase.rpc("confirm_razorpay_payment", {
    p_order_id: orderId,
    p_provider_order_id: providerOrderId,
    p_provider_payment_id: providerPaymentId,
  });
}
