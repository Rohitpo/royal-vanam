export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: string;
  total: number | string;
  subtotal: number | string;
  gst: number | string;
  shipping_fee: number | string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  payment_method: string | null;
  idempotency_key: string | null;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  origin_country: string;
  origin_region: string | null;
  retail_price: number | string;
  wholesale_price: number | string | null;
  mrp: number | string | null;
  discount_percentage: number | string;
  stock_quantity: number;
  min_order_qty: number;
  available: boolean;
  packaging_info: string | null;
  quality_certificates: Json | null;
  tax_rate: number | string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SupplierRow = {
  id: string;
  profile_id: string;
  supplier_name: string;
  active: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  pin_code: string | null;
  lead_time_days: number;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  weight_label: string;
  retail_price: number | string;
  wholesale_price: number | string | null;
  mrp: number | string | null;
  stock_quantity: number;
  min_order_qty: number;
  available: boolean;
};

type ProductImageRow = { id: string; product_id: string; image_url: string; is_primary: boolean };
type CategoryRow = { id: string; name: string; slug: string; description: string | null; is_active: boolean };
type PaymentRow = {
  id: string;
  order_id: string;
  payment_method: string;
  payment_provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  amount: number | string;
  currency: string;
  status: string;
  paid_at: string | null;
};
type SupplierAssignmentRow = { id: string; order_id: string; supplier_id: string; status: string; assigned_at: string; reason: string | null };
type OrderItemRow = { id: string; order_id: string; product_id: string; product_variant_id: string | null; product_name: string; sku: string; weight_label: string | null; quantity: number; unit_price: number | string; total_price: number | string };
type AddressRow = { id: string; profile_id: string | null; full_name: string; mobile_number: string; house_building: string | null; street: string | null; locality: string | null; city: string | null; district: string | null; state: string | null; pin_code: string | null; country: string; delivery_instructions: string | null };
type CustomerRow = { id: string; profile_id: string; customer_type: string; business_name: string | null; gstin: string | null; wholesale_approved: boolean };
type SimpleRow = { id: string; [key: string]: Json | undefined };

export type Database = {
  public: {
    Tables: {
      orders: Table<OrderRow>;
      profiles: Table<ProfileRow>;
      products: Table<ProductRow>;
      suppliers: Table<SupplierRow>;
      product_variants: Table<ProductVariantRow>;
      product_images: Table<ProductImageRow>;
      categories: Table<CategoryRow>;
      payments: Table<PaymentRow>;
      supplier_assignments: Table<SupplierAssignmentRow>;
      order_items: Table<OrderItemRow>;
      addresses: Table<AddressRow>;
      customers: Table<CustomerRow>;
      supplier_addresses: Table<SimpleRow>;
      inventory: Table<SimpleRow>;
      inventory_transactions: Table<SimpleRow>;
      carts: Table<SimpleRow>;
      cart_items: Table<SimpleRow>;
      shipments: Table<SimpleRow>;
      invoices: Table<SimpleRow>;
      coupons: Table<SimpleRow>;
      wholesale_applications: Table<SimpleRow>;
      notifications: Table<SimpleRow>;
      order_status_history: Table<SimpleRow>;
      supplier_purchase_orders: Table<SimpleRow>;
      supplier_payments: Table<SimpleRow>;
      audit_logs: Table<SimpleRow>;
    };
    Views: Record<string, never>;
    Functions: {
      place_customer_order: {
        Args: {
          p_checkout_key: string;
          p_customer_id: string | null;
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone: string;
          p_address: Json;
          p_items: Json;
          p_payment_method: string;
        };
        Returns: Json;
      };
      confirm_razorpay_payment: {
        Args: { p_order_id: string; p_provider_order_id: string; p_provider_payment_id: string };
        Returns: Json;
      };
      transition_supplier_assignment: {
        Args: {
          p_assignment_id: string;
          p_supplier_profile_id: string;
          p_action: string;
          p_reason?: string | null;
          p_courier?: string | null;
          p_tracking_number?: string | null;
        };
        Returns: Json;
      };
      current_user_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: "admin" | "supplier" | "retail_customer" | "wholesale_customer";
      order_status: string;
      payment_status: "pending" | "paid" | "failed" | "refunded";
    };
    CompositeTypes: Record<string, never>;
  };
};
