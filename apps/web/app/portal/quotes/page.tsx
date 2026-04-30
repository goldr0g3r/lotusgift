"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";

type QuoteItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customization?: string | null;
  product: { id: string; name: string; sku: string; imageUrl?: string | null };
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

const statusConfig: Record<
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
    api.get<Quote[]>("/quotes")
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) => {
    const matchSearch =
      q.quoteNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeTab === "all" || q.status === activeTab;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">
          Error loading quotes
        </h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Quotes</h2>
        <p className="text-gray-500 mt-1">
          View and track all your quotation requests
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? "border-brand-green-500 text-brand-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by quote number..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((quote) => {
          const config = statusConfig[quote.status] || {
            label: quote.status,
            className: "badge-gray",
            icon: Clock,
          };
          const StatusIcon = config.icon;
          const expanded = expandedId === quote.id;

          return (
            <div
              key={quote.id}
              className="card hover:shadow-md transition-all"
            >
              <button
                onClick={() =>
                  setExpandedId(expanded ? null : quote.id)
                }
                className="w-full p-5 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {quote.quoteNumber}
                        </h3>
                        <span className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {quote.items.length} items &middot;{" "}
                        {new Date(quote.createdAt).toLocaleDateString()}
                        {quote.validUntil && (
                          <>
                            {" "}
                            &middot; Valid until{" "}
                            {new Date(quote.validUntil).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      {quote.discount > 0 && (
                        <span className="text-xs text-brand-pink-500 font-medium">
                          -₹{quote.discount.toLocaleString("en-IN")} discount
                        </span>
                      )}
                      <div className="text-lg font-bold text-gray-900">
                        ₹{quote.total.toLocaleString("en-IN")}
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 p-5">
                  {quote.items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No items in this quote
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quote Items
                      </h4>
                      {quote.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              SKU: {item.product.sku}
                              {item.customization && (
                                <>
                                  {" "}
                                  &middot; Custom: {item.customization}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{item.total.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} &times; ₹
                              {item.unitPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">
                              ₹{quote.subtotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {quote.discount > 0 && (
                            <div className="flex items-center gap-6 text-sm">
                              <span className="text-gray-500">Discount</span>
                              <span className="font-medium text-brand-pink-500">
                                -₹{quote.discount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-6 text-sm font-bold">
                            <span className="text-gray-700">Total</span>
                            <span className="text-gray-900">
                              ₹{quote.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-700">
                            Notes
                          </p>
                          <p className="text-sm text-amber-600 mt-1">
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
          <FileText className="w-12 h-12 text-gray-200 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            No quotes found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {quotes.length === 0
              ? "You don't have any quotes yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
