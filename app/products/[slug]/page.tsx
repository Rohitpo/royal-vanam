import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatCurrency, getProductBySlug } from "@/lib/commerce";
import { products as demoProducts } from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog";
import { ProductPurchaseControls } from "@/components/product-purchase-controls";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container-shell py-16" role="status" aria-live="polite">
          <div className="h-8 w-40 animate-pulse rounded bg-[#e6d7b1]" />
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="h-[420px] animate-pulse rounded-[32px] bg-[#e6d7b1]" />
            <div className="space-y-5">
              <div className="h-10 w-3/4 animate-pulse rounded bg-[#e6d7b1]" />
              <div className="h-32 animate-pulse rounded-[24px] bg-[#e6d7b1]" />
            </div>
          </div>
          <span className="sr-only">Loading product details</span>
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await getCatalogProducts();
  const product = getProductBySlug(products, slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="container-shell py-16">
      <div className="mb-8 text-sm text-[#7c6a4d]">
        <Link href="/shop">Shop</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[32px] border border-[#d9c99f] bg-[radial-gradient(circle_at_top,_rgba(180,143,58,0.12),transparent_48%),#f1eadb] p-3 shadow-[0_20px_60px_rgba(18,55,42,0.12)] sm:p-5">
          <div className="absolute left-6 top-6 z-10 rounded-full border border-white/20 bg-[#12372a]/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#f8f3e8] shadow-lg">
            {product.category} · {product.region}
          </div>
          <Image src={product.image} alt={`${product.name} Royal Vanam product poster`} width={1200} height={1400} sizes="(max-width: 1024px) 100vw, 50vw" className="max-h-[720px] w-full rounded-[24px] object-contain" />
        </div>
        <div className="space-y-8">
          <div>
            <p className="inline-flex rounded-full border border-[#d9c99f] bg-[#fffdf9] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#7c6a4d]">{product.category} · Single origin</p>
            <h1 className="mt-5 font-serif text-5xl leading-tight text-[#12372a]">{product.name}</h1>
            <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#8e7a53]">Thoughtfully sourced in {product.region}</p>
          </div>

          <div className="rounded-[24px] border border-[#e5d9b4] bg-[linear-gradient(135deg,#fffdf9_0%,#f8f1e2_100%)] p-6 shadow-sm">
            <div className="mb-4 text-xs uppercase tracking-[0.22em] text-[#7c6a4d]">A natural essential, thoughtfully sourced</div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-semibold text-[#12372a]">{formatCurrency(product.retailPrice)}</div>
              <div className="text-lg text-[#7a6e58] line-through">{formatCurrency(product.mrp)}</div>
              <div className="rounded-full bg-[#efe2bf] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#785d23]">
                {product.discount}% OFF
              </div>
            </div>
            <p className="mt-3 text-[#4d5b54]">{product.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8e7a53]">Origin</div>
              <div className="mt-2 text-sm font-medium text-[#12372a]">{product.region}</div>
            </div>
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8e7a53]">Quality</div>
              <div className="mt-2 text-sm font-medium text-[#12372a]">Carefully selected</div>
            </div>
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8e7a53]">Packed with care</div>
              <div className="mt-2 text-sm font-medium text-[#12372a]">{product.packaging}</div>
            </div>
          </div>

          <ProductPurchaseControls product={product} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Origin</div>
              <div className="mt-2 text-[#12372a]">{product.region}</div>
            </div>
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">Stock</div>
              <div className="mt-2 text-[#12372a]">{product.stock} units</div>
            </div>
            <div className="rounded-2xl border border-[#e9dfc2] bg-[#fffdf9] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[#7c6a4d]">MOQ</div>
              <div className="mt-2 text-[#12372a]">{product.minOrderQty}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Product details</h2>
          <ul className="mt-5 space-y-3 text-[#4d5b54]">
            <li>Packaging: {product.packaging}</li>
            <li>Origin: {product.origin} • {product.region}</li>
            <li>Certificates: {product.certificates.join(", ")}</li>
            <li>Availability: {product.available ? "In stock" : "Currently unavailable"}</li>
          </ul>
        </div>
        <div className="rounded-[28px] border border-[#e7d8b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Why people choose it</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f2ebdb] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#6a5d3d]">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
