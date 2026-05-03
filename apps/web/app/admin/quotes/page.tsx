"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Search, Plus, Clock, CheckCircle2, AlertCircle, XCircle,
  Send, ArrowRight, IndianRupee,
} from "lucide-react";
import type { Quote } from "@/lib/api";

const API = "http://localhost:3001/api";

const STATUS_TABS = ["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

const statusConfig: Record<string, { class: string; icon: any }> = {
  DRAFT: { class: "badge-gray", icon: Clock },
  SENT: { class: "badge-yellow", icon: Send },
  ACCEPTED: { class: "badge-green", icon: CheckCircle2 },
  REJECTED: { class: "badge-pink", icon: XCircle },
  EXPIRED: { class: "badge-gray", icon: AlertCircle },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/quotes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then((data: any) => setQuotes(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter(q => {
    const matchTab = activeTab === "ALL" || q.status === activeTab;
    const matchSearch = !search ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.companyName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /><div className="h-10 bg-gray-200 rounded w-32 animate-pulse" /></div>
        <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse" />)}</div>
        <div className="card divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-200 rounded w-48" /></div>
              <div className="h-6 bg-gray-200 rounded w-20" />
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
          <h2 className="text-2xl font-bold text-gray-900">Quotes</h2>
          <p className="text-gray-500 mt-1">{quotes.length} total quotes</p>
        </div>
        <Link href="/admin/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Quote
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-brand-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">({quotes.filter(q => q.status === tab).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by quote number or client..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Quote</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Date</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Items</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Total</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Valid Until</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p>No quotes found</p>
                </td></tr>
              ) : filtered.map(quote => {
                const cfg = (statusConfig[quote.status] ?? statusConfig.DRAFT)!;
                return (
                  <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{quote.quoteNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{quote.client?.companyName || "Direct"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500">{new Date(quote.createdAt).toLocaleDateString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm text-gray-600">{quote.items?.length || 0}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900">₹{quote.total.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cfg.class}>{quote.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500">
                        {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("en-IN") : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/quotes/${quote.id}`} className="text-brand-green-600 hover:text-brand-green-700 text-sm font-medium inline-flex items-center gap-1">
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {quotes.length} quotes</span>
          <div className="text-sm font-medium text-gray-900">
            Total: ₹{filtered.reduce((sum, q) => sum + q.total, 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
