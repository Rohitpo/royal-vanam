import Image from "next/image";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/royal-vanam-assets/tree-emblem.png"
      alt="Royal Vanam crowned tree emblem"
      width={120}
      height={120}
      className={`object-contain ${className}`}
      priority
    />
  );
}
