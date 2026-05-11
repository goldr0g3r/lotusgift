"use client";

import { Gift, Phone, Palette, Truck } from "lucide-react";
import { SectionShell } from "@/components/ui/SectionShell";

const steps = [
  {
    step: 1,
    title: "Curate",
    body: "Shortlist categories, set MOQs, and refine the look for your audience.",
    icon: Gift,
  },
  {
    step: 2,
    title: "Connect",
    body: "Share timelines, delivery cities, and budget — we'll build a quote.",
    icon: Phone,
  },
  {
    step: 3,
    title: "Design",
    body: "Approve mockups, colours, and packaging before production locks.",
    icon: Palette,
  },
  {
    step: 4,
    title: "Deliver",
    body: "We produce, QC every batch, and track delivery to every doorstep.",
    icon: Truck,
  },
];

export function HowItWorks() {
  return (
    <SectionShell
      className="bg-stone-50/60"
      eyebrow={<span className="eyebrow">How it works</span>}
      heading="From brief to doorstep in four steps"
      subheading="A coordinator owns every order — so you can stay focused on the campaign, not the chase."
      align="center"
    >
      <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div
          aria-hidden
          className="absolute top-10 left-12 right-12 hidden lg:block h-px bg-gradient-to-r from-transparent via-brand-green-200 to-transparent"
        />
        {steps.map((item) => (
          <div
            key={item.title}
            className="relative rounded-3xl bg-white border border-stone-100 p-6 pt-7 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300"
          >
            <span className="absolute right-5 top-4 font-display text-5xl font-extrabold tabular-nums text-brand-green-50">
              {item.step}
            </span>
            <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-white shadow-pill">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-ink-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
