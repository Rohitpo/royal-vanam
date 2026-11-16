import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/catalog";

export default function ShopPage() {
  return (
    <div className="container-shell py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Shop all</p>
          <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Curated pantry essentials.</h1>
        </div>
        <div className="rounded-full border border-[#d6c8a3] bg-[#fffdf9] px-4 py-2 text-sm text-[#4d5b54]">
          5 products
        </div>
      </div>

      <div className="mb-10 flex flex-wrap gap-3 text-sm">
        {"All, Honey, Spices, Wellness, Gift Boxes".split(", ").map((label) => (
          <button key={label} className="rounded-full border border-[#d5c9a2] bg-[#fffdf9] px-4 py-2 text-[#12372a]">
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<p className="text-sm text-[#7a6e58]" role="status">Loading products…</p>}>
          <ShopProducts />
        </Suspense>
      </div>
    </div>
  );
}

async function ShopProducts() {
  const products = await getCatalogProducts();
  return products.map((product) => <ProductCard key={product.id} product={product} />);
}
