import Link from "next/link";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { HeroSlider } from "@/components/home/HeroSlider";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryMosaic } from "@/components/home/CategoryMosaic";
import { BestSellers } from "@/components/home/BestSellers";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { PromoBanners } from "@/components/home/PromoBanners";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IndustryStrip } from "@/components/home/IndustryStrip";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";

export default function HomePage() {
  return (
    <div>
      <HeroSlider />
      <TrustBar />
      <CategoryMosaic />
      <BestSellers />
      <FeaturedCarousel />
      <PromoBanners />
      <HowItWorks />
      <IndustryStrip />
      <TestimonialsCarousel />

      <section className="px-4 sm:px-6 lg:px-10 pb-14 pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-ink-900 via-brand-green-800 to-brand-green-600 px-6 py-14 text-center shadow-elevated-lg sm:px-14 lg:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-pink-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-brand-pink-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Limited-time festive pricing
              </div>
              <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to elevate your brand?
              </h2>
              <p className="mt-5 text-base sm:text-lg text-stone-100/85 leading-relaxed">
                Tell us your audience, timeline, and budget — we&apos;ll come
                back with options and visuals within 48 hours.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/request-quote" className="btn-pink btn-lg">
                  <span className="btn-disc">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  Request a Quote
                </Link>
                <a
                  href="mailto:quotes@lotusgift.com"
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
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
