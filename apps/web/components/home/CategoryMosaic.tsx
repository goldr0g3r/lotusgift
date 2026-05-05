"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { categoryImageMap } from "@/lib/images";
import { cn } from "@/lib/cn";

const tiles = [
  { slug: "corporate-gift-sets", name: "Corporate Gift Sets", blurb: "Curated hampers" , span: "lg:col-span-6 lg:row-span-2" },
  { slug: "drinkware", name: "Drinkware", blurb: "Mugs, bottles & flasks", span: "lg:col-span-3" },
  { slug: "bags-backpacks", name: "Bags & Backpacks", blurb: "Travel & laptop bags", span: "lg:col-span-3" },
  { slug: "tech-gadgets", name: "Tech & Gadgets", blurb: "Audio, power & desk", span: "lg:col-span-3" },
  { slug: "stationery", name: "Stationery", blurb: "Notebooks & pens", span: "lg:col-span-3" },
  { slug: "apparel", name: "Apparel", blurb: "Uniforms, polos, caps", span: "lg:col-span-3" },
  { slug: "eco-friendly", name: "Eco Friendly", blurb: "Sustainable picks", span: "lg:col-span-3" },
];

export function CategoryMosaic() {
  return (
    <section id="categories" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Shop by category</span>
            <h2 className="section-heading mt-4">
              Curated lanes for every program
            </h2>
            <p className="section-subheading">
              From everyday merch to premium hampers and recognition gifts.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
          >
            Browse all categories
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-12 lg:auto-rows-[180px] gap-4">
          {tiles.map((t) => (
            <Link
              key={t.slug}
              href={`/categories/${t.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl ring-1 ring-stone-200 shadow-soft hover:shadow-elevated transition-all",
                "min-h-[220px]",
                t.span,
              )}
            >
              <ImageWithFallback
                src={categoryImageMap[t.slug]?.src}
                alt={t.name}
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lotus-gold-300">
                  Collection
                </p>
                <h3 className="mt-1 font-display text-xl font-bold leading-tight">
                  {t.name}
                </h3>
                <p className="mt-1 text-xs text-stone-200/80">{t.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white opacity-90 group-hover:opacity-100">
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
