"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight, Sparkles, ShieldCheck, Truck, Award } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const productLinks = [
  { name: "Corporate Gift Sets", href: "/categories/corporate-gift-sets" },
  { name: "Drinkware", href: "/categories/drinkware" },
  { name: "Bags & Backpacks", href: "/categories/bags-backpacks" },
  { name: "Apparel", href: "/categories/apparel" },
  { name: "Tech & Gadgets", href: "/categories/tech-gadgets" },
  { name: "Stationery", href: "/categories/stationery" },
];

const quickLinks = [
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Request Quote", href: "/request-quote" },
  { name: "Wholesale Program", href: "/products?wholesale=true" },
  { name: "Client Portal", href: "/portal/login" },
];

const socialLinks = [
  { name: "Facebook", icon: FacebookIcon, href: "#" },
  { name: "Instagram", icon: InstagramIcon, href: "#" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "#" },
];

const trustItems = [
  { icon: ShieldCheck, label: "Secure payments", sub: "Razorpay protected" },
  { icon: Truck, label: "3–5 day dispatch", sub: "Pan-India delivery" },
  { icon: Award, label: "QC at every batch", sub: "Premium finish" },
  { icon: Sparkles, label: "Custom branding", sub: "Free mockups" },
];

export default function Footer() {
  return (
    <footer className="relative bg-stone-950 text-stone-400 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-1/4 w-96 h-96 bg-lotus-emerald-500/10 rounded-full blur-3xl" />
      <div aria-hidden className="absolute bottom-0 right-1/4 w-80 h-80 bg-lotus-gold-500/10 rounded-full blur-3xl" />

      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {trustItems.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                  <t.icon className="h-4 w-4 text-lotus-gold-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-stone-500">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 px-6 sm:px-10 py-8 ring-1 ring-white/10 shadow-elevated-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lotus-gold-200">
                  <Sparkles className="h-3 w-3" />
                  Newsletter
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">
                  Stay updated with gifting trends
                </h3>
                <p className="mt-2 text-sm text-stone-200/80">
                  Get seasonal ideas, fresh launches, and exclusive wholesale deals — once a month, no spam.
                </p>
              </div>
              <form
                className="flex w-full md:w-auto gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-lotus-gold-300/40 focus:border-lotus-gold-300/60 transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-lotus-gold-500 text-stone-900 text-sm font-bold hover:bg-lotus-gold-400 transition-colors inline-flex items-center gap-1.5"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 ring-1 ring-white/10 flex items-center justify-center shadow-warm">
                <span className="font-display text-lg font-bold text-white">L</span>
              </div>
              <div className="leading-none">
                <span className="block font-display text-xl font-bold tracking-tight text-white">
                  Lotus Gift
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-lotus-gold-300">
                  Wholesale Gifting
                </span>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-stone-400 max-w-xs">
              Your trusted partner for premium promotional products and corporate gifts.
              Helping businesses make lasting impressions since day one.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 hover:bg-lotus-gold-500 hover:border-lotus-gold-500 flex items-center justify-center transition-all duration-200 group"
                >
                  <social.icon className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-400 hover:text-lotus-gold-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-400 hover:text-lotus-gold-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Contact
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-3 text-stone-400 hover:text-lotus-gold-300 transition-colors group"
                >
                  <span className="w-9 h-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-lotus-gold-500/10 transition-colors">
                    <Phone className="w-4 h-4 text-lotus-gold-300" />
                  </span>
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@lotusgift.com"
                  className="flex items-center gap-3 text-stone-400 hover:text-lotus-gold-300 transition-colors group"
                >
                  <span className="w-9 h-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-lotus-gold-500/10 transition-colors">
                    <Mail className="w-4 h-4 text-lotus-gold-300" />
                  </span>
                  info@lotusgift.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-lotus-gold-300" />
                </span>
                <span className="text-stone-400">
                  123 Business Park, Coimbatore,
                  <br />
                  Tamil Nadu 641001
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 items-center gap-4 opacity-70">
          {["VISA", "Mastercard", "RuPay", "UPI", "NetBanking", "Razorpay"].map((m) => (
            <div
              key={m}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold tracking-wide text-stone-300"
            >
              {m}
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>
            &copy; {new Date().getFullYear()} Lotus Gift. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
