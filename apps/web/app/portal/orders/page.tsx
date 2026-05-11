"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { useUserOrders } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/api-types";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
] as const;

const statusTone: Record<
  string,
  {
    tone: "neutral" | "warning" | "green" | "danger";
    icon: typeof Clock;
    label: string;
  }
> = {
  PENDING: { tone: "warning", icon: Clock, label: "Pending" },
  CONFIRMED: { tone: "green", icon: CheckCircle2, label: "Confirmed" },
  PROCESSING: { tone: "warning", icon: Package, label: "Processing" },
  SHIPPED: { tone: "green", icon: Truck, label: "Shipped" },
  DELIVERED: { tone: "green", icon: CheckCircle2, label: "Delivered" },
  CANCELLED: { tone: "danger", icon: XCircle, label: "Cancelled" },
};

const trackStages = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function TrackingBar({ status }: { status: Order["status"] }) {
  const currentIdx = trackStages.indexOf(status);
  return (
    <div className="flex items-center gap-2 mt-3">
      {trackStages.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-full rounded-full",
              i <= currentIdx ? "bg-brand-green-500" : "bg-stone-200",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export default function PortalOrdersPage() {
  const orders = useUserOrders();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]["id"]>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <span className="eyebrow-pink">My orders</span>
          <h2 className="mt-3 h2-display">Track your campaigns</h2>
          <p className="mt-2 text-sm text-stone-500">
            Every order, dispatch and delivery in one view. Invoices download
            as PDF.
          </p>
        </div>
        <Link href="/products" className="btn-primary btn-lg">
          <span className="btn-disc">
            <ArrowRight className="h-4 w-4" />
          </span>
          Browse catalog
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f.id
                ? "bg-brand-ink-900 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white border border-stone-100 p-10 text-center">
              <Package className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">
                No orders to display
              </p>
            </div>
          ) : (
            filtered.map((o) => {
              const cfg = statusTone[o.status]!;
              const Icon = cfg.icon;
              const active = selected?.id === o.id;
              return (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={cn(
                    "w-full rounded-3xl border p-5 sm:p-6 text-left transition-all",
                    active
                      ? "bg-brand-pink-50/40 border-brand-pink-200 shadow-elevated"
                      : "bg-white border-stone-100 hover:-translate-y-0.5 hover:shadow-elevated",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100">
                      <Package className="h-5 w-5 text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-brand-ink-900">
                          {o.orderNumber}
                        </p>
                        <Badge tone={cfg.tone}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {o.items.length} items · Placed{" "}
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                      <TrackingBar status={o.status} />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-brand-ink-900 tabular-nums">
                        {formatInr(o.total)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-stone-300 ml-auto mt-1" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-3 rounded-3xl bg-white border border-stone-100 p-6">
            {selected ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500">Order number</p>
                    <p className="text-lg font-extrabold text-brand-ink-900">
                      {selected.orderNumber}
                    </p>
                  </div>
                  <Badge tone={statusTone[selected.status]?.tone ?? "neutral"}>
                    {selected.status}
                  </Badge>
                </div>
                {selected.shippingAddress && (
                  <p className="mt-2 text-xs text-stone-500 inline-flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5" />
                    {selected.shippingAddress}
                  </p>
                )}

                <div className="mt-5 divide-y divide-stone-100 border-y border-stone-100">
                  {selected.items.map((it) => (
                    <div
                      key={it.id}
                      className="py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-ink-900 truncate">
                          {it.product.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {it.quantity} × {formatInr(it.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold text-brand-ink-900 tabular-nums">
                        {formatInr(it.total)}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="mt-5 space-y-2 text-sm">
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

                <div className="mt-6 flex gap-3">
                  <button type="button" className="btn-outline rounded-full flex-1">
                    <Download className="h-4 w-4" />
                    Invoice
                  </button>
                  <button type="button" className="btn-primary flex-1">
                    Track shipment
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-stone-200 mx-auto" />
                <p className="text-sm text-stone-500 mt-3">
                  Select an order to view details
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
