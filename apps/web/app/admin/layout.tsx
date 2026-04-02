"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, FileText,
  Users, MessageSquare, Palette, Settings, LogOut, Menu, X,
  Bell, ChevronLeft, Search, Loader2,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: FolderOpen },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Quotes", href: "/admin/quotes", icon: FileText },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { name: "Content", href: "/admin/content", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user ?? null;

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!isPending && !user) {
      router.push("/admin/login");
    }
  }, [pathname, isPending, user, router]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/admin/login");
        },
      },
    });
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-200 flex flex-col ${sidebarOpen ? "w-64" : "w-20"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {sidebarOpen && <Image src="/logo.png" alt="Lotus Gift" width={120} height={28} className="object-contain" />}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 hidden lg:block">
            <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-brand-green-50 text-brand-green-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          {sidebarOpen && user && (
            <div className="px-3 py-2 mb-2">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {navItems.find((i) => isActive(i.href))?.name || "Admin"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
