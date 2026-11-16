export default function ContactPage() {
  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Contact us</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Let us help you source better.</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-8">
          <div className="space-y-5 text-[#4d5b54]">
            <p><strong className="text-[#12372a]">Email:</strong> support@royalvanam.in</p>
            <p><strong className="text-[#12372a]">Phone:</strong> +91 98765 43210</p>
            <p><strong className="text-[#12372a]">Address:</strong> 42 Heritage Lane, Bengaluru, Karnataka 560001</p>
          </div>
        </div>

        <form className="space-y-4 rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-8">
          <input className="w-full rounded-xl border border-[#d9caa4] bg-white px-4 py-3" placeholder="Your name" />
          <input className="w-full rounded-xl border border-[#d9caa4] bg-white px-4 py-3" placeholder="Email address" />
          <textarea className="w-full rounded-xl border border-[#d9caa4] bg-white px-4 py-3" rows={5} placeholder="How can we help?" />
          <button className="rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8]">Send enquiry</button>
        </form>
      </div>
    </div>
  );
}
