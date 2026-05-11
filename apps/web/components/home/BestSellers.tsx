"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell } from "@/components/ui/SectionShell";
import { StarRating } from "@/components/ui/StarRating";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatInr } from "@/components/ui/PriceTag";
import { mockProducts } from "@/lib/mock-data";

export function BestSellers() {
  const items = mockProducts
    .filter((p) => (p.rating ?? 0) >= 4.7)
    .slice(0, 4);
  return (
    <SectionShell
      eyebrow={<span className="eyebrow-pink">Best sellers</span>}
      heading="Top picks from our catalog"
      subheading="High-rated favourites that consistently ship in volume — perfect starting points for your next campaign."
      action={
        <Link href="/products" className="btn-outline rounded-full">
          Browse all
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group rounded-3xl bg-white border border-stone-100 p-3 sm:p-4 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-stone-50">
                <ImageWithFallback
                  src={p.imageUrl}
                  alt={p.name}
                  sizes="120px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-brand-ink-700">
                  Details
                </span>
                <p className="mt-2 text-base sm:text-lg font-extrabold text-brand-ink-900 tabular-nums">
                  {formatInr(p.priceFrom)}
                </p>
                <StarRating
                  value={p.rating ?? 4.5}
                  size="sm"
                  reviews={p.reviews}
                  className="mt-1"
                />
                <p className="mt-2 text-[11px] font-medium text-stone-500">
                  MOQ {p.minOrderQty}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-brand-ink-900 line-clamp-2">
              {p.name}
            </p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
