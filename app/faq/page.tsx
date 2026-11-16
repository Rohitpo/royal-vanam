import { faqs } from "@/lib/data";

export default function FaqPage() {
  return (
    <div className="container-shell py-16">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">FAQ</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Frequently asked questions</h1>
      </div>

      <div className="mx-auto max-w-4xl space-y-5">
        {faqs.map((item) => (
          <div key={item.question} className="rounded-[24px] border border-[#e6d7b1] bg-[#fffdf9] p-6">
            <h2 className="text-xl font-semibold text-[#12372a]">{item.question}</h2>
            <p className="mt-3 text-base leading-7 text-[#4d5b54]">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
