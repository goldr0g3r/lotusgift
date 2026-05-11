"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselPrev,
  CarouselNext,
} from "@/components/ui/Carousel";
import { ProductCard } from "@/components/catalog/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export function FeaturedCarousel() {
  const items = mockProducts.filter((p) => p.isFeatured);
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20 bg-stone-50/60 border-y border-stone-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-pink-500" />
              Featured this season
            </span>
            <h2 className="section-heading mt-3">Fresh picks for your next campaign</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="btn-outline rounded-full hidden sm:inline-flex"
            >
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <Carousel options={{ align: "start", containScroll: "trimSnaps" }}>
          <CarouselTrack className="-ml-4">
            {items.map((p) => (
              <CarouselSlide
                key={p.id}
                basis="80%"
                className="pl-4 sm:basis-1/2 lg:basis-1/3"
              >
                <ProductCard product={p} />
              </CarouselSlide>
            ))}
          </CarouselTrack>
          <div className="mt-6 flex items-center gap-2 justify-end">
            <CarouselPrev />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
