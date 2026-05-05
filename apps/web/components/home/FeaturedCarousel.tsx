"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselPrev,
  CarouselNext,
} from "@/components/ui/Carousel";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { categoryImageMap } from "@/lib/images";
import { cn } from "@/lib/cn";

type FeaturedItem = {
  id: string;
  name: string;
  description: string;
  priceFrom: number;
  minOrder: number;
  category: string;
  categorySlug: string;
  badge?: string;
};

const featuredProducts: FeaturedItem[] = [
  {
    id: "1",
    name: "Executive Gift Hamper",
    description: "Premium snacks, drinkware & keepsakes in a branded box.",
    priceFrom: 2499,
    minOrder: 25,
    category: "Corporate Gift Sets",
    categorySlug: "corporate-gift-sets",
    badge: "Bestseller",
  },
  {
    id: "2",
    name: "Insulated Travel Mug",
    description: "Double-wall steel with laser engraving or full-wrap print.",
    priceFrom: 449,
    minOrder: 50,
    category: "Drinkware",
    categorySlug: "drinkware",
  },
  {
    id: "3",
    name: "Laptop Backpack Pro",
    description: "Padded compartment, USB pass-through, subtle logo placement.",
    priceFrom: 1299,
    minOrder: 30,
    category: "Bags & Backpacks",
    categorySlug: "bags-backpacks",
    badge: "New",
  },
  {
    id: "4",
    name: "Embroidered Polo Shirt",
    description: "Cotton blend, corporate colours, durable stitch branding.",
    priceFrom: 599,
    minOrder: 100,
    category: "Apparel",
    categorySlug: "apparel",
  },
  {
    id: "5",
    name: "Branded Wireless Earbuds",
    description: "Compact case with UV print or debossed logo.",
    priceFrom: 1899,
    minOrder: 50,
    category: "Tech & Gadgets",
    categorySlug: "tech-gadgets",
    badge: "Hot",
  },
  {
    id: "6",
    name: "Leatherette Notebook Set",
    description: "A5 journal, pen loop, and matching pen — gift-ready.",
    priceFrom: 799,
    minOrder: 40,
    category: "Stationery",
    categorySlug: "stationery",
  },
];

const formatInr = (n: number) => n.toLocaleString("en-IN");

export function FeaturedCarousel() {
  return (
    <section id="featured" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Featured picks</span>
            <h2 className="section-heading mt-4">
              Popular for corporate programs
            </h2>
            <p className="section-subheading">
              Indicative pricing — final quote depends on specs, print areas and volume.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
          >
            View full catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Carousel options={{ align: "start", loop: false }}>
          <CarouselTrack className="-mx-2">
            {featuredProducts.map((p) => (
              <CarouselSlide
                key={p.id}
                basis="85%"
                className="px-2 sm:[&]:basis-1/2 lg:[&]:basis-1/3 xl:[&]:basis-1/4"
              >
                <article className="group h-full card flex flex-col overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                    <ImageWithFallback
                      src={categoryImageMap[p.categorySlug]?.src}
                      alt={p.name}
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw"
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="badge-green absolute left-3 top-3 !text-[10px]">
                      {p.category}
                    </span>
                    {p.badge && (
                      <span
                        className={cn(
                          "absolute right-3 top-3 !text-[10px]",
                          p.badge === "Hot"
                            ? "badge-rose"
                            : p.badge === "New"
                              ? "badge-gold"
                              : "badge-outline",
                        )}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-lotus-emerald-800 transition-colors">
                      {p.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">
                      {p.description}
                    </p>
                    <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-stone-100 pt-4">
                      <p className="text-lg font-bold text-lotus-emerald-800">
                        From ₹{formatInr(p.priceFrom)}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        MOQ {p.minOrder}
                      </p>
                    </div>
                    <Link
                      href="/request-quote"
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-lotus-emerald-50 px-3 py-2 text-sm font-semibold text-lotus-emerald-800 hover:bg-lotus-emerald-100 transition-colors"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Add to Quote
                    </Link>
                  </div>
                </article>
              </CarouselSlide>
            ))}
          </CarouselTrack>
          <div className="mt-6 flex items-center justify-end gap-2">
            <CarouselPrev />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
