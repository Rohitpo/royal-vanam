import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CartCount } from "@/components/cart-count";
import { HeaderAccountMenu } from "@/components/header-account-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#f9f5ee]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#b48f3a] bg-[#fbf7ed] p-0.5 shadow-sm">
            <BrandMark className="h-full w-full" />
          </div>
          <div>
            <div className="font-serif text-2xl tracking-[0.2em] text-[#12372a]">ROYAL VANAM</div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#7c6a4d]">Legacy Born from the Earth</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#214034] md:flex">
          <Link href="/about">About</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/products/natural-honey">Products</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <HeaderAccountMenu />
          <Link href="/cart" className="rounded-full bg-[#12372a] px-4 py-2 text-[#f8f3e8] shadow-sm">
            <CartCount />
          </Link>
        </div>
      </div>
    </header>
  );
}
