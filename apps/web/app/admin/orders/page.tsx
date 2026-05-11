"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { formatInr } from "@/components/ui/PriceTag";
import { mockOrders } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";
import type { Order, OrderStatus } from "@/lib/api-types";
import { cn } from "@/lib/cn";

const statusFlow: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const tone: Record<OrderStatus, "neutral" | "warning" | "green" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "green",
  PROCESSING: "warning",
  SHIPPED: "green",
  DELIVERED: "green",
  CANCELLED: "danger",
};

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const list =
    filter === "all" ? mockOrders : mockOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-3 h2-display">Orders</h2>
          <p className="text-stone-500 mt-1 text-sm">
            Update statuses, track dispatches, view full invoice details.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["all", ...statusFlow, "CANCELLED"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f as typeof filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f
                ? "bg-brand-ink-900 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
            )}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50/60 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-5 py-3">Items</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50/40">
                  <td className="px-5 py-3 font-bold text-brand-ink-900">
                    {o.orderNumber}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {o.items.length} items
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatInr(o.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={tone[o.status]}>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected ? `Order ${selected.orderNumber}` : ""}
      >
        {selected && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center justify-between">
              <Badge tone={tone[selected.status]}>{selected.status}</Badge>
              <span className="text-sm text-stone-500">
                Placed {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Update status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusFlow.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      toast.success(`Status set to ${s}`);
                      setSelected({ ...selected, status: s });
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold",
                      selected.status === s
                        ? "bg-brand-green-500 text-white"
                        : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Items
              </p>
              <div className="mt-3 divide-y divide-stone-100">
                {selected.items.map((it) => (
                  <div
                    key={it.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-ink-900 truncate">
                        {it.product.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {it.quantity} × {formatInr(it.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatInr(it.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <dl className="space-y-2 text-sm border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-semibold tabular-nums">
                  {formatInr(selected.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Discount</dt>
                <dd className="font-semibold tabular-nums text-brand-green-700">
                  − {formatInr(selected.discount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">GST</dt>
                <dd className="font-semibold tabular-nums">
                  {formatInr(selected.tax)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2">
                <dt className="text-sm font-bold text-brand-ink-900">Total</dt>
                <dd className="text-xl font-extrabold tabular-nums">
                  {formatInr(selected.total)}
                </dd>
              </div>
            </dl>
            {selected.shippingAddress && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Shipping
                </p>
                <p className="mt-1 text-sm text-brand-ink-800">
                  {selected.shippingAddress}
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
