"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Phone, ArrowRight } from "lucide-react";

const categories = [
  { name: "Corporate Gift Sets", slug: "corporate-gift-sets" },
  { name: "Drinkware", slug: "drinkware" },
  { name: "Bags & Backpacks", slug: "bags-backpacks" },
  { name: "Apparel", slug: "apparel" },
  { name: "Tech & Gadgets", slug: "tech-gadgets" },
  { name: "Stationery", slug: "stationery" },
  { name: "Eco Friendly", slug: "eco-friendly" },
  { name: "Trophies & Awards", slug: "trophies-awards" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products", hasDropdown: true },
  { label: "About Us", href: "/about" },
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
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-soft border-b border-gray-100/60"
          : "bg-white/95 backdrop-blur-md border-b border-transparent"
      }`}
    >
      {/* Top bar */}
      <div className="bg-gradient-to-r from-brand-green-600 via-brand-green-600 to-brand-green-700 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <span className="font-medium tracking-wide opacity-90">
            Premium Promotional Products & Corporate Gifts
          </span>
          <div className="hidden sm:flex items-center gap-5">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1.5 hover:text-brand-green-100 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>+91 98765 43210</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 group">
            <Image
              src="/logo.png"
              alt="Lotus Gift"
              width={140}
              height={32}
              className="object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  <Link
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-1 transition-all duration-200 ${
                      isActive(link.href) || isActive("/categories")
                        ? "text-brand-green-600 bg-brand-green-50"
                        : "text-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50/60"
                    }`}
                  >
                    {link.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}
                    />
                  </Link>
                  {productsOpen && (
                    <div className="absolute top-full left-0 pt-2 z-50 animate-slide-down">
                      <div className="w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated border border-gray-100/80 p-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/categories/${cat.slug}`}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-brand-green-50 hover:text-brand-green-600 rounded-xl transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green-300" />
                            {cat.name}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <Link
                            href="/products"
                            className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-brand-green-600 hover:bg-brand-green-50 rounded-xl transition-colors"
                          >
                            View All Products
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-brand-green-600 bg-brand-green-50"
                      : "text-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50/60"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/portal/login"
              className="hidden sm:inline-flex text-sm font-medium text-gray-500 hover:text-brand-green-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              Client Login
            </Link>
            <Link href="/request-quote" className="btn-primary text-sm !py-2 !px-5">
              Get a Quote
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl animate-slide-down">
          <div className="px-4 py-5 space-y-1">
            {navLinks
              .filter((l) => !l.hasDropdown)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive(link.href)
                      ? "text-brand-green-600 bg-brand-green-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

            <div className="px-4 pt-2 pb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Products
              </p>
            </div>
            <Link
              href="/products"
              className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                pathname === "/products"
                  ? "text-brand-green-600 bg-brand-green-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="block px-7 py-2.5 text-sm text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                {cat.name}
              </Link>
            ))}

            <div className="border-t border-gray-100 mt-3 pt-3">
              <Link
                href="/portal/login"
                className="block px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Client Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
