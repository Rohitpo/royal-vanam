import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container-shell py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Our story</p>
        <h1 className="mt-4 font-serif text-5xl text-[#12372a]">A legacy rooted in the earth.</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6 text-lg leading-8 text-[#4d5b54]">
          <p>
            Royal Vanam began with a simple conviction: the purest ingredients deserve transparent sourcing, disciplined care and honest stewardship.
          </p>
          <p>
            We work closely with Indian growers, beekepers and family-run farms to recover ingredients that carry a sense of place, resilience and tradition.
          </p>
          <p>
            Every origin story, every harvest and every pack is designed to reconnect people with food that honors both health and heritage.
          </p>
        </div>
        <Image
          src="/coverpages.jpeg"
          alt="Royal Vanam cover artwork featuring its crowned tree emblem and natural products"
          width={1402}
          height={1081}
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="h-auto max-h-[480px] w-full rounded-[28px] bg-[#102a18] object-contain shadow-lg"
        />
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          ["Traceable", "Every batch is mapped to a region, origin and farm partner."],
          ["Pure", "No shortcuts, no compromises, no hidden blends."],
          ["Heritage", "Guided by the values of mindful family agriculture."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-[28px] border border-[#e2d4a2] bg-[#fffdf9] p-6">
            <h3 className="text-2xl font-semibold text-[#12372a]">{title}</h3>
            <p className="mt-4 text-base leading-7 text-[#4d5b54]">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-[32px] bg-[#12372a] p-8 text-[#f8f3e8]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#f2d38a]">Our promise</p>
            <h3 className="mt-3 font-serif text-3xl">Food that reflects the land and the people behind it.</h3>
          </div>
          <Link href="/shop" className="rounded-full bg-[#f8f3e8] px-6 py-3 text-sm font-medium text-[#12372a]">
            Explore the range
          </Link>
        </div>
      </div>
    </div>
  );
}
