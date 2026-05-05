"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  AlertCircle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { productImage } from "@/lib/images";
import { cn } from "@/lib/cn";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    sku: string;
    slug?: string;
    imageUrl?: string | null;
    category?: { slug?: string } | null;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
  quote?: { id: string; quoteNumber: string } | null;
};

const statusMap: Record<
  string,
  {
    label: string;
    tone: "gray" | "yellow" | "emerald" | "rose";
    icon: typeof Clock;
    step: number;
  }
> = {
  PENDING: { label: "Pending", tone: "yellow", icon: Clock, step: 1 },
  CONFIRMED: { label: "Confirmed", tone: "emerald", icon: CheckCircle2, step: 2 },
  PROCESSING: { label: "Processing", tone: "yellow", icon: Package, step: 3 },
  SHIPPED: { label: "Shipped", tone: "emerald", icon: Truck, step: 4 },
  DELIVERED: { label: "Delivered", tone: "emerald", icon: CheckCircle2, step: 5 },
  CANCELLED: { label: "Cancelled", tone: "rose", icon: XCircle, step: 0 },
};

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

const trackingSteps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Order[]>("/orders")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeTab === "all" || o.status === activeTab;
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
        <h3 className="mt-4 font-semibold text-stone-900">Error loading orders</h3>
        <p className="text-sm text-stone-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">My orders</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Track your orders and view order history.
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
              placeholder="Search by order number..."
              className="!pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const cfg = statusMap[order.status] || {
            label: order.status,
            tone: "gray" as const,
            icon: Clock,
            step: 0,
          };
          const Icon = cfg.icon;
          const expanded = expandedId === order.id;
          const currentStep = cfg.step;
          const isCancelled = order.status === "CANCELLED";
          const firstItem = order.items[0];

          return (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : order.id)}
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
                        <ShoppingCart className="h-5 w-5 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-stone-900">
                          {order.orderNumber}
                        </h3>
                        <Badge tone={cfg.tone}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                        {order.paidAt && <Badge tone="emerald">Paid</Badge>}
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {order.items.length} items ·{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                        {order.quote && ` · From ${order.quote.quoteNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-stone-900 tabular-nums">
                        ₹{order.total.toLocaleString("en-IN")}
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
                <div className="border-t border-stone-100 p-5 space-y-5 animate-slide-down">
                  {!isCancelled && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.18em] mb-4">
                        Order progress
                      </h4>
                      <div className="flex items-center gap-1">
                        {trackingSteps.map((step, index) => {
                          const stepNum = index + 1;
                          const isComplete = stepNum <= currentStep;
                          const isCurrent = stepNum === currentStep;
                          return (
                            <div
                              key={step}
                              className="flex-1 flex flex-col items-center"
                            >
                              <div
                                className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold mx-auto",
                                  isComplete
                                    ? "bg-lotus-emerald-700 text-white"
                                    : "bg-stone-100 text-stone-400",
                                  isCurrent && "ring-4 ring-lotus-emerald-100",
                                )}
                              >
                                {isComplete ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  stepNum
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[11px] mt-2",
                                  isComplete
                                    ? "text-lotus-emerald-700 font-semibold"
                                    : "text-stone-400",
                                )}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.18em] mb-3">
                      Order items
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
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
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-stone-900 tabular-nums">
                              ₹{item.total.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-stone-500 tabular-nums">
                              {item.quantity} × ₹
                              {item.unitPrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-3 border-t border-stone-100 mt-3">
                      <div className="text-right space-y-1 text-sm tabular-nums">
                        <div className="flex items-center gap-6">
                          <span className="text-stone-500">Subtotal</span>
                          <span className="font-medium text-stone-900">
                            ₹{order.subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex items-center gap-6">
                            <span className="text-stone-500">Discount</span>
                            <span className="font-medium text-lotus-rose-600">
                              -₹{order.discount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-6 font-bold">
                          <span className="text-stone-700">Total</span>
                          <span className="text-stone-900">
                            ₹{order.total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Shipping address
                      </p>
                      <p className="mt-1 text-sm text-stone-700">{order.shippingAddress}</p>
                    </div>
                  )}

                  {order.notes && (
                    <div className="rounded-xl bg-lotus-gold-50 p-3 ring-1 ring-lotus-gold-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lotus-gold-700">
                        Notes
                      </p>
                      <p className="mt-1 text-sm text-lotus-gold-900/85">{order.notes}</p>
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
          <ShoppingCart className="w-12 h-12 text-stone-200 mx-auto" />
          <h3 className="mt-4 font-semibold text-stone-900">No orders found</h3>
          <p className="text-sm text-stone-500 mt-1">
            {orders.length === 0
              ? "You don't have any orders yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      )}
    </div>
  );
}
