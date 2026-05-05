"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  FileText,
  ShoppingCart,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type RecentItem = {
  id: string;
  status: string;
  total?: number;
  client?: { companyName?: string } | null;
  quoteNumber?: string;
  orderNumber?: string;
};

interface DashboardData {
  totalProducts: number;
  totalClients: number;
  totalQuotes: number;
  totalOrders: number;
  pendingQuotes: number;
  pendingOrders: number;
  totalRevenue: number;
  newInquiries: number;
  recentQuotes: RecentItem[];
  recentOrders: RecentItem[];
}

const statusBadge: Record<string, "gray" | "yellow" | "emerald" | "rose"> = {
  DRAFT: "gray",
  SENT: "yellow",
  ACCEPTED: "emerald",
  REJECTED: "rose",
  EXPIRED: "gray",
  PENDING: "yellow",
  CONFIRMED: "emerald",
  PROCESSING: "yellow",
  SHIPPED: "emerald",
  DELIVERED: "emerald",
  CANCELLED: "rose",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/dashboard/stats`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-lotus-rose-300 mx-auto" />
        <h3 className="mt-4 font-semibold text-stone-900">
          Failed to load dashboard data
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total products",
      value: data.totalProducts,
      icon: Package,
      tone: "emerald" as const,
      delta: "+ 4 this month",
      up: true,
    },
    {
      label: "Total clients",
      value: data.totalClients,
      icon: Users,
      tone: "gold" as const,
      delta: "+ 12 this month",
      up: true,
    },
    {
      label: "Pending quotes",
      value: data.pendingQuotes,
      icon: FileText,
      tone: "rose" as const,
      delta: data.pendingQuotes > 5 ? "Action needed" : "On track",
      up: data.pendingQuotes <= 5,
    },
    {
      label: "Total revenue",
      value: `₹${(data.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      tone: "emerald" as const,
      delta: "+ 8% MoM",
      up: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Overview</span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Dashboard
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            Snapshot of activity, orders and customer requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new" className="btn-secondary text-sm">
            <PlusCircle className="h-4 w-4" />
            Add product
          </Link>
          <Link href="/admin/quotes/new" className="btn-primary text-sm">
            <FileText className="h-4 w-4" />
            New quote
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const ToneIcon = stat.up ? TrendingUp : TrendingDown;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between">
                <div
                  className={
                    stat.tone === "emerald"
                      ? "flex h-11 w-11 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100"
                      : stat.tone === "gold"
                        ? "flex h-11 w-11 items-center justify-center rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100"
                        : "flex h-11 w-11 items-center justify-center rounded-xl bg-lotus-rose-50 ring-1 ring-lotus-rose-100"
                  }
                >
                  <stat.icon
                    className={
                      stat.tone === "emerald"
                        ? "h-5 w-5 text-lotus-emerald-700"
                        : stat.tone === "gold"
                          ? "h-5 w-5 text-lotus-gold-700"
                          : "h-5 w-5 text-lotus-rose-700"
                    }
                  />
                </div>
                <span
                  className={
                    stat.up
                      ? "inline-flex items-center gap-1 text-xs font-semibold text-lotus-emerald-700"
                      : "inline-flex items-center gap-1 text-xs font-semibold text-lotus-rose-700"
                  }
                >
                  <ToneIcon className="h-3 w-3" />
                  {stat.delta}
                </span>
              </div>
              <p className="mt-4 text-sm text-stone-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <h3 className="font-display text-lg font-bold text-stone-900">
              Recent quotes
            </h3>
            <Link
              href="/admin/quotes"
              className="text-sm text-lotus-emerald-700 hover:text-lotus-emerald-900 font-semibold inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data.recentQuotes.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">No quotes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.recentQuotes.map((q) => (
                <Link
                  key={q.id}
                  href="/admin/quotes"
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50/60 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-stone-900">
                      {q.quoteNumber}
                    </span>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                      {q.client?.companyName || "Direct"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={statusBadge[q.status] ?? "gray"}>{q.status}</Badge>
                    <p className="text-xs text-stone-500 mt-1 tabular-nums">
                      ₹{q.total?.toLocaleString("en-IN") ?? "0"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-stone-100">
            <h3 className="font-display text-lg font-bold text-stone-900">
              Quick actions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              {
                href: "/admin/products/new",
                label: "Add product",
                icon: Package,
                tone: "emerald" as const,
              },
              {
                href: "/admin/quotes/new",
                label: "New quote",
                icon: FileText,
                tone: "gold" as const,
              },
              {
                href: "/admin/clients/new",
                label: "Add client",
                icon: Users,
                tone: "rose" as const,
              },
              {
                href: "/admin/orders",
                label: "View orders",
                icon: ShoppingCart,
                tone: "emerald" as const,
              },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-2xl border border-stone-200 p-4 text-center hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
              >
                <div
                  className={
                    q.tone === "emerald"
                      ? "mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100 group-hover:scale-110 transition-transform"
                      : q.tone === "gold"
                        ? "mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100 group-hover:scale-110 transition-transform"
                        : "mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-rose-50 ring-1 ring-lotus-rose-100 group-hover:scale-110 transition-transform"
                  }
                >
                  <q.icon
                    className={
                      q.tone === "emerald"
                        ? "h-5 w-5 text-lotus-emerald-700"
                        : q.tone === "gold"
                          ? "h-5 w-5 text-lotus-gold-700"
                          : "h-5 w-5 text-lotus-rose-700"
                    }
                  />
                </div>
                <span className="mt-3 text-xs font-semibold text-stone-700 block">
                  {q.label}
                </span>
              </Link>
            ))}
          </div>
          {data.newInquiries > 0 && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-lotus-gold-700" />
              <span className="text-sm text-lotus-gold-900">
                {data.newInquiries} new inquir{data.newInquiries > 1 ? "ies" : "y"}
              </span>
              <Link
                href="/admin/inquiries"
                className="ml-auto text-sm font-semibold text-lotus-gold-800 hover:underline"
              >
                Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
