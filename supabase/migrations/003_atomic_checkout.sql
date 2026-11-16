ALTER TABLE public.addresses ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5;
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;

CREATE OR REPLACE FUNCTION public.place_customer_order(
  p_checkout_key TEXT,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_address JSONB,
  p_items JSONB,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_address_id UUID;
  v_order_status order_status;
  v_payment_provider TEXT;
  v_item JSONB;
  v_product RECORD;
  v_variant RECORD;
  v_has_variants BOOLEAN;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_unit_price NUMERIC(12,2);
  v_line_total NUMERIC(12,2);
  v_line_tax NUMERIC(12,2);
  v_subtotal NUMERIC(12,2) := 0;
  v_tax NUMERIC(12,2) := 0;
  v_shipping NUMERIC(12,2);
  v_total NUMERIC(12,2);
BEGIN
  IF p_payment_method NOT IN ('razorpay', 'cod') THEN
    RAISE EXCEPTION 'Unsupported payment method';
  END IF;
  IF p_checkout_key IS NULL OR length(p_checkout_key) < 16 THEN
    RAISE EXCEPTION 'Invalid checkout key';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart must contain at least one item';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_checkout_key));
  SELECT id, order_number, status, total INTO v_order_id, v_order_number, v_order_status, v_total
  FROM public.orders WHERE idempotency_key = p_checkout_key;
  IF FOUND THEN
    RETURN jsonb_build_object('id', v_order_id, 'orderNumber', v_order_number, 'status', v_order_status, 'total', v_total, 'duplicate', true);
  END IF;

  INSERT INTO public.addresses (
    profile_id, full_name, mobile_number, house_building, street, locality,
    city, district, state, pin_code, country, delivery_instructions
  ) VALUES (
    p_customer_id,
    p_customer_name,
    p_customer_phone,
    p_address ->> 'houseBuilding',
    p_address ->> 'street',
    p_address ->> 'locality',
    p_address ->> 'city',
    p_address ->> 'district',
    p_address ->> 'state',
    p_address ->> 'pinCode',
    COALESCE(NULLIF(p_address ->> 'country', ''), 'India'),
    p_address ->> 'deliveryInstructions'
  ) RETURNING id INTO v_address_id;

  v_order_number := 'RV-' || lpad(nextval('public.order_number_seq')::TEXT, 6, '0');
  v_order_status := CASE WHEN p_payment_method = 'cod' THEN 'Confirmed'::order_status ELSE 'Pending Payment'::order_status END;
  v_payment_provider := CASE WHEN p_payment_method = 'cod' THEN 'manual' ELSE 'razorpay' END;

  INSERT INTO public.orders (
    order_number, customer_id, shipping_address_id, billing_address_id,
    status, payment_method, customer_name, customer_email, customer_phone,
    idempotency_key, subtotal, gst, shipping_fee, total
  ) VALUES (
    v_order_number, p_customer_id, v_address_id, v_address_id,
    v_order_status, p_payment_method, p_customer_name, p_customer_email,
    p_customer_phone, p_checkout_key, 0, 0, 0, 0
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item ->> 'quantity')::INTEGER;
    IF v_quantity < 1 OR v_quantity > 1000 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    SELECT id, sku, name, retail_price, stock_quantity, available, tax_rate
      INTO v_product
      FROM public.products
      WHERE slug = v_item ->> 'slug'
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product is unavailable';
    END IF;
    IF NOT v_product.available THEN
      RAISE EXCEPTION 'A product is unavailable';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.product_variants WHERE product_id = v_product.id)
      INTO v_has_variants;

    IF v_has_variants THEN
      SELECT id, weight_label, retail_price, stock_quantity, available
        INTO v_variant
        FROM public.product_variants
        WHERE product_id = v_product.id AND weight_label = v_item ->> 'weight'
        FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'A selected product size is unavailable';
      END IF;
      IF NOT v_variant.available THEN
        RAISE EXCEPTION 'A selected product size is unavailable';
      END IF;
      IF v_variant.stock_quantity < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for a selected product size';
      END IF;
      v_unit_price := v_variant.retail_price;
      v_variant_id := v_variant.id;
      UPDATE public.product_variants SET stock_quantity = stock_quantity - v_quantity, updated_at = NOW() WHERE id = v_variant.id;
    ELSE
      v_variant_id := NULL;
      IF v_product.stock_quantity < v_quantity THEN
        RAISE EXCEPTION 'Insufficient product stock';
      END IF;
      v_unit_price := v_product.retail_price;
      UPDATE public.products SET stock_quantity = stock_quantity - v_quantity, updated_at = NOW() WHERE id = v_product.id;
    END IF;

    v_line_total := v_unit_price * v_quantity;
    v_line_tax := ROUND(v_line_total * v_product.tax_rate / 100, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_tax := v_tax + v_line_tax;

    INSERT INTO public.order_items (
      order_id, product_id, product_variant_id, product_name, sku,
      weight_label, quantity, unit_price, total_price, tax_rate, tax_amount
    ) VALUES (
      v_order_id, v_product.id, v_variant_id,
      v_product.name, v_product.sku, v_item ->> 'weight', v_quantity,
      v_unit_price, v_line_total, v_product.tax_rate, v_line_tax
    );
  END LOOP;

  v_shipping := CASE WHEN v_subtotal >= 1500 THEN 0 ELSE 120 END;
  v_total := v_subtotal + v_tax + v_shipping;
  UPDATE public.orders SET subtotal = v_subtotal, gst = v_tax, shipping_fee = v_shipping, total = v_total, updated_at = NOW() WHERE id = v_order_id;

  INSERT INTO public.payments (order_id, payment_method, payment_provider, amount, status)
  VALUES (v_order_id, p_payment_method, v_payment_provider, v_total, 'pending');

  INSERT INTO public.order_status_history (order_id, new_status, actor_id, actor_role, notes)
  VALUES (v_order_id, v_order_status::TEXT, p_customer_id, 'customer', 'Order created at checkout');

  RETURN jsonb_build_object('id', v_order_id, 'orderNumber', v_order_number, 'status', v_order_status, 'total', v_total, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.place_customer_order(TEXT, UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_customer_order(TEXT, UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) TO service_role;
