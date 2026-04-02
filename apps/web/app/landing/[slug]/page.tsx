"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle, Star, Package, Users, Truck, Shield } from "lucide-react";

const API = "http://localhost:3001/api";

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

  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");

  useEffect(() => {
    // Try to fetch from API, fallback to default landing page
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(() => {
        // For now, use a default landing page template
        setPageData({
          id: "default",
          title: "Lotus Gift - Special Offer",
          slug: params.slug as string,
          heading: "Premium Corporate Gifts at Unbeatable Prices",
          subheading: "Custom branding, fast delivery, and wholesale pricing for your business",
          ctaText: "Get Your Free Quote Now",
          ctaLink: "/request-quote",
        });
      })
      .catch(() => {
        setPageData({
          id: "default",
          title: "Lotus Gift - Special Offer",
          slug: params.slug as string,
          heading: "Premium Corporate Gifts at Unbeatable Prices",
          subheading: "Custom branding, fast delivery, and wholesale pricing for your business",
          ctaText: "Get Your Free Quote Now",
          ctaLink: "/request-quote",
        });
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full" /></div>;
  }

  const features = [
    { icon: Package, title: "500+ Products", desc: "Wide range of promotional items" },
    { icon: Users, title: "1200+ Clients", desc: "Trusted by brands across India" },
    { icon: Truck, title: "Fast Delivery", desc: "3-5 business days nationwide" },
    { icon: Shield, title: "Quality Assured", desc: "Every product quality checked" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-green-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
          <Image src="/logo.png" alt="Lotus Gift" width={160} height={36} className="mx-auto object-contain brightness-0 invert mb-8" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">{pageData?.heading}</h1>
          {pageData?.subheading && <p className="mt-4 text-lg text-brand-green-100 max-w-2xl mx-auto">{pageData.subheading}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href={pageData?.ctaLink || "/request-quote"} className="bg-white text-brand-green-600 px-8 py-3.5 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-lg">
              {pageData?.ctaText || "Get a Free Quote"} <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              <Phone className="w-5 h-5" /> Call Now
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {features.map((f) => (
              <div key={f.title} className="p-5 text-center">
                <f.icon className="w-8 h-8 text-brand-green-500 mx-auto" />
                <div className="text-sm font-bold text-gray-900 mt-2">{f.title}</div>
                <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Choose Lotus Gift?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {["Custom branding with your logo and colors", "Competitive wholesale pricing for bulk orders", "Fast turnaround - 3 to 5 business days", "Quality checked before every shipment", "Dedicated account manager for your orders", "Eco-friendly and sustainable options available"].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-brand-green-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
          </div>
          <blockquote className="text-lg text-gray-700 italic">"Lotus Gift delivered 500 welcome kits for our new hires. Exceptional quality and they met our tight deadline. Highly recommend!"</blockquote>
          <p className="mt-4 font-semibold text-gray-900">Rajesh Kumar</p>
          <p className="text-sm text-gray-500">TechCorp Solutions</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-brand-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-3 text-brand-green-100">Get a free quote in under 30 minutes. No commitment required.</p>
          <Link href={`/request-quote${utmSource ? `?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}` : ''}`}
            className="mt-8 inline-flex items-center gap-2 bg-white text-brand-green-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg">
            Get Your Free Quote <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
