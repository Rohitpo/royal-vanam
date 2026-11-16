import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e8dcc0] bg-[#fffdf9] shadow-[0_16px_48px_rgba(18,55,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_56px_rgba(18,55,42,0.14)]">
      <div className="relative aspect-[7/10] overflow-hidden bg-[#102a18]">
        <Image src={product.image} alt={`${product.name} product poster`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8e7a53]">{product.category} <span className="px-1 text-[#c2ad77]">·</span> {product.origin}</p>
            <h3 className="mt-2 text-xl font-semibold text-[#12372a]">{product.name}</h3>
          </div>
          <div className="rounded-full bg-[#efe2bf] px-2 py-1 text-xs font-medium text-[#785d23]">
            {product.discount}% off
          </div>
        </div>

        <p className="line-clamp-4 min-h-24 text-sm leading-6 text-[#4d5b54]">{product.description}</p>

        <div className="flex items-center justify-between text-sm text-[#4d5b54]">
          <span>Starting at</span>
          <span className="text-xl font-semibold text-[#12372a]">
            {formatCurrency(product.weightPrices?.[product.weights[0] ?? ""] ?? product.retailPrice)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7a6e58]">
          <span>MRP {formatCurrency(product.mrp)}</span>
          <span>•</span>
          <span>{product.weights.join(" / ")}</span>
        </div>

        <div className="mt-auto flex gap-3 pt-2">
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 rounded-full border border-[#12372a] px-4 py-3 text-center text-sm font-medium text-[#12372a]"
          >
            View Details
          </Link>
          <AddToCartButton product={product} weight={product.weights[0] ?? "Standard"} />
        </div>
      </div>
    </article>
  );
}
