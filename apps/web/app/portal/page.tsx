"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingCart,
  Clock,
  ArrowRight,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";

const API = "http://localhost:3001/api";

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

const quoteStatusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  DRAFT: { label: "Draft", className: "badge-gray", icon: Clock },
  SENT: { label: "Sent", className: "badge-yellow", icon: Send },
  ACCEPTED: { label: "Accepted", className: "badge-green", icon: CheckCircle2 },
  REJECTED: {
    label: "Rejected",
    className:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600",
    icon: AlertCircle,
  },
  EXPIRED: { label: "Expired", className: "badge-gray", icon: AlertCircle },
};

export default function PortalDashboardPage() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("client_user");
    if (!userData) return;

    const parsed = JSON.parse(userData);
    setUser(parsed);

    const token = localStorage.getItem("client_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    Promise.all([
      fetch(`${API}/quotes?userId=${parsed.id}`, { headers }).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch(`${API}/orders?userId=${parsed.id}`, { headers }).then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([q, o]) => {
        setQuotes(Array.isArray(q) ? q : []);
        setOrders(Array.isArray(o) ? o : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingQuotes = quotes.filter(
    (q) => q.status === "SENT" || q.status === "DRAFT",
  );

  const stats = [
    {
      title: "Total Quotes",
      value: quotes.length,
      icon: FileText,
      color: "green" as const,
      href: "/portal/quotes",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      color: "pink" as const,
      href: "/portal/orders",
    },
    {
      title: "Pending Quotes",
      value: pendingQuotes.length,
      icon: Clock,
      color: "amber" as const,
      href: "/portal/quotes",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || "Client"}
        </h2>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your quotes and orders.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="card p-5 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === "green"
                    ? "bg-brand-green-50"
                    : stat.color === "pink"
                      ? "bg-brand-pink-50"
                      : "bg-amber-50"
                }`}
              >
                <stat.icon
                  className={`w-5 h-5 ${
                    stat.color === "green"
                      ? "text-brand-green-500"
                      : stat.color === "pink"
                        ? "text-brand-pink-500"
                        : "text-amber-500"
                  }`}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Quotes</h3>
            <Link
              href="/portal/quotes"
              className="text-sm text-brand-green-600 hover:text-brand-green-700 font-medium inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">No quotes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {quotes.slice(0, 5).map((quote) => {
                const config = quoteStatusConfig[quote.status] || {
                  label: quote.status,
                  className: "badge-gray",
                  icon: Clock,
                };
                return (
                  <div
                    key={quote.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {quote.quoteNumber}
                        </span>
                        <span className={config.className}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {quote.items?.length || 0} items &middot;{" "}
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{quote.total.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-3">
            <Link
              href="/portal/quotes"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center group-hover:bg-brand-green-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  View My Quotes
                </p>
                <p className="text-xs text-gray-500">
                  Check status &amp; details
                </p>
              </div>
            </Link>
            <Link
              href="/portal/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-pink-50 flex items-center justify-center group-hover:bg-brand-pink-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-brand-pink-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Track Orders
                </p>
                <p className="text-xs text-gray-500">
                  View shipping &amp; progress
                </p>
              </div>
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Browse Products
                </p>
                <p className="text-xs text-gray-500">
                  Explore our catalog
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
