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
import { IconButton } from "@/components/ui/IconButton";
import Logo from "@/components/Logo";
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
  const role = (user as { role?: string } | null)?.role;

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (isPending) return;
    if (!user) {
      router.push("/admin/login");
      return;
    }
    if (role && role !== "admin") {
      router.push("/portal");
    }
  }, [pathname, isPending, user, role, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: { onSuccess: () => router.push("/admin/login") },
    });
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (isPending || !user || (role && role !== "admin")) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-500 border-t-transparent" />
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
    <div className="min-h-screen bg-white">
      <div className="flex">
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen border-r border-stone-100 bg-white transition-all duration-200 flex flex-col",
            sidebarOpen ? "w-[260px]" : "w-[88px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-stone-100 h-16">
            {sidebarOpen ? <Logo size="sm" /> : <Logo size="sm" />}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-full hover:bg-stone-100 hidden lg:block"
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
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-full hover:bg-stone-100 lg:hidden"
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-colors",
                        active
                          ? "bg-brand-ink-900 text-white"
                          : "text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900",
                      )}
                      title={!sidebarOpen ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          active ? "text-white" : "text-stone-400",
                        )}
                      />
                      {sidebarOpen && <span>{item.name}</span>}
                      {sidebarOpen && active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-pink-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-stone-100">
            {sidebarOpen && user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-stone-50 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-700 text-xs font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-ink-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors w-full"
              title={!sidebarOpen ? "Sign out" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Sign out</span>}
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-5 sm:px-7 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-full hover:bg-stone-100 lg:hidden"
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
                        className="text-stone-500 hover:text-brand-ink-900"
                      >
                        {b.label}
                      </Link>
                    ) : (
                      <span className="font-bold text-brand-ink-900">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  placeholder="Search products, orders, clients…"
                  className="w-72 rounded-full border border-stone-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500/30"
                />
              </div>
              <IconButton ariaLabel="Notifications" variant="light" size="sm">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-pink-500" />
              </IconButton>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink-900 text-white text-[10px] font-bold">
                  {user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="text-sm font-semibold text-brand-ink-900">
                  {user.name?.split(" ")[0]}
                </span>
              </div>
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
