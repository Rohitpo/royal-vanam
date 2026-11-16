CREATE OR REPLACE FUNCTION public.confirm_razorpay_payment(
  p_order_id UUID,
  p_provider_order_id TEXT,
  p_provider_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
  v_total NUMERIC(12,2);
  v_current_status order_status;
  v_rows INTEGER;
BEGIN
  UPDATE public.payments
  SET provider_payment_id = p_provider_payment_id,
      status = 'paid',
      paid_at = COALESCE(paid_at, NOW()),
      updated_at = NOW()
  WHERE order_id = p_order_id
    AND provider_order_id = p_provider_order_id
    AND payment_method = 'razorpay'
    AND status = 'pending';
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.payments
      WHERE order_id = p_order_id
        AND provider_order_id = p_provider_order_id
        AND provider_payment_id = p_provider_payment_id
        AND status = 'paid'
    ) THEN
      SELECT order_number, total, status INTO v_order_number, v_total, v_current_status
      FROM public.orders WHERE id = p_order_id;
      RETURN jsonb_build_object('orderNumber', v_order_number, 'total', v_total, 'status', v_current_status, 'duplicate', true);
    END IF;
    RAISE EXCEPTION 'No matching pending payment';
  END IF;

  SELECT order_number, total, status INTO v_order_number, v_total, v_current_status
  FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status = 'Pending Payment' THEN
    UPDATE public.orders SET status = 'Confirmed', updated_at = NOW() WHERE id = p_order_id;
    INSERT INTO public.order_status_history (order_id, previous_status, new_status, actor_role, notes)
    VALUES (p_order_id, 'Pending Payment', 'Confirmed', 'system', 'Razorpay payment verified');
    v_current_status := 'Confirmed';
  END IF;

  RETURN jsonb_build_object('orderNumber', v_order_number, 'total', v_total, 'status', v_current_status, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_razorpay_payment(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_razorpay_payment(UUID, TEXT, TEXT) TO service_role;
