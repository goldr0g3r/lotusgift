"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  FileText,
  Users,
  MessageSquare,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const navGroups: Array<{
  title: string;
  items: Array<{ name: string; href: string; icon: typeof Package }>;
}> = [
  {
    title: "Overview",
    items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Categories", href: "/admin/categories", icon: FolderOpen },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "Quotes", href: "/admin/quotes", icon: FileText },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Clients", href: "/admin/clients", icon: Users },
      { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Content", href: "/admin/content", icon: Palette },
      { name: "Wholesale", href: "/admin/wholesale", icon: Sparkles },
    ],
  },
  {
    title: "System",
    items: [{ name: "Settings", href: "/admin/settings", icon: Settings }],
  },
];

const allNav = navGroups.flatMap((g) => g.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user ?? null;

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!isPending && !user) router.push("/admin/login");
  }, [pathname, isPending, user, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: { onSuccess: () => router.push("/admin/login") },
    });
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (isPending) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-lotus-emerald-700 border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
  const currentPage = allNav.find((i) => isActive(i.href));

  const breadcrumb: Array<{ label: string; href?: string }> = [
    { label: "Admin", href: "/admin" },
  ];
  if (currentPage && currentPage.href !== "/admin") {
    breadcrumb.push({ label: currentPage.name });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-stone-200 z-50 transition-all duration-200 flex flex-col",
          sidebarOpen ? "w-64" : "w-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 h-16">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 flex items-center justify-center shadow-warm">
              <span className="font-display text-base font-bold text-white">L</span>
            </div>
            {sidebarOpen && (
              <div className="leading-none truncate">
                <span className="block font-display text-sm font-bold tracking-tight text-stone-900">
                  Lotus Gift
                </span>
                <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.18em] text-lotus-gold-700">
                  Admin
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-stone-100 hidden lg:block"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 text-stone-400 transition-transform",
                !sidebarOpen && "rotate-180",
              )}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-stone-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {sidebarOpen && (
                <p className="px-3 pb-1 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.18em]">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-lotus-emerald-50 text-lotus-emerald-800"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                    )}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        active ? "text-lotus-emerald-700" : "text-stone-400",
                      )}
                    />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-200">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 ring-1 ring-stone-200 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 text-xs font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-900 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-lotus-rose-700 hover:bg-lotus-rose-50 transition-colors w-full"
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 h-16">
          <div className="flex items-center justify-between h-full gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg hover:bg-stone-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <nav className="flex items-center gap-1.5 text-sm">
                {breadcrumb.map((b, i) => (
                  <span key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-stone-300">/</span>}
                    {b.href ? (
                      <Link
                        href={b.href}
                        className="text-stone-500 hover:text-stone-900"
                      >
                        {b.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-stone-900">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  placeholder="Search..."
                  className="input-field !py-2 !pl-9 w-56"
                />
              </div>
              <button
                className="p-2 rounded-lg hover:bg-stone-100 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-stone-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-lotus-rose-500 ring-2 ring-white" />
              </button>
              <Skeleton className="hidden" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
