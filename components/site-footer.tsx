import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d9c7a0] bg-[#102a22] text-[#f4efe5]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 font-serif text-2xl tracking-[0.2em]">ROYAL VANAM</div>
          <p className="max-w-sm text-sm text-[#d9dcc8]">
            A legacy born from the earth, curated from India’s most trusted farms and family-run origins.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f2d38a]">Explore</h3>
          <ul className="space-y-3 text-sm text-[#e6e1d5]">
            <li><Link href="/shop">Shop All</Link></li>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f2d38a]">Policies</h3>
          <ul className="space-y-3 text-sm text-[#e6e1d5]">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms & Conditions</Link></li>
            <li><Link href="/shipping">Shipping & Returns</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f2d38a]">Support</h3>
          <ul className="space-y-3 text-sm text-[#e6e1d5]">
            <li>support@royalvanam.in</li>
            <li>+91 98765 43210</li>
            <li>Mon-Sat • 9:00AM - 6:00PM</li>
            <li><Link href="/supplier">Supplier Portal</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
