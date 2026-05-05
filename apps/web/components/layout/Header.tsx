"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Phone,
  ArrowRight,
  Mail,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import {
  Accordion,
  AccordionItem,
} from "@/components/ui/Accordion";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { categoryImageMap } from "@/lib/images";
import { cn } from "@/lib/cn";

const categories = [
  { name: "Corporate Gift Sets", slug: "corporate-gift-sets", desc: "Curated hampers" },
  { name: "Drinkware", slug: "drinkware", desc: "Bottles, mugs & flasks" },
  { name: "Bags & Backpacks", slug: "bags-backpacks", desc: "Travel & laptop bags" },
  { name: "Apparel", slug: "apparel", desc: "T-shirts, jackets & caps" },
  { name: "Tech & Gadgets", slug: "tech-gadgets", desc: "Power, audio & desk tech" },
  { name: "Stationery", slug: "stationery", desc: "Notebooks, pens & desk" },
  { name: "Eco Friendly", slug: "eco-friendly", desc: "Sustainable picks" },
  { name: "Trophies & Awards", slug: "trophies-awards", desc: "Recognition & honors" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products", hasDropdown: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const featuredCategory = categories[0]!;

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-white/85 backdrop-blur-xl shadow-soft border-b border-stone-200/60"
          : "bg-white/95 backdrop-blur-md border-b border-transparent",
      )}
    >
      <div className="bg-gradient-to-r from-lotus-emerald-800 via-lotus-emerald-700 to-lotus-emerald-800 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <span className="hidden sm:flex items-center gap-2 font-medium tracking-wide opacity-95">
            <Sparkles className="h-3.5 w-3.5 text-lotus-gold-300" />
            Premium corporate gifting · Wholesale pricing · Pan-India delivery
          </span>
          <span className="sm:hidden font-medium tracking-wide opacity-90">
            Premium corporate gifting
          </span>
          <div className="flex items-center gap-5">
            <a
              href="tel:+919876543210"
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-lotus-gold-200 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>+91 98765 43210</span>
            </a>
            <a
              href="mailto:info@lotusgift.com"
              className="hidden md:inline-flex items-center gap-1.5 hover:text-lotus-gold-200 transition-colors"
            >
              <Mail className="w-3 h-3" />
              <span>info@lotusgift.com</span>
            </a>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link href="/" className="flex-shrink-0 group flex items-center gap-2.5">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 ring-1 ring-lotus-emerald-900/10 flex items-center justify-center shadow-warm">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="object-contain brightness-0 invert"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="absolute font-display text-lg font-bold text-white">L</span>
            </div>
            <div className="hidden sm:block leading-none">
              <span className="block font-display text-xl font-bold tracking-tight text-stone-900">
                Lotus Gift
              </span>
              <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-lotus-gold-700">
                Wholesale Gifting
              </span>
            </div>
          </Link>

          <div
            className="hidden lg:flex items-center gap-0.5"
            onMouseLeave={() => setProductsOpen(false)}
          >
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setProductsOpen(true)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-1 transition-all duration-200",
                      isActive(link.href) || pathname?.startsWith("/categories")
                        ? "text-lotus-emerald-800 bg-lotus-emerald-50"
                        : "text-stone-600 hover:text-lotus-emerald-800 hover:bg-lotus-emerald-50/60",
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        productsOpen && "rotate-180",
                      )}
                    />
                  </Link>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive(link.href)
                      ? "text-lotus-emerald-800 bg-lotus-emerald-50"
                      : "text-stone-600 hover:text-lotus-emerald-800 hover:bg-lotus-emerald-50/60",
                  )}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal/login"
              className="hidden md:inline-flex text-sm font-medium text-stone-600 hover:text-lotus-emerald-800 transition-colors px-3 py-2 rounded-lg hover:bg-stone-100"
            >
              Client Login
            </Link>
            <Link
              href="/request-quote"
              className="hidden sm:inline-flex items-center gap-1.5 bg-lotus-emerald-700 hover:bg-lotus-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-lotus-emerald-800/15 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              Get a Quote
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors"
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {productsOpen && (
        <div
          className="hidden lg:block absolute inset-x-0 top-full animate-slide-down"
          onMouseEnter={() => setProductsOpen(true)}
          onMouseLeave={() => setProductsOpen(false)}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mt-2 grid grid-cols-12 gap-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-stone-200/80 shadow-elevated-lg p-6">
              <div className="col-span-7">
                <p className="eyebrow">Shop by category</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-lotus-emerald-50/60 transition-colors"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                        <ImageWithFallback
                          src={categoryImageMap[cat.slug]?.src}
                          alt={cat.name}
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-800 group-hover:text-lotus-emerald-800">
                          {cat.name}
                        </div>
                        <div className="text-xs text-stone-500">{cat.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3">
                  <Link
                    href="/products"
                    className="text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900 inline-flex items-center gap-1.5"
                  >
                    View all products
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/products?wholesale=true"
                    className="text-sm font-semibold text-lotus-gold-700 hover:text-lotus-gold-800 inline-flex items-center gap-1.5"
                  >
                    Wholesale catalog
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <Link
                href={`/categories/${featuredCategory.slug}`}
                className="col-span-3 group relative overflow-hidden rounded-2xl ring-1 ring-stone-200"
              >
                <div className="relative aspect-[3/4]">
                  <ImageWithFallback
                    src={categoryImageMap[featuredCategory.slug]?.src}
                    alt={featuredCategory.name}
                    sizes="(max-width: 1280px) 33vw, 320px"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="badge-gold">Featured</span>
                    <h3 className="mt-2 font-display text-xl font-bold">
                      {featuredCategory.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-200">{featuredCategory.desc}</p>
                  </div>
                </div>
              </Link>

              <div className="col-span-2 flex flex-col gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-lotus-gold-200">
                    Wholesale
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    Up to 35% off on volume orders
                  </p>
                  <Link
                    href="/products?wholesale=true"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lotus-gold-200 hover:text-white"
                  >
                    See pricing
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="rounded-2xl bg-lotus-cream border border-lotus-gold-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-lotus-gold-700">
                    New arrivals
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-stone-800">
                    Fresh festive picks for 2026
                  </p>
                  <Link
                    href="/products?sort=newest"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lotus-emerald-800 hover:text-lotus-emerald-900"
                  >
                    Browse new
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="right"
        size="md"
        title="Menu"
      >
        <div className="px-5 py-4 space-y-2">
          {navLinks
            .filter((l) => !l.hasDropdown)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-3 text-sm font-semibold rounded-xl transition-colors",
                  isActive(link.href)
                    ? "text-lotus-emerald-800 bg-lotus-emerald-50"
                    : "text-stone-700 hover:bg-stone-100",
                )}
              >
                {link.label}
              </Link>
            ))}

          <div className="pt-2">
            <Accordion>
              <AccordionItem value="cats" trigger="Products & Categories">
                <Link
                  href="/products"
                  className="block py-2 text-sm font-semibold text-lotus-emerald-700"
                >
                  All Products
                </Link>
                <div className="mt-1 grid grid-cols-1 gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-3 rounded-xl py-2 text-sm text-stone-600 hover:text-lotus-emerald-800"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-lotus-gold-500" />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
            <Link
              href="/portal/login"
              className="block px-4 py-3 text-sm font-medium text-stone-700 rounded-xl hover:bg-stone-100"
            >
              Client Login
            </Link>
            <Link
              href="/request-quote"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-lotus-emerald-700 rounded-xl"
            >
              <ShoppingBag className="h-4 w-4" />
              Get a Quote
            </Link>
            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-lotus-emerald-800 bg-lotus-emerald-50 rounded-xl"
            >
              <Phone className="h-4 w-4" />
              Call +91 98765 43210
            </a>
          </div>
        </div>
      </Sheet>
    </header>
  );
}
