"use client";

import { ShieldCheck, Truck, Award, Sparkles } from "lucide-react";
import { trustLogos } from "@/lib/images";

const usps = [
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Truck, label: "3–5 day dispatch" },
  { icon: Award, label: "QC at every batch" },
  { icon: Sparkles, label: "Free mockups" },
];

export function TrustBar() {
  const doubled = [...trustLogos, ...trustLogos];
  return (
    <section className="border-y border-stone-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {usps.map((u) => (
              <div
                key={u.label}
                className="flex items-center gap-2.5 rounded-xl bg-lotus-cream px-3 py-2.5 ring-1 ring-lotus-gold-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-lotus-gold-100">
                  <u.icon className="h-4 w-4 text-lotus-gold-700" />
                </span>
                <span className="text-xs font-semibold text-stone-700 leading-tight">
                  {u.label}
                </span>
              </div>
            ))}
          </div>
          <div className="lg:col-span-7 overflow-hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400 mb-2">
              Trusted by India&apos;s leading teams
            </p>
            <div className="relative">
              <div className="flex w-max gap-12 animate-marquee whitespace-nowrap">
                {doubled.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="font-display text-2xl font-semibold text-stone-300 tracking-tight"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
