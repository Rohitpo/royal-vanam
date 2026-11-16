"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container-shell py-20 text-center">
      <h1 className="font-serif text-5xl text-[#12372a]">Something went wrong.</h1>
      <button onClick={() => reset()} className="mt-8 rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">
        Try again
      </button>
    </div>
  );
}
