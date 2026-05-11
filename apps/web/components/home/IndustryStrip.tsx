"use client";

import { Briefcase, Megaphone, Users, GraduationCap, Building2, HeartHandshake } from "lucide-react";
import { SectionShell } from "@/components/ui/SectionShell";

const industries = [
  {
    icon: Users,
    title: "HR & People Ops",
    body: "Welcome kits, employee appreciation gifts, internal milestone awards.",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    body: "Campaign giveaways, event swag, brand-aligned drops for influencers.",
  },
  {
    icon: Briefcase,
    title: "Procurement",
    body: "Volume pricing, GST-compliant invoicing, scheduled deliveries.",
  },
  {
    icon: HeartHandshake,
    title: "Sales",
    body: "Client thank-yous, deal-close gifts, executive hampers with branding.",
  },
  {
    icon: GraduationCap,
    title: "L&D",
    body: "Training kits, certification packs, cohort welcome boxes.",
  },
  {
    icon: Building2,
    title: "Founders",
    body: "Investor decks accompanied by tactile branded keepsakes that punch above their weight.",
  },
];

export function IndustryStrip() {
  return (
    <SectionShell
      eyebrow={<span className="eyebrow-pink">Built for teams</span>}
      heading="Tuned for the way you actually buy"
      subheading="Whether you ship 50 kits or 5000, our workflow flexes — quote, customise, approve, deliver."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {industries.map((it) => (
          <div
            key={it.title}
            className="rounded-3xl bg-white border border-stone-100 p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink-50 text-brand-pink-700 ring-1 ring-brand-pink-100">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-brand-ink-900">
              {it.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
