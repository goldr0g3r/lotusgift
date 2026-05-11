import Link from "next/link";
import {
  ArrowRight,
  Award,
  Heart,
  Sparkles,
  Leaf,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { SectionShell } from "@/components/ui/SectionShell";
import { trustLogos } from "@/lib/mock-data";

const values = [
  {
    icon: Heart,
    title: "Built on trust",
    body: "We win by being the supplier that actually does what we said — every order, every time.",
  },
  {
    icon: Sparkles,
    title: "Craft over volume",
    body: "We refuse to ship a batch we wouldn't send to a friend. QC is a checkpoint, not a courtesy.",
  },
  {
    icon: Leaf,
    title: "Lighter footprint",
    body: "Smarter packaging, FSC-certified materials, and a growing eco-friendly range.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent pricing",
    body: "Tiered, predictable, and itemised. No mystery surcharges between quote and invoice.",
  },
];

const team = [
  {
    name: "Aanya Krishnan",
    role: "Founder & CEO",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Rohan Mehta",
    role: "Head of Design",
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Priya Iyer",
    role: "Production Lead",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Vikram Rao",
    role: "Client Success",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
];

const stats = [
  { value: "500+", label: "Brands served" },
  { value: "1.8M", label: "Units shipped" },
  { value: "32", label: "Cities reached" },
  { value: "4.9", label: "Avg rating" },
];

export default function AboutPage() {
  return (
    <div>
      <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="eyebrow">Our story</span>
            <h1 className="mt-4 h1-display">
              We make corporate gifting
              <br />
              <span className="text-brand-pink-500">delightful again</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-stone-500 max-w-xl">
              Lotus Gift was born from a simple frustration: branded gifting was
              clunky, opaque, and rarely arrived looking like the mockup. We
              fixed each part — sourcing, QC, mockups, logistics — and built a
              workflow that procurement and marketing teams actually enjoy.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <Link href="/products" className="btn-primary btn-lg">
                <span className="btn-disc">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Browse catalog
              </Link>
              <Link href="/request-quote" className="btn-outline rounded-full">
                Talk to our team
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-4xl ring-1 ring-stone-100 shadow-elevated-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80"
                alt="The Lotus Gift team at the workshop"
                sizes="(max-width: 1024px) 90vw, 480px"
                priority
              />
            </div>
            <div className="absolute -bottom-5 left-4 sm:left-8 rounded-3xl bg-white shadow-elevated px-5 py-4 flex items-center gap-3 ring-1 ring-stone-100">
              <Award className="h-7 w-7 text-brand-pink-500" />
              <div>
                <p className="text-xs text-stone-500">Trusted by</p>
                <p className="text-base font-extrabold text-brand-ink-900 tabular-nums">
                  500+ brands
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        className="bg-stone-50/60"
        eyebrow={<span className="eyebrow">What we believe</span>}
        heading="The principles that shape every order"
        subheading="They're not posters on the wall — they're how we hire, how we ship, and how we say no."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-3xl bg-white border border-stone-100 p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600 ring-1 ring-brand-green-100">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-brand-ink-900">
                {v.title}
              </h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>

      <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-4xl bg-brand-ink-900 text-white p-8 sm:p-12 relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-pink-500/30 blur-3xl"
            />
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-2 text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        eyebrow={<span className="eyebrow-pink">The team</span>}
        heading="Meet the humans behind the boxes"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {team.map((m) => (
            <div
              key={m.name}
              className="rounded-3xl bg-white border border-stone-100 p-3 sm:p-4 text-center"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                <ImageWithFallback src={m.photo} alt={m.name} sizes="220px" />
              </div>
              <p className="mt-4 text-sm font-bold text-brand-ink-900">{m.name}</p>
              <p className="text-xs text-stone-500">{m.role}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      <section className="px-4 sm:px-6 lg:px-10 pb-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 text-center">
            Trusted by teams at
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center justify-items-center">
            {trustLogos.map((logo) => (
              <span
                key={logo}
                className="text-sm font-semibold text-stone-400 tracking-wide"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-4xl bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-800 text-white p-10 sm:p-14 relative overflow-hidden">
            <Users
              aria-hidden
              className="absolute right-10 top-10 h-8 w-8 text-white/30"
            />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold max-w-2xl">
              Want to work with us on your next campaign?
            </h3>
            <p className="mt-3 text-white/85 max-w-xl">
              Share your brief — we&apos;ll ping you back with options and a
              tailored quote within 48 hours.
            </p>
            <Link href="/request-quote" className="btn-pink btn-lg mt-7">
              <span className="btn-disc">
                <ArrowRight className="h-4 w-4" />
              </span>
              Request a quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
