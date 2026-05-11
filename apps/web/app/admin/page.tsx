"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  IndianRupee,
  Package,
  PlusCircle,
  ShoppingCart,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import {
  mockActivity,
  mockAdminStats,
  mockProducts,
  mockRevenueSeries,
} from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const statusTone: Record<
  string,
  "neutral" | "warning" | "green" | "danger"
> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "green",
  REJECTED: "danger",
  EXPIRED: "neutral",
  PENDING: "warning",
  CONFIRMED: "green",
  PROCESSING: "warning",
  SHIPPED: "green",
  DELIVERED: "green",
  CANCELLED: "danger",
};

export default function AdminDashboard() {
  const data = mockAdminStats;

  const maxRev = Math.max(...mockRevenueSeries.map((r) => r.revenue));

  const stats = [
    {
      label: "Total revenue",
      value: formatInr(data.totalRevenue),
      icon: IndianRupee,
      tone: "green",
      delta: "+ 8.2% MoM",
    },
    {
      label: "Pending quotes",
      value: data.pendingQuotes,
      icon: FileText,
      tone: "pink",
      delta: "Awaiting reply",
    },
    {
      label: "Active orders",
      value: data.pendingOrders,
      icon: ShoppingCart,
      tone: "neutral",
      delta: "In dispatch",
    },
    {
      label: "Total products",
      value: data.totalProducts,
      icon: Package,
      tone: "neutral",
      delta: "+ 4 this month",
    },
    {
      label: "Total clients",
      value: data.totalClients,
      icon: Users,
      tone: "green",
      delta: "+ 12 this month",
    },
    {
      label: "New inquiries",
      value: data.newInquiries,
      icon: Sparkles,
      tone: "pink",
      delta: "Last 24h",
    },
  ] as const;

  const topProducts = [...mockProducts]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Overview</span>
          <h2 className="mt-3 h2-display">Dashboard</h2>
          <p className="text-stone-500 mt-1 text-sm">
            Live snapshot of revenue, sales activity and operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new" className="btn-outline rounded-full">
            <PlusCircle className="h-4 w-4" />
            Add product
          </Link>
          <Link href="/admin/quotes/new" className="btn-primary btn-lg">
            <span className="btn-disc">
              <FileText className="h-4 w-4" />
            </span>
            New quote
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-white border border-stone-100 p-5"
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full ring-1",
                  stat.tone === "green" &&
                    "bg-brand-green-50 text-brand-green-700 ring-brand-green-100",
                  stat.tone === "pink" &&
                    "bg-brand-pink-50 text-brand-pink-700 ring-brand-pink-100",
                  stat.tone === "neutral" &&
                    "bg-stone-100 text-brand-ink-700 ring-stone-200",
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-stone-300" />
            </div>
            <p className="mt-4 text-xs text-stone-500">{stat.label}</p>
            <p className="mt-0.5 text-xl sm:text-2xl font-extrabold text-brand-ink-900 tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 text-[11px] text-stone-400">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Revenue
              </p>
              <h3 className="font-display text-xl font-extrabold text-brand-ink-900">
                Last 12 months
              </h3>
            </div>
            <span className="badge-green">
              <TrendingUp className="h-3 w-3" />
              + 38% YoY
            </span>
          </div>
          <div className="mt-6 flex items-end gap-2 h-40">
            {mockRevenueSeries.map((p) => (
              <div key={p.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-brand-green-500 to-brand-pink-400 transition-all hover:opacity-90"
                  style={{ height: `${(p.revenue / maxRev) * 100}%` }}
                  title={`${p.month}: ${formatInr(p.revenue)}`}
                />
                <span className="text-[10px] font-semibold text-stone-500 tabular-nums">
                  {p.month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500">This year</p>
              <p className="text-lg font-extrabold tabular-nums">
                {formatInr(mockRevenueSeries.reduce((s, r) => s + r.revenue, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Best month</p>
              <p className="text-lg font-extrabold tabular-nums">
                {formatInr(maxRev)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Avg / month</p>
              <p className="text-lg font-extrabold tabular-nums">
                {formatInr(
                  Math.round(
                    mockRevenueSeries.reduce((s, r) => s + r.revenue, 0) /
                      mockRevenueSeries.length,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-stone-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-brand-ink-900">
              Activity feed
            </h3>
            <Link
              href="/admin/inquiries"
              className="text-xs font-semibold text-brand-green-700 hover:text-brand-green-800 inline-flex items-center gap-1"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-5 space-y-4">
            {mockActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full bg-stone-100 text-stone-500">
                  {a.type === "quote" && <FileText className="h-4 w-4" />}
                  {a.type === "order" && <ShoppingCart className="h-4 w-4" />}
                  {a.type === "inquiry" && <Sparkles className="h-4 w-4" />}
                  {a.type === "product" && <Package className="h-4 w-4" />}
                  {a.type === "client" && <Users className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-ink-900 leading-snug">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {a.meta} ·{" "}
                    {new Date(a.createdAt).toLocaleString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100">
            <h3 className="font-display text-lg font-extrabold text-brand-ink-900">
              Recent quotes
            </h3>
            <Link
              href="/admin/quotes"
              className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800 inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {data.recentQuotes.map((q) => (
              <Link
                key={q.id}
                href="/admin/quotes"
                className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-stone-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-ink-900">
                    {q.quoteNumber}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5 truncate">
                    {q.client?.companyName || "Direct request"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={statusTone[q.status] ?? "neutral"}>{q.status}</Badge>
                  <p className="text-xs text-stone-500 mt-1 tabular-nums">
                    {formatInr(q.total)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100">
            <h3 className="font-display text-lg font-extrabold text-brand-ink-900">
              Top products
            </h3>
            <Link
              href="/admin/products"
              className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800 inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {topProducts.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="flex items-center gap-3 px-5 sm:px-6 py-4 hover:bg-stone-50"
              >
                <span className="text-xs font-bold text-stone-400 tabular-nums w-5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-ink-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {p.reviews ?? 0} reviews · {formatInr(p.priceFrom)}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
