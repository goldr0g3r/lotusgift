"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  CheckCircle,
  Star,
  Package,
  Users,
  Truck,
  Shield,
  Sparkles,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { heroSlides } from "@/lib/images";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface LandingPageData {
  id: string;
  title: string;
  slug: string;
  heading: string;
  subheading?: string;
  content?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
}

export default function LandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const utmSource = searchParams?.get("utm_source");
  const utmMedium = searchParams?.get("utm_medium");
  const utmCampaign = searchParams?.get("utm_campaign");

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .catch(() => null)
      .finally(() => {
        setPageData({
          id: "default",
          title: "Lotus Gift - Special Offer",
          slug: params?.slug as string,
          heading: "Premium corporate gifts at unbeatable prices",
          subheading:
            "Custom branding, fast delivery, and wholesale pricing — purpose-built for procurement & marketing teams.",
          ctaText: "Get your free quote",
          ctaLink: "/request-quote",
        });
        setLoading(false);
      });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-lotus-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const features = [
    { icon: Package, title: "500+ products", desc: "Wide range of promotional items" },
    { icon: Users, title: "1,200+ clients", desc: "Trusted by brands across India" },
    { icon: Truck, title: "Fast delivery", desc: "3–5 business days nationwide" },
    { icon: Shield, title: "Quality assured", desc: "Every product QC checked" },
  ];

  const benefits = [
    "Custom branding with your logo and colors",
    "Competitive wholesale pricing for bulk orders",
    "Fast turnaround — 3 to 5 business days",
    "Quality checked before every shipment",
    "Dedicated coordinator for your program",
    "Eco-friendly and sustainable options available",
  ];

  const heroImg = heroSlides[0]!.image;

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback src={heroImg.src} alt={heroImg.alt} sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/20" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 lg:py-28 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lotus-gold-200 ring-1 ring-white/15">
            <Sparkles className="h-3 w-3" />
            Special offer
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
            {pageData?.heading}
          </h1>
          {pageData?.subheading && (
            <p className="mt-4 text-lg text-stone-100/85 max-w-2xl mx-auto">
              {pageData.subheading}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={pageData?.ctaLink || "/request-quote"}
              className="inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-7 py-3.5 text-sm font-bold text-stone-900 shadow-elevated hover:bg-lotus-gold-400 transition-colors"
            >
              {pageData?.ctaText || "Get a free quote"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call now
            </a>
          </div>
        </div>
      </section>

      <section className="relative -mt-12 z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          {features.map((f) => (
            <div key={f.title} className="p-5 text-center">
              <f.icon className="h-7 w-7 text-lotus-emerald-700 mx-auto" />
              <div className="text-sm font-bold text-stone-900 mt-2">{f.title}</div>
              <div className="text-xs text-stone-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-10">
            Why teams choose Lotus Gift
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl bg-lotus-emerald-50/40 p-5 ring-1 ring-lotus-emerald-100"
              >
                <CheckCircle className="h-5 w-5 text-lotus-emerald-700 flex-shrink-0 mt-0.5" />
                <span className="text-stone-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-lotus-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 text-lotus-gold-400 fill-lotus-gold-400" />
            ))}
          </div>
          <blockquote className="font-display text-xl text-stone-800 leading-relaxed">
            “Lotus Gift delivered 500 welcome kits for our new hires. Exceptional quality
            and they met our tight deadline. Highly recommend!”
          </blockquote>
          <p className="mt-4 font-semibold text-stone-900">Rajesh Kumar</p>
          <p className="text-sm text-stone-500">TechCorp Solutions</p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-stone-100/85">
            Get a free quote in under 30 minutes. No commitment required.
          </p>
          <Link
            href={`/request-quote${
              utmSource
                ? `?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`
                : ""
            }`}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-10 py-4 text-base font-bold text-stone-900 hover:bg-lotus-gold-400 transition-colors shadow-elevated"
          >
            Get your free quote
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
