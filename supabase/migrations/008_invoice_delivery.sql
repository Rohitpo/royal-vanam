-- Each placed order has one generated order invoice and one secure download link.
-- The invoice PDF itself is generated on demand by the server; invoice_url stores its signed URL.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_order_id_unique
  ON public.invoices(order_id);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ;
