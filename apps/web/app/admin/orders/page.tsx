"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart, Search, ChevronDown, Eye, Clock, CheckCircle2,
  Truck, Package as PackageIcon, XCircle, IndianRupee,
} from "lucide-react";
import type { Order } from "@/lib/api";
import { api } from "@/lib/api";

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusConfig: Record<string, { class: string; icon: any }> = {
  PENDING: { class: "badge-yellow", icon: Clock },
  CONFIRMED: { class: "badge-green", icon: CheckCircle2 },
  PROCESSING: { class: "badge-green", icon: PackageIcon },
  SHIPPED: { class: "badge-green", icon: Truck },
  DELIVERED: { class: "badge-green", icon: CheckCircle2 },
  CANCELLED: { class: "badge-pink", icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Order[]>("/orders")
      .then(data => setOrders(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const updateRes = await api.patch<Order>(`/orders/${orderId}`, { status });
      if (updateRes?.id) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchTab = activeTab === "ALL" || o.status === activeTab;
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="flex gap-2">{[...Array(5)].map((_, i) => <div key={i} className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse" />)}</div>
        <div className="card divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-200 rounded w-48" /></div>
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-brand-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">({orders.filter(o => o.status === tab).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by order number..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Order</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Items</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Total</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p>No orders found</p>
                </td></tr>
              ) : filtered.map(order => {
                const cfg = (statusConfig[order.status] ?? statusConfig.PENDING)!;
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900">₹{order.total.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cfg.class}>{order.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {order.paidAt ? (
                        <span className="badge-green">Paid</span>
                      ) : (
                        <span className="badge-yellow">Unpaid</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {orders.length} orders</span>
          <div className="text-sm font-medium text-gray-900">
            Total: ₹{filtered.reduce((sum, o) => sum + o.total, 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
