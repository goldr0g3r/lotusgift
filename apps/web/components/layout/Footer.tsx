"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Award,
} from "lucide-react";
import Logo from "@/components/Logo";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
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

const trustItems = [
  { icon: ShieldCheck, label: "Secure payments", sub: "Razorpay protected" },
  { icon: Truck, label: "3–5 day dispatch", sub: "Pan-India delivery" },
  { icon: Award, label: "QC at every batch", sub: "Premium finish" },
  { icon: Sparkles, label: "Custom branding", sub: "Free mockups" },
];

const socialLinks = [
  { name: "Facebook", icon: FacebookIcon, href: "#" },
  { name: "Instagram", icon: InstagramIcon, href: "#" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative bg-brand-ink-900 text-stone-300 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-brand-green-500/10 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 bg-brand-pink-500/10 rounded-full blur-3xl"
      />

      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {trustItems.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                  <t.icon className="h-4 w-4 text-brand-pink-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-stone-400">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
          <div className="rounded-3xl bg-gradient-to-br from-brand-green-600 via-brand-green-700 to-brand-ink-900 px-6 sm:px-10 py-9 ring-1 ring-white/10 shadow-elevated-lg overflow-hidden relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-brand-pink-500/30 blur-3xl"
            />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="md:max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-pink-200">
                  <Sparkles className="h-3 w-3" />
                  Newsletter
                </div>
                <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-white">
                  Stay updated with gifting trends
                </h3>
                <p className="mt-2 text-sm text-stone-200/80">
                  Seasonal ideas, fresh launches, and exclusive wholesale deals — once a month, no spam.
                </p>
              </div>
              <form
                className="flex w-full md:w-auto items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 p-1.5"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="flex-1 md:w-72 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-stone-300 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-pill hover:bg-brand-pink-600 transition-colors"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo size="md" variant="mono-white" />
            <p className="mt-5 text-sm leading-relaxed text-stone-400 max-w-sm">
              Your trusted partner for premium promotional products and corporate
              gifts. Helping brands make lasting impressions at every touchpoint.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-brand-pink-500 hover:border-brand-pink-500 flex items-center justify-center transition-all duration-200 group"
                >
                  <social.icon className="w-4 h-4 text-stone-300 group-hover:text-white" />
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
                    className="text-stone-400 hover:text-brand-pink-300 transition-colors"
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
                    className="text-stone-400 hover:text-brand-pink-300 transition-colors"
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
                  className="flex items-center gap-3 text-stone-400 hover:text-brand-pink-300 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-pink-500/10">
                    <Phone className="w-4 h-4 text-brand-pink-300" />
                  </span>
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@lotusgift.com"
                  className="flex items-center gap-3 text-stone-400 hover:text-brand-pink-300 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-pink-500/10">
                    <Mail className="w-4 h-4 text-brand-pink-300" />
                  </span>
                  info@lotusgift.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-brand-pink-300" />
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

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 items-center gap-3 opacity-70">
          {["VISA", "Mastercard", "RuPay", "UPI", "NetBanking", "Razorpay"].map(
            (m) => (
              <div
                key={m}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold tracking-wide text-stone-300"
              >
                {m}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>&copy; {new Date().getFullYear()} Lotus Gift. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-stone-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
