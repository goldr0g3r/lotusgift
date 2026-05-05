"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
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
  Search,
  Sparkles,
} from "lucide-react";
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

  useEffect(() => {
    if (publicPaths.includes(pathname)) return;
    if (!isPending && !user) router.push("/portal/login");
  }, [pathname, isPending, user, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/portal/login"),
      },
    });
  };

  if (publicPaths.includes(pathname)) return <>{children}</>;

  if (isPending) {
    return (
      <div className="min-h-screen bg-lotus-cream flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-lotus-emerald-700 border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname?.startsWith(href);
  const currentPage = navItems.find((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-lotus-cream">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-white border-r border-stone-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-200">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 flex items-center justify-center shadow-warm">
              <span className="font-display text-base font-bold text-white">L</span>
            </div>
            <div className="leading-none">
              <span className="block font-display text-base font-bold tracking-tight text-stone-900">
                Lotus Gift
              </span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.18em] text-lotus-gold-700">
                Client Portal
              </span>
            </div>
            <button
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-lotus-emerald-50 text-lotus-emerald-800"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      active ? "text-lotus-emerald-700" : "text-stone-400",
                    )}
                  />
                  {item.name}
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-lotus-emerald-500" />
                  )}
                </Link>
              );
            })}

            <p className="mt-6 px-3 pb-2 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.18em]">
              Quick links
            </p>
            <Link
              href="/products"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <Sparkles className="w-5 h-5 text-lotus-gold-600" />
              Browse catalog
            </Link>
            <Link
              href="/request-quote"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <FileText className="w-5 h-5 text-lotus-gold-600" />
              New quote request
            </Link>
          </nav>

          <div className="p-3 border-t border-stone-200 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5 text-stone-400" />
              Back to website
            </Link>

            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-lotus-emerald-50/60 ring-1 ring-lotus-emerald-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-stone-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-white text-stone-400 hover:text-lotus-rose-600"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 bg-lotus-cream/85 backdrop-blur-md border-b border-stone-200">
          <div className="flex items-center gap-4 px-4 sm:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-stone-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold text-stone-900 truncate">
                {currentPage?.name || "Portal"}
              </h1>
            </div>
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                placeholder="Search quotes, orders..."
                className="input-field !py-2 !pl-9 w-64 bg-white"
              />
            </div>
            {user && (
              <span className="text-sm text-stone-500 hidden xl:block">
                Hi, {user.name}
              </span>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
