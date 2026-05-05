import Link from "next/link";
import {
  Award,
  Users,
  Clock,
  Star,
  Shield,
  Palette,
  Truck,
  IndianRupee,
  Headphones,
  Leaf,
  ArrowRight,
  Target,
  Heart,
  Package,
  Sparkles,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { aboutImages } from "@/lib/images";

const stats = [
  { label: "Products", value: "500+", icon: Package },
  { label: "Happy clients", value: "1,200+", icon: Users },
  { label: "Years experience", value: "5+", icon: Clock },
  { label: "Avg. rating", value: "4.8/5", icon: Star },
];

const milestones = [
  { year: "2019", title: "Founded", body: "Lotus Gift opens with a 50-product catalog and 8 wholesale clients." },
  { year: "2021", title: "100+ teams", body: "Onboarded 100+ corporate teams across India for quarterly programs." },
  { year: "2023", title: "Eco line", body: "Launched eco-friendly product line and dedicated sustainability QC." },
  { year: "2025", title: "1,200+ clients", body: "Pan-India dispatch with 3–5 day SLA and dedicated coordinators." },
];

const features = [
  { icon: Shield, title: "Quality guaranteed", description: "Every product goes through rigorous quality checks so your brand always represents at its best." },
  { icon: Palette, title: "Custom branding", description: "Full-spectrum customisation — logos, colours, packaging — tailored to your brand identity." },
  { icon: Truck, title: "Fast delivery", description: "Streamlined production and logistics ensure your order reaches you on schedule, every time." },
  { icon: IndianRupee, title: "Competitive pricing", description: "Volume-based pricing tiers and transparent quotes mean maximum value for every rupee." },
  { icon: Headphones, title: "Dedicated support", description: "A single point of contact from brief to delivery, so you never have to chase updates." },
  { icon: Leaf, title: "Eco-friendly options", description: "Sustainable materials and processes for brands that care about their environmental impact." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="relative bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="pointer-events-none absolute inset-0 lotus-pattern opacity-20" aria-hidden />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lotus-gold-200 ring-1 ring-white/15">
                <Heart className="h-3 w-3" />
                Our story
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05]">
                Crafting brand moments that{" "}
                <span className="bg-gradient-to-r from-lotus-gold-300 to-lotus-gold-100 bg-clip-text text-transparent">
                  outlast a campaign
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg text-stone-100/85 leading-relaxed">
                We help India&apos;s most thoughtful brands turn programs, gifts and
                events into memorable, on-brand experiences.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/request-quote" className="btn-accent">
                  <Sparkles className="h-4 w-4" />
                  Start a quote
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
                >
                  Talk to our team
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <div className="relative h-[360px] lg:h-auto">
            <ImageWithFallback
              src={aboutImages.story.src}
              alt={aboutImages.story.alt}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="relative -mt-10 z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100">
                <stat.icon className="h-5 w-5 text-lotus-emerald-700" />
              </div>
              <div>
                <div className="text-xl font-bold text-stone-900 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-stone-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative aspect-[4/5] lg:aspect-square overflow-hidden rounded-3xl ring-1 ring-stone-200 shadow-elevated">
            <ImageWithFallback
              src={aboutImages.warehouse.src}
              alt={aboutImages.warehouse.alt}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-3 h2-display">
              Five years, hundreds of brands, one promise
            </h2>
            <p className="mt-5 text-stone-500 leading-relaxed">
              Lotus Gift was founded with a simple belief: the right promotional product
              doesn&apos;t just carry a logo — it carries a story. From a small catalogue
              to over 500 products, we&apos;ve grown into one of India&apos;s trusted sources
              for corporate gifting and branded merchandise.
            </p>
            <p className="mt-4 text-stone-500 leading-relaxed">
              We partner with businesses of every scale — from start-ups ordering their
              first branded pens to enterprises running nationwide campaigns — delivering
              quality, creativity, and reliability at every step.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100">
                  <Target className="h-5 w-5 text-lotus-emerald-700" />
                </div>
                <h3 className="mt-3 font-semibold text-stone-900">Our mission</h3>
                <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                  Empower brands with high-quality, customisable promotional products
                  that create lasting impressions and real business value.
                </p>
              </div>
              <div className="card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100">
                  <Award className="h-5 w-5 text-lotus-gold-700" />
                </div>
                <h3 className="mt-3 font-semibold text-stone-900">Our vision</h3>
                <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                  Be India&apos;s most trusted promotional products partner — known for
                  innovation, sustainability, and exceptional service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-lotus-cream py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow">Milestones</span>
            <h2 className="mt-3 h2-display">A short timeline</h2>
          </div>
          <div className="relative">
            <div
              aria-hidden
              className="absolute left-1/2 top-0 hidden md:block h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-lotus-gold-300/60 to-transparent"
            />
            <ol className="space-y-8 md:space-y-10">
              {milestones.map((m, i) => (
                <li
                  key={m.year}
                  className={`md:grid md:grid-cols-2 md:gap-10 items-center ${
                    i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="card p-5">
                    <span className="eyebrow">{m.year}</span>
                    <h3 className="mt-2 font-display text-lg font-bold text-stone-900">
                      {m.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                      {m.body}
                    </p>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lotus-gold-500 text-stone-900 font-bold ring-4 ring-lotus-cream">
                      {i + 1}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="eyebrow">Why choose us</span>
            <h2 className="mt-3 h2-display">What sets us apart</h2>
            <p className="mt-4 text-stone-500 leading-relaxed">
              Six reasons businesses across India trust Lotus Gift for their promotional needs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card p-6 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lotus-cream to-lotus-gold-100 ring-1 ring-lotus-gold-200">
                  <feature.icon className="h-6 w-6 text-lotus-gold-700" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 px-6 py-14 text-center shadow-elevated-lg sm:px-14 lg:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-lotus-gold-500/15 blur-3xl" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Ready to make your brand stand out?
            </h2>
            <p className="mt-4 text-lg text-stone-100/85 max-w-2xl mx-auto">
              Whether you need 50 pens or 50,000 gift sets — we&apos;re here to help.
              Tell us your brief and we&apos;ll come back with options.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/request-quote"
                className="inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-7 py-3.5 text-sm font-bold text-stone-900 hover:bg-lotus-gold-400 transition-colors"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
