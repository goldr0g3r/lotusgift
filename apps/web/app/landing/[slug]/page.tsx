"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  CheckCircle,
  Package,
  Users,
  Truck,
  Shield,
  Sparkles,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { StarRating } from "@/components/ui/StarRating";
import { heroSlides } from "@/lib/mock-data";
import Logo from "@/components/Logo";

export default function LandingPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const utm = useMemo(() => {
    const src = searchParams?.get("utm_source");
    const med = searchParams?.get("utm_medium");
    const camp = searchParams?.get("utm_campaign");
    if (!src) return "";
    return `?utm_source=${src}&utm_medium=${med ?? ""}&utm_campaign=${camp ?? ""}`;
  }, [searchParams]);

  const slide = heroSlides[0]!;

  const features = [
    { icon: Package, title: "500+ products", desc: "Curated promotional range" },
    { icon: Users, title: "1,200+ clients", desc: "Trusted brands across India" },
    { icon: Truck, title: "Fast delivery", desc: "3–5 days nationwide" },
    { icon: Shield, title: "QC assured", desc: "Every batch inspected" },
  ];

  const benefits = [
    "Custom branding with your logo and colours",
    "Wholesale tiered pricing for bulk orders",
    "Turnaround in 3–5 business days",
    "QC checks before every shipment",
    "Dedicated coordinator for your program",
    "Eco-friendly and sustainable options",
  ];

  return (
    <div className="min-h-screen bg-[#EEEEF2]">
      <div className="mx-auto max-w-[1480px] px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
        <div className="bg-white rounded-3xl sm:rounded-4xl shadow-panel overflow-hidden">
          <header className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-5 pb-2 flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <Link
              href={`/request-quote${utm}`}
              className="btn-primary btn-sm hidden sm:inline-flex"
            >
              Get a quote
            </Link>
          </header>

          <section className="relative px-4 sm:px-6 lg:px-10 pt-6 pb-12 sm:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="eyebrow">
                  <Sparkles className="h-3 w-3" />
                  Limited-time offer · {params?.slug}
                </span>
                <h1 className="mt-5 h1-display">
                  Premium corporate gifts
                  <br />
                  <span className="text-brand-pink-500">at unbeatable prices</span>
                </h1>
                <p className="mt-5 max-w-xl text-base sm:text-lg text-stone-500">
                  Custom branding, fast delivery, and wholesale pricing —
                  purpose-built for procurement and marketing teams.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href={`/request-quote${utm}`} className="btn-primary btn-lg">
                    <span className="btn-disc">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    Get your free quote
                  </Link>
                  <a
                    href="tel:+919876543210"
                    className="btn-outline rounded-full"
                  >
                    <Phone className="h-4 w-4" />
                    Call now
                  </a>
                </div>
                <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-stone-50 px-4 py-2">
                  <StarRating value={4.9} size="sm" />
                  <span className="text-xs font-semibold text-brand-ink-800">
                    Rated 4.9 by 500+ brands
                  </span>
                </div>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-4xl ring-1 ring-stone-100 shadow-elevated-lg">
                <ImageWithFallback
                  src={slide.image}
                  alt={slide.productLabel}
                  sizes="(max-width: 1024px) 90vw, 560px"
                  priority
                />
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-10 pb-12">
            <div className="rounded-3xl bg-white border border-stone-100 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
              {features.map((f) => (
                <div key={f.title} className="p-5 text-center">
                  <f.icon className="h-7 w-7 text-brand-green-600 mx-auto" />
                  <div className="text-sm font-bold text-brand-ink-900 mt-2">
                    {f.title}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16 bg-stone-50/60 border-y border-stone-100">
            <div className="mx-auto max-w-5xl">
              <h2 className="h2-display text-center">
                Why teams choose Lotus Gift
              </h2>
              <div className="mt-10 grid md:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-2xl bg-white border border-stone-100 p-5"
                  >
                    <CheckCircle className="h-5 w-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-ink-800">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-center rounded-4xl bg-stone-50/60 border border-stone-100 p-10">
              <StarRating value={5} size="lg" className="justify-center" />
              <blockquote className="mt-4 font-display text-xl sm:text-2xl text-brand-ink-900 leading-relaxed">
                &ldquo;Lotus Gift delivered 500 welcome kits for our new hires.
                Exceptional quality and they met our tight deadline. Highly
                recommend.&rdquo;
              </blockquote>
              <p className="mt-5 font-bold text-brand-ink-900">Rajesh Kumar</p>
              <p className="text-sm text-stone-500">TechCorp Solutions</p>
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-10 pb-14">
            <div className="rounded-4xl bg-gradient-to-br from-brand-ink-900 via-brand-green-800 to-brand-green-600 text-white px-6 sm:px-14 py-14 sm:py-20 text-center relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-pink-500/20 blur-3xl"
              />
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
                Ready to get started?
              </h2>
              <p className="mt-3 text-white/85">
                Get a free quote in under 30 minutes. No commitment required.
              </p>
              <Link
                href={`/request-quote${utm}`}
                className="btn-pink btn-lg mt-7 mx-auto"
              >
                <span className="btn-disc">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Get your free quote
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
