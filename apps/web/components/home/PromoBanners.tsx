"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { promoBanners } from "@/lib/images";
import { cn } from "@/lib/cn";

export function PromoBanners() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2">
        {promoBanners.map((b) => (
          <Link
            key={b.title}
            href={b.cta.href}
            className="group relative overflow-hidden rounded-3xl ring-1 ring-stone-200 shadow-soft hover:shadow-elevated transition-all"
          >
            <div className="relative h-[260px] sm:h-[300px]">
              <ImageWithFallback
                src={b.image.src}
                alt={b.image.alt}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className={cn(
                  "absolute inset-0",
                  b.tone === "emerald"
                    ? "bg-gradient-to-r from-lotus-emerald-900/85 via-lotus-emerald-800/55 to-transparent"
                    : "bg-gradient-to-r from-stone-950/80 via-stone-950/40 to-transparent",
                )}
              />
              <div className="absolute inset-0 flex items-center p-7 sm:p-9">
                <div className="max-w-sm text-white">
                  <p
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      b.tone === "emerald"
                        ? "bg-lotus-gold-500 text-stone-900"
                        : "bg-white text-lotus-emerald-800",
                    )}
                  >
                    {b.tone === "emerald" ? "Wholesale" : "Eco range"}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-100/85">{b.subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-lotus-gold-200 group-hover:text-white">
                    {b.cta.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
