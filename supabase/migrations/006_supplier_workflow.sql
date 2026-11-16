CREATE OR REPLACE FUNCTION public.transition_supplier_assignment(
  p_assignment_id UUID,
  p_supplier_profile_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_courier TEXT DEFAULT NULL,
  p_tracking_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_current_assignment_status TEXT;
  v_next_assignment_status TEXT;
  v_current_order_status order_status;
  v_next_order_status order_status;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT id INTO v_supplier_id
  FROM public.suppliers
  WHERE profile_id = p_supplier_profile_id AND active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier account is inactive or missing';
  END IF;

  SELECT sa.order_id, sa.status, o.status, o.order_number
    INTO v_order_id, v_current_assignment_status, v_current_order_status, v_order_number
  FROM public.supplier_assignments sa
  JOIN public.orders o ON o.id = sa.order_id
  WHERE sa.id = p_assignment_id AND sa.supplier_id = v_supplier_id
  FOR UPDATE OF sa, o;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  IF p_action = 'accept' AND v_current_assignment_status IN ('assigned', 'awaiting_assignment') THEN
    v_next_assignment_status := 'accepted';
    v_next_order_status := 'Supplier Accepted';
  ELSIF p_action = 'reject' AND v_current_assignment_status IN ('assigned', 'awaiting_assignment') THEN
    IF NULLIF(TRIM(p_reason), '') IS NULL THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    v_next_assignment_status := 'rejected';
    v_next_order_status := 'Awaiting Supplier';
  ELSIF p_action = 'processing' AND v_current_assignment_status = 'accepted' THEN
    v_next_assignment_status := 'processing';
    v_next_order_status := 'Processing';
  ELSIF p_action = 'packed' AND v_current_assignment_status = 'processing' THEN
    v_next_assignment_status := 'packed';
    v_next_order_status := 'Packed';
  ELSIF p_action = 'dispatched' AND v_current_assignment_status = 'packed' THEN
    IF NULLIF(TRIM(p_courier), '') IS NULL OR NULLIF(TRIM(p_tracking_number), '') IS NULL THEN
      RAISE EXCEPTION 'Courier and tracking number are required';
    END IF;
    v_next_assignment_status := 'dispatched';
    v_next_order_status := 'Dispatched';
  ELSE
    RAISE EXCEPTION 'This status transition is not allowed';
  END IF;

  UPDATE public.supplier_assignments
  SET status = v_next_assignment_status,
      reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE reason END,
      updated_at = v_now
  WHERE id = p_assignment_id;

  UPDATE public.orders SET status = v_next_order_status, updated_at = v_now WHERE id = v_order_id;

  INSERT INTO public.order_status_history (order_id, previous_status, new_status, actor_id, actor_role, notes)
  VALUES (v_order_id, v_current_order_status::TEXT, v_next_order_status::TEXT, p_supplier_profile_id, 'supplier', p_action);

  IF p_action = 'dispatched' THEN
    INSERT INTO public.shipments (order_id, supplier_assignment_id, courier_name, tracking_number, shipping_status, dispatched_at)
    VALUES (v_order_id, p_assignment_id, p_courier, p_tracking_number, 'dispatched', v_now);
  END IF;

  RETURN jsonb_build_object('assignmentId', p_assignment_id, 'orderNumber', v_order_number, 'assignmentStatus', v_next_assignment_status, 'orderStatus', v_next_order_status);
END;
$$;

REVOKE ALL ON FUNCTION public.transition_supplier_assignment(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_supplier_assignment(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
