"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Loader2,
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

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string; sku: string };
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

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock; step: number }
> = {
  PENDING: { label: "Pending", className: "badge-yellow", icon: Clock, step: 1 },
  CONFIRMED: { label: "Confirmed", className: "badge-green", icon: CheckCircle2, step: 2 },
  PROCESSING: { label: "Processing", className: "badge-pink", icon: Package, step: 3 },
  SHIPPED: { label: "Shipped", className: "badge-green", icon: Truck, step: 4 },
  DELIVERED: { label: "Delivered", className: "badge-green", icon: CheckCircle2, step: 5 },
  CANCELLED: {
    label: "Cancelled",
    className:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600",
    icon: XCircle,
    step: 0,
  },
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
    api.get<Order[]>("/orders")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = activeTab === "all" || o.status === activeTab;
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
          Error loading orders
        </h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <p className="text-gray-500 mt-1">
          Track your orders and view order history
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
              placeholder="Search by order number..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const config = statusConfig[order.status] || {
            label: order.status,
            className: "badge-gray",
            icon: Clock,
            step: 0,
          };
          const StatusIcon = config.icon;
          const expanded = expandedId === order.id;
          const currentStep = config.step;
          const isCancelled = order.status === "CANCELLED";

          return (
            <div
              key={order.id}
              className="card hover:shadow-md transition-all"
            >
              <button
                onClick={() =>
                  setExpandedId(expanded ? null : order.id)
                }
                className="w-full p-5 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <span className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                        {order.paidAt && (
                          <span className="badge-green">Paid</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.items.length} items &middot;{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                        {order.quote && (
                          <>
                            {" "}
                            &middot; From {order.quote.quoteNumber}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{order.total.toLocaleString("en-IN")}
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
                <div className="border-t border-gray-100 p-5 space-y-5">
                  {!isCancelled && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        Order Progress
                      </h4>
                      <div className="flex items-center gap-1">
                        {trackingSteps.map((step, index) => {
                          const stepNum = index + 1;
                          const isComplete = stepNum <= currentStep;
                          const isCurrent = stepNum === currentStep;
                          return (
                            <div key={step} className="flex-1 flex flex-col items-center">
                              <div className="flex items-center w-full">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mx-auto ${
                                    isComplete
                                      ? "bg-brand-green-500 text-white"
                                      : "bg-gray-100 text-gray-400"
                                  } ${isCurrent ? "ring-4 ring-brand-green-100" : ""}`}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    stepNum
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-xs mt-2 ${isComplete ? "text-brand-green-600 font-medium" : "text-gray-400"}`}
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
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Order Items
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
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
                    </div>
                    <div className="flex justify-end pt-3 border-t border-gray-100 mt-3">
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-medium text-gray-900">
                            ₹{order.subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-medium text-brand-pink-500">
                              -₹{order.discount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-6 text-sm font-bold">
                          <span className="text-gray-700">Total</span>
                          <span className="text-gray-900">
                            ₹{order.total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500">
                        Shipping Address
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {order.shippingAddress}
                      </p>
                    </div>
                  )}

                  {order.notes && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs font-medium text-amber-700">
                        Notes
                      </p>
                      <p className="text-sm text-amber-600 mt-1">
                        {order.notes}
                      </p>
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
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            No orders found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length === 0
              ? "You don't have any orders yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
