"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  User,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Heart,
  FileText as FileTextIcon,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useCart, useQuoteBag, useWishlist } from "@/lib/store";
import { IconButton } from "@/components/ui/IconButton";
import Logo from "@/components/Logo";
import { cn } from "@/lib/cn";

const navItems = [
  { name: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { name: "My Quotes", href: "/portal/quotes", icon: FileText },
  { name: "My Orders", href: "/portal/orders", icon: ShoppingCart },
  { name: "Profile", href: "/portal/profile", icon: User },
];

const publicPaths = ["/portal/login", "/portal/register"];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user ?? null;
  const role = (user as { role?: string } | null)?.role;
  const cart = useCart();
  const bag = useQuoteBag();
  const wish = useWishlist();

  useEffect(() => {
    if (pathname && publicPaths.includes(pathname)) return;
    if (isPending) return;
    if (!user) {
      router.push("/portal/login");
      return;
    }
    if (role === "admin") {
      router.push("/admin");
    }
  }, [pathname, isPending, user, role, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/portal/login"),
      },
    });
  };

  if (pathname && publicPaths.includes(pathname)) return <>{children}</>;

  if (isPending || !user || role === "admin") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-500 border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname?.startsWith(href);
  const currentPage = navItems.find((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 z-40 h-screen w-[270px] shrink-0 border-r border-stone-100 bg-white transition-transform duration-200 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="h-full overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-5 h-16 border-b border-stone-100">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="ml-auto lg:hidden p-1 rounded-md hover:bg-stone-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.18em]">
                  Workspace
                </p>
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors",
                        active
                          ? "bg-brand-ink-900 text-white"
                          : "text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5",
                          active ? "text-white" : "text-stone-400",
                        )}
                      />
                      {item.name}
                      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}

                <p className="mt-6 px-3 pb-2 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.18em]">
                  Quick links
                </p>
                <Link
                  href="/products"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900"
                >
                  <Sparkles className="w-5 h-5 text-brand-pink-500" />
                  Browse catalog
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900"
                >
                  <ShoppingCart className="w-5 h-5 text-brand-pink-500" />
                  Cart
                  {cart.count > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-brand-pink-500 text-white text-[10px] font-bold px-2 py-0.5">
                      {cart.count}
                    </span>
                  )}
                </Link>
                <Link
                  href="/quote-bag"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900"
                >
                  <FileTextIcon className="w-5 h-5 text-brand-green-600" />
                  Quote bag
                  {bag.count > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-brand-green-500 text-white text-[10px] font-bold px-2 py-0.5">
                      {bag.count}
                    </span>
                  )}
                </Link>
                <Link
                  href="/portal/profile"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900"
                >
                  <Heart className="w-5 h-5 text-brand-pink-500" />
                  Wishlist ({wish.count})
                </Link>
              </nav>

              <div className="p-3 border-t border-stone-100 space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  <ArrowLeft className="w-5 h-5 text-stone-400" />
                  Back to website
                </Link>
                {user && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-stone-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-ink-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 rounded-full hover:bg-white text-stone-400 hover:text-rose-600"
                      title="Sign out"
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-100">
            <div className="flex items-center gap-3 px-5 sm:px-7 h-16">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden icon-circle h-9 w-9"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-lg font-extrabold text-brand-ink-900 truncate">
                  {currentPage?.name || "Portal"}
                </h1>
              </div>
              <IconButton
                ariaLabel="Cart"
                asLink="/cart"
                variant="dark"
                badgeCount={cart.count}
                badgeTone="pink"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4" />
              </IconButton>
              <IconButton
                ariaLabel="Quote bag"
                asLink="/quote-bag"
                variant="light"
                badgeCount={bag.count}
                badgeTone="green"
                size="sm"
              >
                <FileText className="h-4 w-4" />
              </IconButton>
            </div>
          </header>
          <main className="flex-1 p-5 sm:p-7 lg:p-8 bg-stone-50/40">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
