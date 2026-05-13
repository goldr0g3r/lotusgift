"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Send,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { useUserQuotes } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { Quote } from "@/lib/api-types";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "SENT", label: "Sent" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "DRAFT", label: "Draft" },
  { id: "REJECTED", label: "Rejected" },
  { id: "EXPIRED", label: "Expired" },
] as const;

const statusTone: Record<
  string,
  { tone: "neutral" | "warning" | "green" | "danger"; icon: typeof Clock; label: string }
> = {
  DRAFT: { tone: "neutral", icon: Clock, label: "Draft" },
  SENT: { tone: "warning", icon: Send, label: "Sent" },
  ACCEPTED: { tone: "green", icon: CheckCircle2, label: "Accepted" },
  REJECTED: { tone: "danger", icon: X, label: "Rejected" },
  EXPIRED: { tone: "neutral", icon: Clock, label: "Expired" },
};

export default function PortalQuotesPage() {
  const quotes = useUserQuotes();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]["id"]>("all");
  const [selected, setSelected] = useState<Quote | null>(null);

  const filtered =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <span className="eyebrow">My quotes</span>
          <h2 className="mt-3 h2-display">Your quote pipeline</h2>
          <p className="mt-2 text-sm text-stone-500">
            Track every quote we&apos;ve sent — accept, follow up, or duplicate
            for the next campaign.
          </p>
        </div>
        <Link href="/request-quote" className="btn-primary btn-lg">
          <span className="btn-disc">
            <ArrowRight className="h-4 w-4" />
          </span>
          New quote
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
              <FileText className="w-10 h-10 text-stone-200 mx-auto" />
              <p className="text-sm text-stone-500 mt-3">No quotes in this view</p>
            </div>
          ) : (
            filtered.map((q) => {
              const cfg = statusTone[q.status]!;
              const Icon = cfg.icon;
              const active = selected?.id === q.id;
              return (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => setSelected(q)}
                  className={cn(
                    "w-full rounded-3xl border p-5 sm:p-6 text-left transition-all",
                    active
                      ? "bg-brand-green-50/40 border-brand-green-200 shadow-elevated"
                      : "bg-white border-stone-100 hover:-translate-y-0.5 hover:shadow-elevated",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100">
                      <FileText className="h-5 w-5 text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-brand-ink-900">
                          {q.quoteNumber}
                        </p>
                        <Badge tone={cfg.tone}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {q.items.length} items · Created{" "}
                        {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-stone-500">
                        Valid until{" "}
                        {q.validUntil
                          ? new Date(q.validUntil).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-brand-ink-900 tabular-nums">
                        {formatInr(q.total)}
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
                    <p className="text-xs text-stone-500">Quote number</p>
                    <p className="text-lg font-extrabold text-brand-ink-900">
                      {selected.quoteNumber}
                    </p>
                  </div>
                  <Badge tone={statusTone[selected.status]?.tone ?? "neutral"}>
                    {selected.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Created {new Date(selected.createdAt).toLocaleDateString()} ·{" "}
                  Valid until{" "}
                  {selected.validUntil
                    ? new Date(selected.validUntil).toLocaleDateString()
                    : "—"}
                </p>

                <div className="mt-5 divide-y divide-stone-100 border-y border-stone-100">
                  {selected.items.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-3 text-sm">
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
                    <dd className="font-semibold tabular-nums">{formatInr(selected.subtotal)}</dd>
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

                {selected.notes && (
                  <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-xs text-stone-600 italic">
                    “{selected.notes}”
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button type="button" className="btn-pink flex-1">
                    Accept
                  </button>
                  <button type="button" className="btn-outline flex-1 rounded-full">
                    Negotiate
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-stone-200 mx-auto" />
                <p className="text-sm text-stone-500 mt-3">
                  Select a quote to view details
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
