"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingCart,
  Clock,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string }[];
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

const quoteStatusTone: Record<
  string,
  { label: string; tone: "gray" | "yellow" | "emerald" | "rose"; icon: typeof Clock }
> = {
  DRAFT: { label: "Draft", tone: "gray", icon: Clock },
  SENT: { label: "Sent", tone: "yellow", icon: Send },
  ACCEPTED: { label: "Accepted", tone: "emerald", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", tone: "rose", icon: AlertCircle },
  EXPIRED: { label: "Expired", tone: "gray", icon: AlertCircle },
};

export default function PortalDashboardPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user ?? null;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Quote[]>("/quotes").catch(() => []),
      api.get<Order[]>("/orders").catch(() => []),
    ])
      .then(([q, o]) => {
        setQuotes(Array.isArray(q) ? q : []);
        setOrders(Array.isArray(o) ? o : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingQuotes = quotes.filter((q) => q.status === "SENT" || q.status === "DRAFT");
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  const stats = [
    {
      title: "Total quotes",
      value: quotes.length,
      icon: FileText,
      tone: "emerald" as const,
      href: "/portal/quotes",
      delta: "+ 2 this month",
    },
    {
      title: "Total orders",
      value: orders.length,
      icon: ShoppingCart,
      tone: "gold" as const,
      href: "/portal/orders",
      delta: "+ 1 this month",
    },
    {
      title: "Pending quotes",
      value: pendingQuotes.length,
      icon: Clock,
      tone: "rose" as const,
      href: "/portal/quotes",
      delta: pendingQuotes.length > 0 ? "Awaiting your review" : "All caught up",
    },
    {
      title: "Lifetime spend",
      value: `₹${totalSpent.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      tone: "emerald" as const,
      href: "/portal/orders",
      delta: "Across orders",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-lotus-emerald-700 via-lotus-emerald-800 to-stone-900 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lotus-gold-500/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lotus-gold-200 ring-1 ring-white/15">
              <Sparkles className="h-3 w-3" />
              Welcome back
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold">
              {user?.name ? `Hi ${user.name.split(" ")[0]},` : "Hi there,"} let&apos;s
              build your next program
            </h2>
            <p className="mt-2 text-sm text-stone-100/80 max-w-xl">
              Browse fresh ideas, request quotes, or track orders in flight.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-lotus-gold-400 transition-colors"
            >
              New quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
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
            className="card p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div
                className={
                  stat.tone === "emerald"
                    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100"
                    : stat.tone === "gold"
                      ? "flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100"
                      : "flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-rose-50 ring-1 ring-lotus-rose-100"
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
              <ArrowRight className="h-4 w-4 text-stone-300 group-hover:translate-x-0.5 group-hover:text-lotus-emerald-700 transition" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-stone-900 tabular-nums">
                {loading ? <Skeleton className="h-6 w-20" /> : stat.value}
              </div>
              <div className="text-sm text-stone-500 mt-0.5">{stat.title}</div>
              <div className="mt-2 text-[11px] text-stone-400">{stat.delta}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <h3 className="font-display text-lg font-bold text-stone-900">
              Recent quotes
            </h3>
            <Link
              href="/portal/quotes"
              className="text-sm text-lotus-emerald-700 hover:text-lotus-emerald-900 font-semibold inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">No quotes yet</p>
              <Link href="/request-quote" className="btn-primary mt-4 text-sm">
                Start your first quote
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {quotes.slice(0, 5).map((quote) => {
                const cfg = quoteStatusTone[quote.status] || quoteStatusTone.DRAFT!;
                const Icon = cfg.icon;
                return (
                  <Link
                    key={quote.id}
                    href="/portal/quotes"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/60 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 ring-1 ring-stone-200">
                      <FileText className="h-5 w-5 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-stone-900">
                          {quote.quoteNumber}
                        </span>
                        <Badge tone={cfg.tone}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {quote.items?.length || 0} items ·{" "}
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-stone-900 tabular-nums">
                        ₹{quote.total.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-stone-100">
            <h3 className="font-display text-lg font-bold text-stone-900">
              Quick actions
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/portal/quotes"
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100">
                <FileText className="h-5 w-5 text-lotus-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-900">View my quotes</p>
                <p className="text-xs text-stone-500">Check status & details</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 group-hover:translate-x-0.5 group-hover:text-lotus-emerald-700 transition" />
            </Link>
            <Link
              href="/portal/orders"
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-gold-50 ring-1 ring-lotus-gold-100">
                <ShoppingCart className="h-5 w-5 text-lotus-gold-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-900">Track orders</p>
                <p className="text-xs text-stone-500">View shipping & progress</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 group-hover:translate-x-0.5 group-hover:text-lotus-emerald-700 transition" />
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lotus-rose-50 ring-1 ring-lotus-rose-100">
                <Package className="h-5 w-5 text-lotus-rose-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-900">Browse products</p>
                <p className="text-xs text-stone-500">Explore the catalog</p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 group-hover:translate-x-0.5 group-hover:text-lotus-emerald-700 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
