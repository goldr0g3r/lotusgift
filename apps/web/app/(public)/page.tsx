import Link from "next/link";
import {
  Gift,
  Phone,
  Palette,
  Truck,
  Shield,
  Award,
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import { HeroSlider } from "@/components/home/HeroSlider";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryMosaic } from "@/components/home/CategoryMosaic";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { PromoBanners } from "@/components/home/PromoBanners";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";

const howItWorks = [
  {
    step: 1,
    title: "Curate",
    body: "Shortlist categories and quantities that fit your campaign.",
    icon: Gift,
  },
  {
    step: 2,
    title: "Connect",
    body: "Share timelines, delivery cities, and budget with our team.",
    icon: Phone,
  },
  {
    step: 3,
    title: "Design",
    body: "Approve mockups, colours, and placement before production.",
    icon: Palette,
  },
  {
    step: 4,
    title: "Deliver",
    body: "We produce, QC, and ship — tracked to your doorstep.",
    icon: Truck,
  },
];

const usps = [
  { title: "Quality assured", body: "Rigorous supplier checks and pre-ship inspection on every batch.", icon: Shield },
  { title: "Custom branding", body: "Logo application across print, embroidery, deboss, and packaging.", icon: Award },
  { title: "Fast turnaround", body: "Streamlined quoting and production slots for tight launch dates.", icon: Zap },
];

export default function HomePage() {
  return (
    <div className="-mt-[105px]">
      <HeroSlider />
      <TrustBar />
      <CategoryMosaic />
      <FeaturedCarousel />
      <PromoBanners />

      <section className="dot-grid px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="section-heading mt-4">Four steps from brief to doorstep</h2>
          </div>
          <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden
              className="absolute top-12 left-8 right-8 hidden lg:block h-px bg-gradient-to-r from-transparent via-lotus-emerald-200 to-transparent"
            />
            {howItWorks.map((item) => (
              <div
                key={item.title}
                className="group card relative p-6 pt-8 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="absolute right-5 top-4 font-display text-5xl font-black tabular-nums text-lotus-emerald-50 group-hover:text-lotus-emerald-100 transition-colors">
                  {item.step}
                </span>
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 text-white shadow-sm">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.body}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-lotus-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Dedicated coordinator
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">Why choose us</span>
            <h2 className="section-heading mt-4">
              Built for procurement &amp; marketing teams
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {usps.map((u) => (
              <div
                key={u.title}
                className="group card p-8 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lotus-cream to-lotus-gold-100 ring-1 ring-lotus-gold-200">
                  <u.icon className="h-6 w-6 text-lotus-gold-700" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-stone-900">{u.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 px-6 py-14 text-center shadow-elevated-lg sm:px-14 lg:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-lotus-gold-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-lotus-gold-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Limited-time festive pricing
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to elevate your brand?
              </h2>
              <p className="mt-5 text-lg text-stone-100/85 leading-relaxed">
                Tell us your audience, timeline, and budget — we&apos;ll come back with options and visuals.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/request-quote"
                  className="group inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-8 py-3.5 text-sm font-bold text-stone-900 shadow-lg hover:bg-lotus-gold-400 active:scale-[0.98] transition-all"
                >
                  Request a Quote
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="mailto:quotes@lotusgift.com"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40"
                >
                  <Mail className="h-4 w-4" />
                  Email us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
