import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shell py-20 text-center">
      <div className="mb-6 text-6xl">🌿</div>
      <h1 className="font-serif text-5xl text-[#12372a]">Page not found</h1>
      <p className="mt-4 text-lg text-[#4d5b54]">The page you are looking for has moved or does not exist.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">
        Return home
      </Link>
    </div>
  );
}
