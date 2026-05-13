"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  FileText,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useSession } from "@/lib/auth-client";
import { useUserOrders, useUserQuotes } from "@/lib/store";
import { mockProducts } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const quoteStatusTone: Record<
  string,
  "neutral" | "warning" | "green" | "danger"
> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "green",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

const orderStatusTone: Record<
  string,
  "neutral" | "warning" | "green" | "danger"
> = {
  PENDING: "warning",
  CONFIRMED: "green",
  PROCESSING: "warning",
  SHIPPED: "green",
  DELIVERED: "green",
  CANCELLED: "danger",
};

export default function PortalDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const orders = useUserOrders();
  const quotes = useUserQuotes();

  const pendingQuotes = quotes.filter(
    (q) => q.status === "SENT" || q.status === "DRAFT",
  );
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  const stats = [
    {
      title: "Total quotes",
      value: quotes.length,
      icon: FileText,
      tone: "green",
      href: "/portal/quotes",
      delta: "+ 2 this month",
    },
    {
      title: "Total orders",
      value: orders.length,
      icon: ShoppingCart,
      tone: "pink",
      href: "/portal/orders",
      delta: "+ 1 this month",
    },
    {
      title: "Pending quotes",
      value: pendingQuotes.length,
      icon: Clock,
      tone: "neutral",
      href: "/portal/quotes",
      delta: pendingQuotes.length > 0 ? "Awaiting reply" : "All caught up",
    },
    {
      title: "Lifetime spend",
      value: formatInr(totalSpent),
      icon: TrendingUp,
      tone: "green",
      href: "/portal/orders",
      delta: "Across orders",
    },
  ] as const;

  const recommendations = mockProducts.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-ink-900 via-brand-green-800 to-brand-green-600 p-6 sm:p-9 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-pink-500/30 blur-3xl"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-pink-200 ring-1 ring-white/15">
              <Sparkles className="h-3 w-3" />
              Welcome back
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold">
              {user?.name ? `Hi ${user.name.split(" ")[0]},` : "Hi there,"} let&apos;s
              build your next program
            </h2>
            <p className="mt-2 text-sm text-white/80 max-w-xl">
              Track active quotes, monitor live shipments, or kick off a new
              campaign in just a few clicks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/request-quote" className="btn-pink btn-lg">
              <span className="btn-disc">
                <ArrowRight className="h-4 w-4" />
              </span>
              New quote
            </Link>
            <Link href="/products" className="btn-outline-pink rounded-full bg-white/5 border-white/30 text-white hover:bg-white/15">
              Browse catalog
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group rounded-3xl bg-white border border-stone-100 p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all"
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full ring-1",
                  stat.tone === "green" && "bg-brand-green-50 text-brand-green-700 ring-brand-green-100",
                  stat.tone === "pink" && "bg-brand-pink-50 text-brand-pink-700 ring-brand-pink-100",
                  stat.tone === "neutral" && "bg-stone-100 text-brand-ink-700 ring-stone-200",
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 group-hover:translate-x-0.5 group-hover:text-brand-ink-900 transition" />
            </div>
            <div className="mt-5">
              <div className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-stone-500 mt-0.5">{stat.title}</div>
              <div className="mt-2 text-[11px] text-stone-400">{stat.delta}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100">
            <h3 className="font-display text-lg font-extrabold text-brand-ink-900">
              Recent quotes
            </h3>
            <Link
              href="/portal/quotes"
              className="text-sm text-brand-green-700 hover:text-brand-green-800 font-semibold inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">No quotes yet</p>
              <Link href="/request-quote" className="btn-primary btn-sm mt-4 mx-auto">
                Start your first quote
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {quotes.slice(0, 5).map((q) => (
                <Link
                  key={q.id}
                  href={`/portal/quotes`}
                  className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 ring-1 ring-stone-200">
                    <FileText className="h-4 w-4 text-stone-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-brand-ink-900">
                        {q.quoteNumber}
                      </span>
                      <Badge tone={quoteStatusTone[q.status] ?? "neutral"}>
                        {q.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {q.items.length} items · {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-ink-900 tabular-nums">
                      {formatInr(q.total)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-stone-100">
            <h3 className="font-display text-lg font-extrabold text-brand-ink-900">
              Active shipments
            </h3>
          </div>
          {orders.filter((o) => o.status === "SHIPPED" || o.status === "PROCESSING").length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">No active shipments</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders
                .filter(
                  (o) => o.status === "SHIPPED" || o.status === "PROCESSING",
                )
                .slice(0, 4)
                .map((o) => (
                  <Link
                    key={o.id}
                    href="/portal/orders"
                    className="flex items-center gap-3 px-5 sm:px-6 py-3 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-ink-900 truncate">
                        {o.orderNumber}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {o.items.length} items · {formatInr(o.total)}
                      </p>
                    </div>
                    <Badge tone={orderStatusTone[o.status] ?? "neutral"} size="sm">
                      {o.status}
                    </Badge>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between mb-5">
          <h3 className="h3-display">Recommended for you</h3>
          <Link
            href="/products"
            className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800 inline-flex items-center gap-1"
          >
            See more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
