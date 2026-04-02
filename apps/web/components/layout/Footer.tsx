"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";

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

export default function Footer() {
  return (
    <footer className="relative bg-gray-950 text-gray-400 overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-pink-500/5 rounded-full blur-3xl" />

      {/* Newsletter CTA strip */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Stay updated with gifting trends
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Get seasonal ideas, new arrivals, and exclusive offers in your inbox.
              </p>
            </div>
            <form
              className="flex w-full md:w-auto gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-green-500/30 focus:border-brand-green-500/50 transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-green-500 text-white text-sm font-semibold hover:bg-brand-green-600 transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-brand-green-500/20"
              >
                Subscribe
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Image
              src="/logo.png"
              alt="Lotus Gift"
              width={140}
              height={32}
              className="object-contain brightness-0 invert opacity-90"
            />
            <p className="mt-5 text-sm leading-relaxed text-gray-500 max-w-xs">
              Your trusted partner for premium promotional products and
              corporate gifts. Helping businesses make lasting impressions since
              day one.
            </p>
            <div className="flex items-center gap-2.5 mt-7">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 hover:bg-brand-green-500 hover:border-brand-green-500 flex items-center justify-center transition-all duration-200 group"
                >
                  <social.icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-5">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-brand-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-5">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-brand-green-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-5">
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-3 text-gray-500 hover:text-brand-green-400 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-green-500/10 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-brand-green-400" />
                  </span>
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@lotusgift.com"
                  className="flex items-center gap-3 text-gray-500 hover:text-brand-green-400 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-green-500/10 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-brand-green-400" />
                  </span>
                  info@lotusgift.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-green-400" />
                </span>
                <span className="text-gray-500">
                  123 Business Park, Coimbatore,
                  <br />
                  Tamil Nadu 641001
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>
            &copy; {new Date().getFullYear()} Lotus Gift. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
