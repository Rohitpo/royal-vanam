import "server-only";

import { products as demoProducts } from "@/lib/data";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Product } from "@/lib/types";

type DbProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  origin_country: string | null;
  origin_region: string | null;
  retail_price: number | string;
  wholesale_price: number | string | null;
  mrp: number | string | null;
  discount_percentage: number | string | null;
  stock_quantity: number;
  min_order_qty: number;
  available: boolean;
  packaging_info: string | null;
  quality_certificates: unknown;
  category_id: string | null;
};

type DbVariant = {
  product_id: string;
  weight_label: string;
  retail_price: number | string;
  stock_quantity: number;
  available: boolean;
};

type DbImage = { product_id: string; image_url: string; is_primary: boolean };

function numberOr(value: number | string | null, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export async function getCatalogProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return demoProducts;

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, sku, name, slug, description, origin_country, origin_region, retail_price, wholesale_price, mrp, discount_percentage, stock_quantity, min_order_qty, available, packaging_info, quality_certificates, category_id")
    .eq("available", true)
    .order("name");

  if (productError || !productRows) {
    console.error("Catalog query failed:", productError?.message);
    return [];
  }

  const rows = productRows as unknown as DbProduct[];
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const categoryIds = [...new Set(rows.flatMap((row) => row.category_id ? [row.category_id] : []))];

  const [variantResult, imageResult, categoryResult] = await Promise.all([
    supabase.from("product_variants").select("product_id, weight_label, retail_price, stock_quantity, available").in("product_id", ids).eq("available", true),
    supabase.from("product_images").select("product_id, image_url, is_primary").in("product_id", ids),
    categoryIds.length
      ? supabase.from("categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const variants = (variantResult.data ?? []) as unknown as DbVariant[];
  const images = (imageResult.data ?? []) as unknown as DbImage[];
  const categoryNames = new Map((categoryResult.data ?? []).map((category) => [category.id, category.name]));

  return rows.map((row) => {
    const fallback = demoProducts.find((product) => product.slug === row.slug);
    const productVariants = variants.filter((variant) => variant.product_id === row.id);
    const productImages = images.filter((image) => image.product_id === row.id);
    const certificates = Array.isArray(row.quality_certificates)
      ? row.quality_certificates.filter((value): value is string => typeof value === "string")
      : [];
    const retailPrice = numberOr(row.retail_price, fallback?.retailPrice ?? 0);
    const mrp = numberOr(row.mrp, retailPrice);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      description: row.description ?? "",
      category: categoryNames.get(row.category_id ?? "") ?? fallback?.category ?? "Pantry",
      origin: row.origin_country ?? "India",
      region: row.origin_region ?? "India",
      image: productImages.find((image) => image.is_primary)?.image_url ?? productImages[0]?.image_url ?? fallback?.image ?? "/images/product-placeholder.svg",
      weights: productVariants.length ? productVariants.map((variant) => variant.weight_label) : fallback?.weights ?? ["Standard"],
      weightPrices: Object.fromEntries(productVariants.map((variant) => [variant.weight_label, numberOr(variant.retail_price, retailPrice)])),
      weightStock: Object.fromEntries(productVariants.map((variant) => [variant.weight_label, variant.stock_quantity])),
      mrp,
      retailPrice,
      wholesalePrice: numberOr(row.wholesale_price, fallback?.wholesalePrice ?? retailPrice),
      discount: numberOr(row.discount_percentage, mrp > 0 ? Math.round((1 - retailPrice / mrp) * 100) : 0),
      stock: row.stock_quantity,
      minOrderQty: row.min_order_qty,
      available: row.available,
      packaging: row.packaging_info ?? "Food-safe packaging.",
      certificates,
      tags: fallback?.tags ?? [],
    };
  });
}
