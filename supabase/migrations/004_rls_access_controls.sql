-- Replace the permissive starter policies with role- and ownership-scoped policies.
-- SECURITY DEFINER helpers avoid recursive profile-policy lookups.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin'::user_role, FALSE);
$$;

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS customers_admin_all ON public.customers;
DROP POLICY IF EXISTS suppliers_admin_all ON public.suppliers;
DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS categories_public_read ON public.categories;
DROP POLICY IF EXISTS inventory_admin_all ON public.inventory;
DROP POLICY IF EXISTS orders_customer_own ON public.orders;
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
DROP POLICY IF EXISTS supplier_assignment_isolation ON public.supplier_assignments;

CREATE POLICY profiles_read_self_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (id = auth.uid() AND role = public.current_user_role())
  );
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY customers_read_owner_or_admin ON public.customers
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY customers_admin_write ON public.customers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY suppliers_read_self_or_admin ON public.suppliers
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY suppliers_admin_write ON public.suppliers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY supplier_addresses_read_owner_or_admin ON public.supplier_addresses
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR supplier_id IN (SELECT id FROM public.suppliers WHERE profile_id = auth.uid())
  );
CREATE POLICY supplier_addresses_admin_write ON public.supplier_addresses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_public_read ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE OR public.is_admin());
CREATE POLICY categories_admin_write ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING ((available = TRUE) OR public.is_admin());
CREATE POLICY products_admin_write ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY product_variants_public_read ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (
    available = TRUE
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.available = TRUE)
  );
CREATE POLICY product_variants_admin_write ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY product_images_public_read ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.available = TRUE));
CREATE POLICY product_images_admin_write ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY inventory_admin_all ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY inventory_transactions_admin_all ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY carts_read_owner_or_admin ON public.carts
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY carts_insert_owner ON public.carts
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY carts_update_owner ON public.carts
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY cart_items_read_owner_or_admin ON public.cart_items
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR cart_id IN (SELECT id FROM public.carts WHERE customer_id = auth.uid())
  );
CREATE POLICY cart_items_write_owner ON public.cart_items
  FOR ALL TO authenticated
  USING (cart_id IN (SELECT id FROM public.carts WHERE customer_id = auth.uid()))
  WITH CHECK (cart_id IN (SELECT id FROM public.carts WHERE customer_id = auth.uid()));

CREATE POLICY addresses_read_owner_or_admin ON public.addresses
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY addresses_write_owner ON public.addresses
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY orders_customer_read ON public.orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY orders_admin_write ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY order_items_customer_read ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY order_items_admin_write ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY supplier_assignments_read_scoped ON public.supplier_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR supplier_id IN (SELECT id FROM public.suppliers WHERE profile_id = auth.uid())
  );
CREATE POLICY supplier_assignments_admin_write ON public.supplier_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY shipments_customer_supplier_admin_read ON public.shipments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.supplier_assignments sa
      JOIN public.suppliers s ON s.id = sa.supplier_id
      WHERE sa.id = supplier_assignment_id AND s.profile_id = auth.uid()
    )
  );
CREATE POLICY shipments_admin_write ON public.shipments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY payments_customer_read ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY payments_admin_write ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY invoices_customer_read ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY invoices_admin_write ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY coupons_public_active_read ON public.coupons
  FOR SELECT TO anon, authenticated
  USING (active = TRUE OR public.is_admin());
CREATE POLICY coupons_admin_write ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY wholesale_applications_owner_read ON public.wholesale_applications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
  );
CREATE POLICY wholesale_applications_owner_insert ON public.wholesale_applications
  FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()));
CREATE POLICY wholesale_applications_admin_write ON public.wholesale_applications
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY notifications_read_recipient_or_admin ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin());
CREATE POLICY notifications_admin_write ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY order_history_customer_supplier_admin_read ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.supplier_assignments sa
      JOIN public.suppliers s ON s.id = sa.supplier_id
      WHERE sa.order_id = order_id AND s.profile_id = auth.uid()
    )
  );
CREATE POLICY order_history_admin_write ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY supplier_purchase_orders_supplier_read ON public.supplier_purchase_orders
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR supplier_id IN (SELECT id FROM public.suppliers WHERE profile_id = auth.uid())
  );
CREATE POLICY supplier_purchase_orders_admin_write ON public.supplier_purchase_orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY supplier_payments_supplier_read ON public.supplier_payments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR supplier_id IN (SELECT id FROM public.suppliers WHERE profile_id = auth.uid())
  );
CREATE POLICY supplier_payments_admin_write ON public.supplier_payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY audit_logs_admin_only ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
