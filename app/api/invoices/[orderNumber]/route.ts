import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateInvoicePdf, verifyInvoiceToken, type InvoiceData } from "@/lib/invoice-delivery";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    if (!verifyInvoiceToken(orderNumber, token)) {
      return Response.json({ error: "This invoice link is invalid or has expired." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Invoice download is not configured." }, { status: 503 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Invoice service is not configured." }, { status: 503 });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, subtotal, gst, shipping_fee, total, customer_name, customer_email, customer_phone, shipping_address_id, payment_method, created_at")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (orderError || !order) return Response.json({ error: "Order was not found." }, { status: 404 });

  const [itemsResult, addressResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("product_name, sku, weight_label, quantity, unit_price, total_price")
      .eq("order_id", order.id)
      .order("created_at"),
    order.shipping_address_id
      ? supabase
          .from("addresses")
          .select("full_name, house_building, street, locality, city, district, state, pin_code, country")
          .eq("id", order.shipping_address_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (itemsResult.error || !itemsResult.data?.length) {
    console.error("Invoice item lookup failed:", itemsResult.error?.message ?? "No order items");
    return Response.json({ error: "Invoice details are not available." }, { status: 500 });
  }
  if (addressResult.error) {
    console.error("Invoice address lookup failed:", addressResult.error.message);
    return Response.json({ error: "Invoice delivery details are not available." }, { status: 500 });
  }

  const address = addressResult.data;
  const invoice: InvoiceData = {
    invoiceNumber: `RV-INV-${order.order_number}`,
    orderNumber: order.order_number,
    orderDate: new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    orderStatus: order.status,
    paymentMethod: order.payment_method ?? "Not recorded",
    customerName: order.customer_name ?? "Customer",
    customerEmail: order.customer_email ?? "",
    customerPhone: order.customer_phone ?? "",
    deliveryAddress: address
      ? [address.full_name, address.house_building, address.street, address.locality, address.city, address.district, address.state, address.pin_code, address.country].filter((part): part is string => Boolean(part))
      : [],
    subtotal: Number(order.subtotal),
    tax: Number(order.gst),
    shipping: Number(order.shipping_fee),
    total: Number(order.total),
    items: itemsResult.data.map((item) => ({
      name: item.product_name,
      sku: item.sku,
      weight: item.weight_label,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      total: Number(item.total_price),
    })),
  };

  try {
    const pdf = await generateInvoicePdf(invoice);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Invoice PDF generation failed:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Could not generate the invoice PDF." }, { status: 500 });
  }
}
