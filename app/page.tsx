import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import { categories, testimonials } from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(180,143,58,0.18),transparent_38%),linear-gradient(180deg,#f7f3ea_0%,#efe7d6_100%)]">
        <div className="container-shell grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c79d] bg-[#fffdf9]/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#7c6a4d]">
              Nature • Heritage • Purity
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl font-serif text-5xl leading-[1.05] tracking-tight text-[#12372a] md:text-6xl">
                A Legacy Born from the Earth.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[#4d5b54]">
                Handpicked from Indian farms, crafted with generations of care, and delivered with the integrity of a heritage brand.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8] shadow-lg shadow-[#12372a]/15"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-[#12372a] px-6 py-3 text-sm font-medium text-[#12372a]"
              >
                Our Heritage
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 pt-4 text-sm text-[#4d5b54]">
              <div>
                <div className="text-2xl font-semibold text-[#12372a]">100%</div>
                <div>Natural sourcing</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#12372a]">5000+</div>
                <div>Happy families</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#12372a]">Traceable</div>
                <div>From farm to pantry</div>
              </div>
            </div>
          </div>

          <div className="flex h-[clamp(280px,38vw,440px)] items-center justify-center overflow-hidden rounded-[28px] border border-[#e4d7b8] bg-[#fbf7ed] p-4 shadow-[0_20px_60px_rgba(18,55,42,0.1)] sm:rounded-[32px] sm:p-7">
            <Image
              src="/royal-vanam-assets/tree-emblem.png"
              alt="Royal Vanam crowned tree emblem"
              width={2000}
              height={1360}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#7c6a4d]">Featured Collection</p>
            <h2 className="mt-3 font-serif text-4xl text-[#12372a]">Pure essentials, beautifully sourced.</h2>
          </div>
          <Link href="/shop" className="hidden rounded-full border border-[#12372a] px-5 py-2 text-sm font-medium text-[#12372a] md:inline-flex">
            Shop All
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <Suspense fallback={<p className="text-sm text-[#7a6e58]" role="status">Loading featured products…</p>}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      <section className="bg-[#11362d] py-16 text-[#f8f3e8]">
        <div className="container-shell grid gap-8 lg:grid-cols-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#f2d38a]">{category.badge}</div>
              <h3 className="text-2xl font-semibold">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[#e7e1d5]">{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="mb-10 flex items-center gap-4">
          <div className="gold-line" />
          <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Our sourcing story</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Image
            src="/coverpages.jpeg"
            alt="Royal Vanam cover artwork featuring its crowned tree emblem and natural products"
            width={1402}
            height={1081}
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="h-auto max-h-[480px] w-full rounded-[28px] bg-[#102a18] object-contain shadow-[0_20px_60px_rgba(18,55,42,0.12)]"
          />
          <div className="space-y-6">
            <h2 className="font-serif text-4xl text-[#12372a]">Rooted in Indian soil, guided by real relationships.</h2>
            <p className="text-lg leading-8 text-[#4d5b54]">
              We work with family growers, cooperative networks and traceable harvests across India’s most fertile regions to preserve the integrity of every batch.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e4d8b7] bg-[#fffdf9] p-5">
                <div className="text-3xl font-semibold text-[#12372a]">32+</div>
                <div className="mt-2 text-sm text-[#615a50]">Farmer communities</div>
              </div>
              <div className="rounded-2xl border border-[#e4d8b7] bg-[#fffdf9] p-5">
                <div className="text-3xl font-semibold text-[#12372a]">7</div>
                <div className="mt-2 text-sm text-[#615a50]">Origin regions</div>
              </div>
              <div className="rounded-2xl border border-[#e4d8b7] bg-[#fffdf9] p-5">
                <div className="text-3xl font-semibold text-[#12372a]">24/7</div>
                <div className="mt-2 text-sm text-[#615a50]">Quality assurance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3ebdc] py-16">
        <div className="container-shell">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Customer love</p>
            <h2 className="mt-3 font-serif text-4xl text-[#12372a]">Stories from our community.</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((entry) => (
              <article key={entry.name} className="rounded-[28px] border border-[#e1d1a9] bg-[#fffdf9] p-6 shadow-sm">
                <div className="mb-4 text-3xl text-[#b48f3a]">“</div>
                <p className="text-base leading-7 text-[#4d5b54]">{entry.quote}</p>
                <div className="mt-6 border-t border-[#e6d9b3] pt-4">
                  <div className="font-semibold text-[#12372a]">{entry.name}</div>
                  <div className="text-sm text-[#7a6e58]">{entry.role}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="grid gap-8 rounded-[30px] border border-[#e2d3a4] bg-[#fffdf9] p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Stay connected</p>
            <h2 className="mt-3 font-serif text-4xl text-[#12372a]">Bring nature to your pantry.</h2>
          </div>
          <form className="flex w-full max-w-md gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border border-[#d2c097] bg-[#fffdf9] px-4 py-3 text-sm text-[#12372a] outline-none ring-0"
            />
            <button type="submit" className="rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8]">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

async function FeaturedProducts() {
  const products = await getCatalogProducts();
  return products.map((product) => <ProductCard key={product.id} product={product} />);
}
