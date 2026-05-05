"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { productImage } from "@/lib/images";
import { cn } from "@/lib/cn";

type QuoteItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customization?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    slug?: string;
    imageUrl?: string | null;
    category?: { slug?: string } | null;
  };
};

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  items: QuoteItem[];
};

const statusMap: Record<
  string,
  { label: string; tone: "gray" | "yellow" | "emerald" | "rose"; icon: typeof Clock }
> = {
  DRAFT: { label: "Draft", tone: "gray", icon: Clock },
  SENT: { label: "Sent", tone: "yellow", icon: Send },
  ACCEPTED: { label: "Accepted", tone: "emerald", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", tone: "rose", icon: AlertCircle },
  EXPIRED: { label: "Expired", tone: "gray", icon: AlertCircle },
};

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Sent", value: "SENT" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
];

export default function PortalQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Quote[]>("/quotes")
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) => {
    const matchSearch = q.quoteNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeTab === "all" || q.status === activeTab;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-lotus-rose-300 mx-auto" />
        <h3 className="mt-4 font-semibold text-stone-900">Error loading quotes</h3>
        <p className="text-sm text-stone-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">My quotes</h2>
        <p className="text-stone-500 mt-1 text-sm">
          View and track all your quotation requests.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.value
                  ? "border-lotus-emerald-700 text-lotus-emerald-800"
                  : "border-transparent text-stone-500 hover:text-stone-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-stone-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              type="text"
              placeholder="Search by quote number..."
              className="!pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((quote) => {
          const cfg = statusMap[quote.status] || statusMap.DRAFT!;
          const Icon = cfg.icon;
          const expanded = expandedId === quote.id;
          const firstItem = quote.items[0];

          return (
            <div key={quote.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : quote.id)}
                className="w-full p-5 text-left hover:bg-stone-50/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {firstItem ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200">
                        <ImageWithFallback
                          src={productImage(firstItem.product).src}
                          alt={firstItem.product.name}
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-50 ring-1 ring-stone-200">
                        <FileText className="h-5 w-5 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-stone-900">
                          {quote.quoteNumber}
                        </h3>
                        <Badge tone={cfg.tone}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {quote.items.length} items ·{" "}
                        {new Date(quote.createdAt).toLocaleDateString()}
                        {quote.validUntil &&
                          ` · Valid until ${new Date(quote.validUntil).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      {quote.discount > 0 && (
                        <span className="text-xs text-lotus-rose-600 font-medium">
                          -₹{quote.discount.toLocaleString("en-IN")} off
                        </span>
                      )}
                      <div className="text-lg font-bold text-stone-900 tabular-nums">
                        ₹{quote.total.toLocaleString("en-IN")}
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-stone-100 p-5 animate-slide-down">
                  {quote.items.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-4">
                      No items in this quote
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.18em]">
                        Quote items
                      </h4>
                      {quote.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-xl bg-stone-50 p-3"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                            <ImageWithFallback
                              src={productImage(item.product).src}
                              alt={item.product.name}
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              SKU: {item.product.sku}
                              {item.customization && ` · Custom: ${item.customization}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-stone-900 tabular-nums">
                              ₹{item.total.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-stone-500 tabular-nums">
                              {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-3 border-t border-stone-100">
                        <div className="text-right space-y-1 text-sm tabular-nums">
                          <div className="flex items-center gap-6">
                            <span className="text-stone-500">Subtotal</span>
                            <span className="font-medium text-stone-900">
                              ₹{quote.subtotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {quote.discount > 0 && (
                            <div className="flex items-center gap-6">
                              <span className="text-stone-500">Discount</span>
                              <span className="font-medium text-lotus-rose-600">
                                -₹{quote.discount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-6 font-bold">
                            <span className="text-stone-700">Total</span>
                            <span className="text-stone-900">
                              ₹{quote.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="mt-3 rounded-xl bg-lotus-gold-50 p-3 ring-1 ring-lotus-gold-100">
                          <p className="text-xs font-semibold text-lotus-gold-800">Notes</p>
                          <p className="mt-1 text-sm text-lotus-gold-900/85">
                            {quote.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-stone-200 mx-auto" />
          <h3 className="mt-4 font-semibold text-stone-900">No quotes found</h3>
          <p className="text-sm text-stone-500 mt-1">
            {quotes.length === 0
              ? "You don't have any quotes yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      )}
    </div>
  );
}
