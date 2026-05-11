"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";

export function PromoBanners() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Link
          href="/products?wholesale=true"
          className="group relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-800 p-8 sm:p-10 text-white shadow-elevated hover:-translate-y-0.5 transition-all"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <Sparkles
            aria-hidden
            className="absolute right-6 top-6 h-6 w-6 text-brand-pink-200/80 animate-pulse-soft"
          />
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide">
            Wholesale
          </span>
          <h3 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold leading-tight max-w-md">
            Volume pricing for procurement teams
          </h3>
          <p className="mt-3 text-sm sm:text-base text-white/85 max-w-md">
            Tiered savings start at 50 units. Free mockups, dedicated coordinator,
            and pan-India dispatch in 5 days.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-brand-green-800 px-5 py-2.5 text-sm font-bold group-hover:bg-brand-pink-50 group-hover:text-brand-pink-700 transition-colors">
            See wholesale tiers
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link
          href="/categories/eco-friendly"
          className="group relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-pink-500 via-brand-pink-600 to-brand-pink-800 p-8 sm:p-10 text-white shadow-elevated hover:-translate-y-0.5 transition-all"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <Leaf
            aria-hidden
            className="absolute right-6 top-6 h-6 w-6 text-brand-green-200/80 animate-pulse-soft"
          />
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide">
            Sustainability
          </span>
          <h3 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold leading-tight max-w-md">
            Eco-conscious gifting collection
          </h3>
          <p className="mt-3 text-sm sm:text-base text-white/85 max-w-md">
            Bamboo, recycled PET, jute and reclaimed cotton — production-grade
            picks that align with your ESG goals.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-brand-pink-700 px-5 py-2.5 text-sm font-bold group-hover:bg-brand-green-50 group-hover:text-brand-green-700 transition-colors">
            Explore eco picks
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </section>
  );
}
