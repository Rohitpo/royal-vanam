import { buildOrderStatusHistory } from "@/lib/commerce";

export default function TrackPage() {
  const history = buildOrderStatusHistory();

  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Track order</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">RV-1042</h1>
      </div>

      <div className="rounded-[32px] border border-[#e6d7b1] bg-[#fffdf9] p-8 shadow-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm text-[#4d5b54]">Current status</div>
            <div className="mt-2 text-2xl font-semibold text-[#12372a]">Dispatched</div>
          </div>
          <div className="rounded-full bg-[#dfeecf] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#244a2d]">Courier: Blue Dart</div>
        </div>

        <div className="space-y-5">
          {history.map((entry, index) => (
            <div key={entry.status} className="flex items-center gap-4">
              <div className={`flex h-4 w-4 rounded-full ${index < history.length - 1 ? "bg-[#12372a]" : "bg-[#b48f3a]"}`} />
              <div className="flex-1 rounded-2xl border border-[#efe0b7] bg-[#fcf6ea] p-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-[#12372a]">{entry.status}</span>
                  <span className="text-sm text-[#4d5b54]">{entry.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
