"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ShoppingCart,
  Search,
  UserRound,
  FileText,
  Heart,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { IconButton } from "@/components/ui/IconButton";
import { SearchPill } from "@/components/ui/Input";
import Logo from "@/components/Logo";
import { useCart, useQuoteBag, useWishlist } from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import { mockCategories } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Categories", href: "/products" },
  { label: "Wholesale", href: "/products?wholesale=true" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cart = useCart();
  const quoteBag = useQuoteBag();
  const wish = useWishlist();
  const { data: session } = useSession();

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href.split("?")[0] ?? href);

  return (
    <header className="relative bg-white border-b border-stone-100 sticky top-0 z-40">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 flex items-center"
            aria-label="Lotus Gift home"
          >
            <Logo size="md" />
          </Link>

          <div className="hidden lg:flex items-center">
            <div className="pill-nav">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center gap-2"
                aria-label="Open menu"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink-900 text-white">
                  <Menu className="h-3.5 w-3.5" />
                </span>
                Menu
              </button>
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(isActive(l.href) && "is-active")}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <IconButton
              ariaLabel="Search"
              onClick={() => setSearchOpen(true)}
              variant="light"
            >
              <Search className="h-4 w-4" />
            </IconButton>
            <IconButton
              ariaLabel="Wishlist"
              asLink="/portal/profile"
              variant="light"
              badgeCount={wish.count}
              badgeTone="green"
              className="hidden sm:inline-flex"
            >
              <Heart className="h-4 w-4" />
            </IconButton>
            <IconButton
              ariaLabel="Quote bag"
              asLink="/quote-bag"
              variant="light"
              badgeCount={quoteBag.count}
              badgeTone="green"
              className="hidden sm:inline-flex"
            >
              <FileText className="h-4 w-4" />
            </IconButton>
            <IconButton
              ariaLabel="Cart"
              asLink="/cart"
              variant="dark"
              badgeCount={cart.count}
              badgeTone="pink"
            >
              <ShoppingCart className="h-4 w-4" />
            </IconButton>
            <div className="relative hidden sm:block">
              <IconButton
                ariaLabel="Account"
                variant="light"
                onClick={() => setProfileOpen((s) => !s)}
              >
                <UserRound className="h-4 w-4" />
              </IconButton>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-elevated ring-1 ring-stone-200 p-2 z-50 animate-slide-down">
                  {session?.user ? (
                    <>
                      <div className="px-3 py-2 border-b border-stone-100 mb-1">
                        <p className="text-sm font-semibold text-brand-ink-900 truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href={session.user.role === "admin" ? "/admin" : "/portal"}
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/portal/orders"
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        My orders
                      </Link>
                      <Link
                        href="/portal/quotes"
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        My quotes
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-rose-600"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/portal/login"
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        Client sign in
                      </Link>
                      <Link
                        href="/portal/register"
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        Create account
                      </Link>
                      <Link
                        href="/admin/login"
                        className="block px-3 py-2 text-sm rounded-xl hover:bg-stone-50 text-brand-ink-800"
                      >
                        Admin sign in
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden icon-circle"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="left"
        size="lg"
        title="Browse Lotus Gift"
      >
        <div className="px-6 py-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-stone-400">
            Shop by category
          </p>
          <ul className="mt-3 space-y-1">
            {mockCategories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 hover:bg-stone-50"
                >
                  <span className="text-sm font-semibold text-brand-ink-900">
                    {c.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/products"
              className="rounded-2xl bg-brand-green-50 p-4 text-sm font-semibold text-brand-green-700 inline-flex items-center justify-between"
            >
              All products
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/request-quote"
              className="rounded-2xl bg-brand-pink-50 p-4 text-sm font-semibold text-brand-pink-700 inline-flex items-center justify-between"
            >
              Request quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        side="top"
        size="lg"
        title="Search the catalog"
      >
        <div className="px-6 py-5 space-y-5">
          <SearchPill
            placeholder="Search hampers, drinkware, eco picks…"
            autoFocus
          />
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-stone-400">
              Popular searches
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Festive hampers",
                "Steel bottles",
                "Eco notebooks",
                "Welcome kits",
                "Apparel",
                "Trophies",
              ].map((t) => (
                <Link
                  key={t}
                  href={`/products?search=${encodeURIComponent(t)}`}
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-brand-ink-800 hover:bg-stone-200"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="right"
        size="md"
        title="Menu"
      >
        <div className="px-5 py-4 space-y-2">
          <Link
            href="/"
            className="block px-4 py-3 text-sm font-semibold rounded-2xl hover:bg-stone-50"
          >
            Home
          </Link>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block px-4 py-3 text-sm font-semibold rounded-2xl",
                isActive(l.href)
                  ? "bg-brand-green-50 text-brand-green-700"
                  : "hover:bg-stone-50",
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-stone-100">
            <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Categories
            </p>
            <div className="grid grid-cols-1 gap-1">
              {mockCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-brand-ink-800 rounded-2xl hover:bg-stone-50"
                >
                  {c.name}
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              className="rounded-2xl bg-brand-ink-900 text-white px-4 py-3 text-sm font-semibold text-center"
            >
              Cart ({cart.count})
            </Link>
            <Link
              href="/quote-bag"
              className="rounded-2xl bg-brand-green-50 text-brand-green-700 px-4 py-3 text-sm font-semibold text-center"
            >
              Quote bag ({quoteBag.count})
            </Link>
            <Link
              href="/portal/login"
              className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-center text-brand-ink-800"
            >
              Sign in
            </Link>
            <Link
              href="/request-quote"
              className="rounded-2xl bg-brand-pink-500 text-white px-4 py-3 text-sm font-semibold text-center"
            >
              Request quote
            </Link>
          </div>
        </div>
      </Sheet>
    </header>
  );
}
