"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { Quote } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const STATUS_TABS = ["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

const statusTone: Record<string, "gray" | "yellow" | "emerald" | "rose"> = {
  DRAFT: "gray",
  SENT: "yellow",
  ACCEPTED: "emerald",
  REJECTED: "rose",
  EXPIRED: "gray",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/quotes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setQuotes(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) => {
    const matchTab = activeTab === "ALL" || q.status === activeTab;
    const matchSearch =
      !search ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.companyName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Quotes
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            {quotes.length} total quote{quotes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New quote
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === "ALL" ? quotes.length : quotes.filter((q) => q.status === tab).length;
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
            placeholder="Search by quote number or client..."
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
                  Quote
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Client
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Date
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Items
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Total
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Status
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Valid until
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-3.5">
                      <Skeleton className="h-9" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-stone-200" />
                    <p className="text-stone-500">No quotes found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-stone-900">
                        {quote.quoteNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">
                      {quote.client?.companyName || "Direct"}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {new Date(quote.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center text-stone-600">
                      {quote.items?.length || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-stone-900">
                      ₹{quote.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge tone={statusTone[quote.status] ?? "gray"}>
                        {quote.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {quote.validUntil
                        ? new Date(quote.validUntil).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/quotes/${quote.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
                      >
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between text-sm">
          <span className="text-stone-500">
            Showing {filtered.length} of {quotes.length} quotes
          </span>
          <div className="font-semibold text-stone-900 tabular-nums">
            Total: ₹{filtered.reduce((sum, q) => sum + q.total, 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
