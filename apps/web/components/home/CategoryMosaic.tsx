"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { SectionShell } from "@/components/ui/SectionShell";
import { mockCategories } from "@/lib/mock-data";

export function CategoryMosaic() {
  return (
    <SectionShell
      eyebrow={<span className="eyebrow">Our specials</span>}
      heading="Curated categories for every brief"
      subheading="From welcome kits to festive hampers — pick a category to start, or filter by what your audience needs."
      action={
        <Link
          href="/products"
          className="btn-outline rounded-full"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {mockCategories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="group relative flex flex-col items-center text-center rounded-3xl bg-white border border-stone-100 p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300"
          >
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full ring-4 ring-stone-50 group-hover:ring-brand-pink-100 transition-all">
              <ImageWithFallback
                src={c.imageUrl}
                alt={c.name}
                sizes="120px"
                className="group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-brand-ink-900">
              {c.name}
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {c._count?.products ?? 0} products
            </p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
