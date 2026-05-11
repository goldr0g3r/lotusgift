"use client";

import { trustLogos } from "@/lib/mock-data";

export function TrustBar() {
  const loop = [...trustLogos, ...trustLogos];
  return (
    <section className="border-y border-stone-100 bg-stone-50/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6 sm:py-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 shrink-0">
            Trusted by
          </p>
          <div className="relative overflow-hidden flex-1">
            <div className="flex gap-12 animate-marquee whitespace-nowrap will-change-transform">
              {loop.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="text-base sm:text-lg font-semibold text-stone-400 tracking-wide"
                >
                  {name}
                </span>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-stone-50/80 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-stone-50/80 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
