"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { Menu, X, ChevronDown, Phone, ArrowRight, Shield, User, Users } from "lucide-react";

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
  { label: "Categories", href: "/admin/categories" },
  { label: "Clients", href: "/admin/clients", icon: Users },
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
      className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6 lg:px-8`}
    >
      <div
        className={`mx-auto max-w-7xl rounded-[2rem] transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-2xl shadow-elevated border border-white/60"
            : "bg-white/95 backdrop-blur-xl shadow-soft border border-transparent"
        }`}
      >
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex-shrink-0 group">
              <Logo className="transition-transform duration-300 group-hover:scale-[1.03]" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
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
                      className={`px-3 py-2 text-sm font-bold rounded-xl inline-flex items-center gap-1.5 transition-all duration-300 ${
                        isActive(link.href) || isActive("/categories")
                          ? "text-brand-green-600 bg-brand-green-50/80 shadow-inner-light"
                          : "text-slate-600 hover:text-brand-green-600 hover:bg-brand-green-50/50"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${productsOpen ? "rotate-180" : ""}`}
                      />
                    </Link>
                    {productsOpen && (
                      <div className="absolute top-full left-0 pt-3 z-50 animate-slide-down">
                        <div className="w-72 bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-elevated-lg border border-slate-100 p-3">
                          {categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              href={`/categories/${cat.slug}`}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-brand-green-50 hover:text-brand-green-600 rounded-xl transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-green-300 shadow-glow" />
                              {cat.name}
                            </Link>
                          ))}
                          <div className="border-t border-slate-100/60 mt-2 pt-2">
                            <Link
                              href="/products"
                              className="flex items-center justify-between px-3 py-2.5 text-sm font-bold text-brand-green-600 hover:bg-brand-green-50 rounded-xl transition-colors"
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
                    className={`px-3 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all duration-300 ${
                      isActive(link.href)
                        ? "text-brand-green-600 bg-brand-green-50/80 shadow-inner-light"
                        : "text-slate-600 hover:text-brand-green-600 hover:bg-brand-green-50/50"
                    }`}
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </Link>
                ),
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-green-600 transition-all duration-300 px-3 py-2 rounded-xl hover:bg-slate-50"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
              <Link
                href="/portal/login"
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-green-600 transition-all duration-300 px-3 py-2 rounded-xl hover:bg-slate-50"
              >
                <User className="w-4 h-4" />
                Login
              </Link>
              <Link href="/request-quote" className="btn-primary text-sm !py-2 !px-5 shadow-glow ml-1">
                Get a Quote
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 transition-colors ml-2"
              >
                {mobileOpen ? (
                  <X className="w-6 h-6 text-slate-700" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </div>

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
                  className={`px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors ${
                    isActive(link.href)
                      ? "text-brand-green-600 bg-brand-green-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
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

            <div className="border-t border-slate-100 mt-3 pt-3">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
              <Link
                href="/portal/login"
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
