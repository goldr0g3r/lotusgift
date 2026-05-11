"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { mockQuotes } from "@/lib/mock-data";
import type { QuoteStatus } from "@/lib/api-types";
import { toast } from "@/components/ui/Toaster";

const tone: Record<QuoteStatus, "neutral" | "warning" | "green" | "danger"> = {
  DRAFT: "neutral",
  SENT: "warning",
  ACCEPTED: "green",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

export default function AdminQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const quote = useMemo(() => mockQuotes.find((q) => q.id === id), [id]);

  if (!quote) {
    return (
      <div className="text-center py-16">
        <h1 className="h2-display">Quote not found</h1>
        <Link href="/admin/quotes" className="btn-primary btn-sm mt-4 mx-auto">
          Back to quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/quotes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotes
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Quote</span>
          <h2 className="mt-3 h2-display">{quote.quoteNumber}</h2>
          <p className="text-stone-500 mt-1 text-sm">
            Created {new Date(quote.createdAt).toLocaleString()} · Valid until{" "}
            {quote.validUntil
              ? new Date(quote.validUntil).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success("PDF downloaded (stub)")}
            className="btn-outline rounded-full"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => toast.success("Quote re-sent")}
            className="btn-primary btn-lg"
          >
            <span className="btn-disc">
              <Send className="h-4 w-4" />
            </span>
            Re-send
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <Badge tone={tone[quote.status]} size="lg">
                {quote.status}
              </Badge>
              <p className="text-sm text-stone-500">
                Client: {quote.client?.companyName ?? "Direct"}
              </p>
            </div>
            <div className="mt-5 divide-y divide-stone-100">
              {quote.items.map((it) => (
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

          {quote.notes && (
            <div className="rounded-3xl bg-white border border-stone-100 p-6">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Notes
              </h3>
              <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">
                {quote.notes}
              </p>
            </div>
          )}

          {quote.adminNotes && (
            <div className="rounded-3xl bg-brand-pink-50 border border-brand-pink-100 p-6">
              <h3 className="font-display text-lg font-bold text-brand-pink-900">
                Internal notes
              </h3>
              <p className="mt-2 text-sm text-brand-pink-800 whitespace-pre-wrap">
                {quote.adminNotes}
              </p>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-3xl bg-white border border-stone-100 p-6">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Summary
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-semibold tabular-nums">
                  {formatInr(quote.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Discount</dt>
                <dd className="font-semibold text-brand-green-700 tabular-nums">
                  − {formatInr(quote.discount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">GST</dt>
                <dd className="font-semibold tabular-nums">
                  {formatInr(quote.tax)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2">
                <dt className="text-sm font-bold text-brand-ink-900">Total</dt>
                <dd className="text-xl font-extrabold tabular-nums">
                  {formatInr(quote.total)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
