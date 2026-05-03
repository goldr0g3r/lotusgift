"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import Logo from "@/components/Logo";
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
} from "lucide-react";

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
    if (!isPending && !user) {
      router.push("/portal/login");
    }
  }, [pathname, isPending, user, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/portal/login");
        },
      },
    });
  };

  if (publicPaths.includes(pathname)) return <>{children}</>;

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  const currentPage = navItems.find((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-gray-50/80">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-white border-r border-gray-100
                     transform transition-transform duration-200 ease-in-out
                     lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100">
            <Logo className="scale-75 origin-left" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="px-5 pt-2 text-xs font-medium text-brand-green-500 uppercase tracking-wider">
            Client Portal
          </p>

          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-brand-green-50 text-brand-green-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${active ? "text-brand-green-500" : "text-gray-400"}`}
                  />
                  {item.name}
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-brand-green-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
              Back to Website
            </Link>

            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-green-50/50">
                <div className="w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user.name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-md hover:bg-white text-gray-400 hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center gap-4 px-4 sm:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentPage?.name || "Portal"}
              </h1>
            </div>
            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">
                Welcome, {user.name}
              </span>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
