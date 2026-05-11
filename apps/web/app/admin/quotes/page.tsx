"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { mockQuotes } from "@/lib/mock-data";
import type { QuoteStatus } from "@/lib/api-types";
import { cn } from "@/lib/cn";

const statuses: ("all" | QuoteStatus)[] = [
  "all",
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
];

const tone: Record<QuoteStatus, "neutral" | "warning" | "green" | "danger"> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "green",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

export default function AdminQuotesPage() {
  const [filter, setFilter] = useState<(typeof statuses)[number]>("all");
  const list =
    filter === "all" ? mockQuotes : mockQuotes.filter((q) => q.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-3 h2-display">Quotes</h2>
          <p className="text-stone-500 mt-1 text-sm">
            {list.length} of {mockQuotes.length} quotes
          </p>
        </div>
        <Link href="/admin/quotes/new" className="btn-primary btn-lg">
          <span className="btn-disc">
            <PlusCircle className="h-4 w-4" />
          </span>
          New quote
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === s
                ? "bg-brand-ink-900 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
            )}
          >
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50/60 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left px-5 py-3">Quote</th>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Items</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Valid until</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((q) => (
                <tr key={q.id} className="hover:bg-stone-50/40">
                  <td className="px-5 py-3 font-bold text-brand-ink-900">
                    {q.quoteNumber}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {q.client?.companyName ?? "Direct"}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {q.items.length} items
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatInr(q.total)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={tone[q.status]}>{q.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {q.validUntil
                      ? new Date(q.validUntil).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/quotes/${q.id}`}
                      className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
