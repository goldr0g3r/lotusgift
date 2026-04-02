"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Package,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  User,
  Calendar,
  IndianRupee,
} from "lucide-react";
import type { Quote, Product } from "@/lib/api";

const API = "http://localhost:3001/api";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock; color: string }
> = {
  DRAFT: { label: "Draft", className: "badge-gray", icon: Clock, color: "gray" },
  SENT: { label: "Sent", className: "badge-yellow", icon: Send, color: "amber" },
  ACCEPTED: { label: "Accepted", className: "badge-green", icon: CheckCircle2, color: "green" },
  REJECTED: {
    label: "Rejected",
    className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600",
    icon: XCircle,
    color: "red",
  },
  EXPIRED: { label: "Expired", className: "badge-gray", icon: AlertCircle, color: "gray" },
};

const statusTransitions: Record<string, { label: string; next: string; icon: typeof Send; className: string }[]> = {
  DRAFT: [
    { label: "Send to Client", next: "SENT", icon: Send, className: "btn-primary" },
  ],
  SENT: [
    { label: "Mark Accepted", next: "ACCEPTED", icon: CheckCircle2, className: "btn-primary" },
    { label: "Mark Rejected", next: "REJECTED", icon: XCircle, className: "px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 inline-flex items-center gap-2" },
  ],
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);

  const [editDiscount, setEditDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [editValidUntil, setEditValidUntil] = useState(false);
  const [validUntilValue, setValidUntilValue] = useState("");

  const [addingItem, setAddingItem] = useState(false);
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [savingItem, setSavingItem] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchQuote = async () => {
    try {
      const res = await fetch(`${API}/quotes/${quoteId}`, { headers });
      if (!res.ok) throw new Error("Quote not found");
      const data = await res.json();
      setQuote(data);
      setDiscountValue(data.discount || 0);
      setNotesValue(data.adminNotes || data.notes || "");
      setValidUntilValue(
        data.validUntil
          ? new Date(data.validUntil).toISOString().split("T")[0] ?? ""
          : "",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote");
    }
  };

  useEffect(() => {
    Promise.all([
      fetchQuote(),
      fetch(`${API}/products/admin`, { headers })
        .then((r) => r.json())
        .then((d) => setProducts(Array.isArray(d) ? d : d.data || [])),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const updateQuote = async (data: Record<string, unknown>) => {
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`${API}/quotes/${quoteId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Update failed");
      }
      const updated = await res.json();
      setQuote(updated);
      setDiscountValue(updated.discount || 0);
      setNotesValue(updated.adminNotes || updated.notes || "");
      setEditDiscount(false);
      setEditNotes(false);
      setEditValidUntil(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemProductId) return;
    setSavingItem(true);
    setError("");
    try {
      const res = await fetch(`${API}/quotes/${quoteId}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: newItemProductId,
          quantity: newItemQty,
          unitPrice: newItemPrice,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      await fetchQuote();
      setAddingItem(false);
      setNewItemProductId("");
      setNewItemQty(1);
      setNewItemPrice(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setError("");
    try {
      const res = await fetch(`${API}/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to remove item");
      await fetchQuote();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleConvertToOrder = async () => {
    setConverting(true);
    setError("");
    try {
      const res = await fetch(`${API}/payments/convert-quote/${quoteId}`, {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to convert to order");
      }
      router.push("/admin/orders");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to convert to order",
      );
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Quote not found
        </h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <Link href="/admin/quotes" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
      </div>
    );
  }

  const cfg = (statusConfig[quote.status] ?? statusConfig.DRAFT)!;
  const StatusIcon = cfg.icon;
  const transitions = statusTransitions[quote.status] || [];
  const isEditable = quote.status === "DRAFT" || quote.status === "SENT";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/quotes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {quote.quoteNumber}
            </h2>
            <span className={cfg.className}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {cfg.label}
            </span>
          </div>
          <p className="text-gray-500 mt-0.5 text-sm">
            Created {new Date(quote.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transitions.map((t) => (
            <button
              key={t.next}
              disabled={updating}
              onClick={() => updateQuote({ status: t.next })}
              className={t.className}
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <t.icon className="w-4 h-4" />
              )}
              {t.label}
            </button>
          ))}
          {quote.status === "ACCEPTED" && (
            <button
              disabled={converting}
              onClick={handleConvertToOrder}
              className="btn-accent"
            >
              {converting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Convert to Order
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Line Items ({quote.items?.length || 0})
              </h3>
              {isEditable && (
                <button
                  onClick={() => setAddingItem(true)}
                  className="btn-ghost text-sm text-brand-green-600"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {quote.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-brand-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.customization && `Custom: ${item.customization} · `}
                      {item.quantity} x ₹
                      {item.unitPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{item.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {addingItem && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Add New Item
                </h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="label text-xs">Product</label>
                    <select
                      className="input-field text-sm"
                      value={newItemProductId}
                      onChange={(e) => {
                        setNewItemProductId(e.target.value);
                        const p = products.find(
                          (pr) => pr.id === e.target.value,
                        );
                        if (p) setNewItemPrice(p.priceFrom);
                      }}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.priceFrom.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field text-sm"
                      value={newItemQty}
                      onChange={(e) =>
                        setNewItemQty(Math.max(1, Number(e.target.value)))
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-sm"
                      value={newItemPrice}
                      onChange={(e) =>
                        setNewItemPrice(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3 flex gap-2">
                    <button
                      disabled={savingItem || !newItemProductId}
                      onClick={handleAddItem}
                      className="btn-primary text-sm py-2"
                    >
                      {savingItem ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add
                    </button>
                    <button
                      onClick={() => setAddingItem(false)}
                      className="btn-ghost text-sm py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notes</h3>
              {isEditable && !editNotes && (
                <button
                  onClick={() => setEditNotes(true)}
                  className="text-sm text-brand-green-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            {editNotes ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    disabled={updating}
                    onClick={() => updateQuote({ notes: notesValue })}
                    className="btn-primary text-sm"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditNotes(false)}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {quote.notes || "No notes added"}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  ₹{quote.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                {editDiscount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field w-24 text-right text-sm py-1"
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(Number(e.target.value))
                      }
                    />
                    <button
                      disabled={updating}
                      onClick={() => updateQuote({ discount: discountValue })}
                      className="text-brand-green-600 hover:text-brand-green-700"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditDiscount(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-medium ${isEditable ? "cursor-pointer text-brand-green-600 hover:underline" : ""}`}
                    onClick={() => isEditable && setEditDiscount(true)}
                  >
                    -₹{quote.discount.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {quote.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">
                    ₹{quote.tax.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-brand-green-600">
                  ₹{quote.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Client</h3>
            {quote.client ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  {quote.client.companyName}
                </div>
                <p className="text-gray-500 pl-6">
                  {quote.client.contactName}
                </p>
                {quote.client.email && (
                  <p className="text-gray-500 pl-6">{quote.client.email}</p>
                )}
                {quote.client.phone && (
                  <p className="text-gray-500 pl-6">{quote.client.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No client assigned</p>
            )}
          </div>

          {/* Dates */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Created:{" "}
                {new Date(quote.createdAt).toLocaleDateString("en-IN")}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Valid Until:{" "}
                {editValidUntil ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="input-field text-sm py-1"
                      value={validUntilValue}
                      onChange={(e) => setValidUntilValue(e.target.value)}
                    />
                    <button
                      disabled={updating}
                      onClick={() =>
                        updateQuote({ validUntil: validUntilValue })
                      }
                      className="text-brand-green-600"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditValidUntil(false)}
                      className="text-gray-400"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={
                      isEditable
                        ? "cursor-pointer text-brand-green-600 hover:underline"
                        : ""
                    }
                    onClick={() => isEditable && setEditValidUntil(true)}
                  >
                    {quote.validUntil
                      ? new Date(quote.validUntil).toLocaleDateString("en-IN")
                      : "Not set"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
