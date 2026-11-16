CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_weight_unique
  ON public.product_variants(product_id, weight_label);

UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE (p.name = 'Natural Honey' AND c.slug = 'natural-honey')
   OR (p.name IN ('Black Pepper', 'White Pepper', 'Turmeric', 'Cardamom') AND c.slug = 'spices');

-- Seed configurable starter package sizes once. Prices are seed data; live checkout
-- always reads the current variant rows from PostgreSQL.
INSERT INTO public.product_variants (
  product_id, weight_label, retail_price, wholesale_price, mrp,
  stock_quantity, min_order_qty, available
)
SELECT
  p.id,
  v.weight_label,
  ROUND(p.retail_price * v.price_factor, 2),
  CASE WHEN p.wholesale_price IS NULL THEN NULL ELSE ROUND(p.wholesale_price * v.price_factor, 2) END,
  CASE WHEN p.mrp IS NULL THEN NULL ELSE ROUND(p.mrp * v.price_factor, 2) END,
  GREATEST(1, FLOOR(p.stock_quantity * v.stock_factor)::INTEGER),
  v.min_order_qty,
  p.available
FROM public.products p
CROSS JOIN (VALUES
  ('100g', 0.28::NUMERIC, 0.45::NUMERIC, 1),
  ('250g', 0.58::NUMERIC, 0.70::NUMERIC, 1),
  ('500g', 1.00::NUMERIC, 0.90::NUMERIC, 1),
  ('1kg', 1.85::NUMERIC, 0.45::NUMERIC, 1)
) AS v(weight_label, price_factor, stock_factor, min_order_qty)
ON CONFLICT (product_id, weight_label) DO NOTHING;
