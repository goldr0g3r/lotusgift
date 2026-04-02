"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Users, FileText, ShoppingCart, TrendingUp, ArrowRight, IndianRupee, Clock, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface DashboardData {
  totalProducts: number;
  totalClients: number;
  totalQuotes: number;
  totalOrders: number;
  pendingQuotes: number;
  pendingOrders: number;
  totalRevenue: number;
  newInquiries: number;
  recentQuotes: any[];
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/dashboard/stats`, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-20 mb-2" /><div className="h-8 bg-gray-200 rounded w-16" /></div>)}</div></div>;

  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load dashboard data</div>;

  const stats = [
    { label: "Total Products", value: data.totalProducts, icon: Package, color: "brand-green" },
    { label: "Total Clients", value: data.totalClients, icon: Users, color: "brand-pink" },
    { label: "Pending Quotes", value: data.pendingQuotes, icon: FileText, color: "amber" },
    { label: "Total Revenue", value: `₹${(data.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "brand-green" },
  ];

  const statusColors: Record<string, string> = {
    DRAFT: "badge-gray", SENT: "badge-yellow", ACCEPTED: "badge-green", REJECTED: "badge-pink",
    PENDING: "badge-yellow", CONFIRMED: "badge-green", PROCESSING: "badge-green", SHIPPED: "badge-green", DELIVERED: "badge-green", CANCELLED: "badge-pink",
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-${stat.color === "amber" ? "amber" : stat.color}-50 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color === "amber" ? "amber" : stat.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Quotes</h3>
            <Link href="/admin/quotes" className="text-sm text-brand-green-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentQuotes.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">No quotes yet</p>
            ) : data.recentQuotes.map((q: any) => (
              <Link key={q.id} href={`/admin/quotes`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-gray-900">{q.quoteNumber}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{q.client?.companyName || "Direct"}</p>
                </div>
                <div className="text-right">
                  <span className={statusColors[q.status] || "badge-gray"}>{q.status}</span>
                  <p className="text-xs text-gray-500 mt-1">₹{q.total?.toLocaleString("en-IN")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <Link href="/admin/products/new" className="card p-4 text-center hover:shadow-md transition-shadow group">
              <Package className="w-8 h-8 text-brand-green-500 mx-auto group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 mt-2 block">Add Product</span>
            </Link>
            <Link href="/admin/quotes/new" className="card p-4 text-center hover:shadow-md transition-shadow group">
              <FileText className="w-8 h-8 text-brand-pink-500 mx-auto group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 mt-2 block">New Quote</span>
            </Link>
            <Link href="/admin/clients/new" className="card p-4 text-center hover:shadow-md transition-shadow group">
              <Users className="w-8 h-8 text-blue-500 mx-auto group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 mt-2 block">Add Client</span>
            </Link>
            <Link href="/admin/orders" className="card p-4 text-center hover:shadow-md transition-shadow group">
              <ShoppingCart className="w-8 h-8 text-amber-500 mx-auto group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 mt-2 block">View Orders</span>
            </Link>
          </div>
          {data.newInquiries > 0 && (
            <div className="mx-5 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">{data.newInquiries} new contact inquiries</span>
              <Link href="/admin/inquiries" className="ml-auto text-sm font-medium text-amber-600 hover:underline">View</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
