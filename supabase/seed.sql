INSERT INTO categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Natural Honey', 'natural-honey', 'Single-origin forest honey'),
  (gen_random_uuid(), 'Spices', 'spices', 'Traceable premium spices'),
  (gen_random_uuid(), 'Wellness', 'wellness', 'Essentials for daily wellness'),
  (gen_random_uuid(), 'Gift Boxes', 'gift-boxes', 'Curated gifting collections')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO products (id, sku, name, slug, description, origin_country, origin_region, retail_price, wholesale_price, mrp, discount_percentage, stock_quantity, min_order_qty, available, packaging_info, quality_certificates)
VALUES
  (gen_random_uuid(), 'RV-HNY-001', 'Natural Honey', 'natural-honey', 'Raw forest honey with rich aroma and medicinal depth.', 'India', 'Western Ghats', 580, 470, 720, 20, 220, 12, true, 'Glass jar with food-safe seal.', '["FSSAI", "Organic Traceability"]'),
  (gen_random_uuid(), 'RV-BPE-002', 'Black Pepper', 'black-pepper', 'Premium Malabar black pepper with warm aromatic body.', 'India', 'Kerala', 335, 260, 420, 20, 310, 20, true, 'Food-grade resealable pouch.', '["APEDA", "Traceable origin"]'),
  (gen_random_uuid(), 'RV-WPE-003', 'White Pepper', 'white-pepper', 'Finely processed white pepper with mellow finish.', 'India', 'Tamil Nadu', 360, 290, 450, 20, 160, 20, true, 'Vacuum sealed pouch.', '["ISO Certified", "Quality tested"]'),
  (gen_random_uuid(), 'RV-TUR-004', 'Turmeric', 'turmeric', 'Bright, earthy turmeric with deep golden quality.', 'India', 'Nashik', 315, 245, 390, 19, 290, 25, true, 'Resealable kraft pouch.', '["Botanical purity", "Aflatoxin tested"]'),
  (gen_random_uuid(), 'RV-CAR-005', 'Cardamom', 'cardamom', 'Fragrant hill-grown cardamom with bright citrus notes.', 'India', 'Idukki', 495, 395, 610, 19, 180, 15, true, 'Airtight tin jar.', '["GI certified", "Aroma profile tested"]')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  origin_country = EXCLUDED.origin_country,
  origin_region = EXCLUDED.origin_region,
  retail_price = EXCLUDED.retail_price,
  wholesale_price = EXCLUDED.wholesale_price,
  mrp = EXCLUDED.mrp,
  discount_percentage = EXCLUDED.discount_percentage,
  stock_quantity = EXCLUDED.stock_quantity,
  min_order_qty = EXCLUDED.min_order_qty,
  available = EXCLUDED.available,
  packaging_info = EXCLUDED.packaging_info,
  quality_certificates = EXCLUDED.quality_certificates;
