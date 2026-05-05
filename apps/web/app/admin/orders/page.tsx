"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Search } from "lucide-react";
import type { Order } from "@/lib/api";
import { api } from "@/lib/api";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const STATUS_TABS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const statusTone: Record<string, "yellow" | "emerald" | "rose" | "gray"> = {
  PENDING: "yellow",
  CONFIRMED: "emerald",
  PROCESSING: "yellow",
  SHIPPED: "emerald",
  DELIVERED: "emerald",
  CANCELLED: "rose",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Order[]>("/orders")
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : ((data as { data?: Order[] } | null)?.data ?? []);
        setOrders(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const updateRes = await api.patch<Order>(`/orders/${orderId}`, { status });
      if (updateRes?.id) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        );
        toast.success(`Order updated to ${status}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "ALL" || o.status === activeTab;
    const matchSearch =
      !search || o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Operations</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Orders
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            {orders.length} total order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === "ALL" ? orders.length : orders.filter((o) => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ring-1",
                active
                  ? "bg-lotus-emerald-700 text-white ring-lotus-emerald-700"
                  : "bg-white text-stone-600 hover:bg-stone-50 ring-stone-200",
              )}
            >
              {tab === "ALL"
                ? "All"
                : tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by order number..."
            className="!pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Order
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Date
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Items
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Total
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Status
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Payment
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Update
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3.5">
                      <Skeleton className="h-9" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-stone-200" />
                    <p className="text-stone-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-stone-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-stone-900">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge tone={statusTone[order.status] ?? "gray"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {order.paidAt ? (
                        <Badge tone="emerald">Paid</Badge>
                      ) : (
                        <Badge tone="yellow">Unpaid</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <Select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="!py-1.5 !px-2 !text-xs w-36"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between text-sm">
          <span className="text-stone-500">
            Showing {filtered.length} of {orders.length} orders
          </span>
          <div className="font-semibold text-stone-900 tabular-nums">
            Total: ₹{filtered.reduce((sum, o) => sum + o.total, 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
