"use client";

import { useState, useEffect, useCallback } from "react";
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
  Package,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  User,
  Calendar,
} from "lucide-react";
import type { Quote, Product } from "@/lib/api";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { productImage } from "@/lib/images";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const statusTone: Record<string, "gray" | "yellow" | "emerald" | "rose"> = {
  DRAFT: "gray",
  SENT: "yellow",
  ACCEPTED: "emerald",
  REJECTED: "rose",
  EXPIRED: "gray",
};

const statusIcon: Record<string, typeof Clock> = {
  DRAFT: Clock,
  SENT: Send,
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
  EXPIRED: AlertCircle,
};

const statusTransitions: Record<
  string,
  { label: string; next: string; icon: typeof Send; variant: "primary" | "danger" }[]
> = {
  DRAFT: [
    { label: "Send to client", next: "SENT", icon: Send, variant: "primary" },
  ],
  SENT: [
    {
      label: "Mark accepted",
      next: "ACCEPTED",
      icon: CheckCircle2,
      variant: "primary",
    },
    {
      label: "Mark rejected",
      next: "REJECTED",
      icon: XCircle,
      variant: "danger",
    },
  ],
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  const getHeaders = (): HeadersInit => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`${API}/quotes/${quoteId}`, {
        headers: getHeaders(),
        credentials: "include",
      });
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
      toast.error(err instanceof Error ? err.message : "Failed to load");
    }
  }, [quoteId]);

  useEffect(() => {
    Promise.all([
      fetchQuote(),
      fetch(`${API}/products/admin`, {
        headers: getHeaders(),
        credentials: "include",
      })
        .then((r) => r.json())
        .then((d) => setProducts(Array.isArray(d) ? d : d.data || [])),
    ]).finally(() => setLoading(false));
  }, [fetchQuote]);

  const updateQuote = async (data: Record<string, unknown>) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API}/quotes/${quoteId}`, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
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
      toast.success("Quote updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemProductId) return;
    setSavingItem(true);
    try {
      const res = await fetch(`${API}/quotes/${quoteId}/items`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
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
      toast.success("Item added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSavingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch(`${API}/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      await fetchQuote();
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const handleConvertToOrder = async () => {
    setConverting(true);
    try {
      const res = await fetch(`${API}/payments/convert-quote/${quoteId}`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to convert");
      }
      toast.success("Converted to order");
      router.push("/admin/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-lotus-rose-300 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold text-stone-900">
          Quote not found
        </h3>
        <Link href="/admin/quotes" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to quotes
        </Link>
      </div>
    );
  }

  const StatusIcon = statusIcon[quote.status] ?? Clock;
  const transitions = statusTransitions[quote.status] || [];
  const isEditable = quote.status === "DRAFT" || quote.status === "SENT";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/quotes"
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-stone-900">
              {quote.quoteNumber}
            </h2>
            <Badge tone={statusTone[quote.status] ?? "gray"}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {quote.status}
            </Badge>
          </div>
          <p className="text-stone-500 mt-0.5 text-sm">
            Created{" "}
            {new Date(quote.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transitions.map((t) => (
            <button
              key={t.next}
              disabled={updating}
              onClick={() => updateQuote({ status: t.next })}
              className={
                t.variant === "danger"
                  ? "inline-flex items-center gap-2 rounded-xl bg-lotus-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lotus-rose-700 disabled:opacity-50"
                  : "btn-primary"
              }
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
              className="btn-secondary"
            >
              {converting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Convert to order
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                Line items ({quote.items?.length || 0})
              </h3>
              {isEditable && (
                <button
                  onClick={() => setAddingItem(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
                >
                  <Plus className="w-4 h-4" /> Add item
                </button>
              )}
            </div>
            <div className="divide-y divide-stone-100">
              {quote.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200 bg-stone-100">
                    {item.product ? (
                      <ImageWithFallback
                        src={productImage(item.product).src}
                        alt={item.product.name}
                        sizes="48px"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-stone-400 m-auto absolute inset-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.customization && `Custom: ${item.customization} · `}
                      {item.quantity} × ₹
                      {item.unitPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-stone-900 tabular-nums">
                      ₹{item.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-md text-stone-400 hover:bg-lotus-rose-50 hover:text-lotus-rose-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {addingItem && (
              <div className="p-5 border-t border-stone-100 bg-lotus-emerald-50/30 space-y-3">
                <h4 className="text-sm font-semibold text-stone-900">
                  Add new item
                </h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <Label className="!text-xs">Product</Label>
                    <Select
                      className="!text-sm"
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
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="!text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      className="!text-sm"
                      value={newItemQty}
                      onChange={(e) =>
                        setNewItemQty(Math.max(1, Number(e.target.value)))
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="!text-xs">Unit price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="!text-sm"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
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

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                Notes
              </h3>
              {isEditable && !editNotes && (
                <button
                  onClick={() => setEditNotes(true)}
                  className="text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
                >
                  Edit
                </button>
              )}
            </div>
            {editNotes ? (
              <div className="space-y-3">
                <Textarea
                  rows={3}
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
              <p className="text-sm text-stone-600">
                {quote.notes || "No notes added"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium tabular-nums">
                  ₹{quote.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Discount</span>
                {editDiscount ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="!w-24 !text-right !text-sm !py-1"
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(Number(e.target.value))
                      }
                    />
                    <button
                      disabled={updating}
                      onClick={() => updateQuote({ discount: discountValue })}
                      className="text-lotus-emerald-700"
                      aria-label="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditDiscount(false)}
                      className="text-stone-400"
                      aria-label="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      isEditable &&
                        "cursor-pointer text-lotus-emerald-700 hover:underline",
                    )}
                    onClick={() => isEditable && setEditDiscount(true)}
                  >
                    -₹{quote.discount.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {quote.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Tax</span>
                  <span className="font-medium tabular-nums">
                    ₹{quote.tax.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="border-t border-stone-100 pt-3 flex justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="font-display text-2xl font-bold text-lotus-emerald-700 tabular-nums">
                  ₹{quote.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Client
            </h3>
            {quote.client ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <User className="w-4 h-4 text-stone-400" />
                  <span className="font-semibold">
                    {quote.client.companyName}
                  </span>
                </div>
                <p className="text-stone-500 pl-6">
                  {quote.client.contactName}
                </p>
                {quote.client.email && (
                  <p className="text-stone-500 pl-6">{quote.client.email}</p>
                )}
                {quote.client.phone && (
                  <p className="text-stone-500 pl-6">{quote.client.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No client assigned</p>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-stone-600">
                <Calendar className="w-4 h-4 text-stone-400" />
                Created:{" "}
                {new Date(quote.createdAt).toLocaleDateString("en-IN")}
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Calendar className="w-4 h-4 text-stone-400" />
                Valid until:{" "}
                {editValidUntil ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="!text-sm !py-1"
                      value={validUntilValue}
                      onChange={(e) => setValidUntilValue(e.target.value)}
                    />
                    <button
                      disabled={updating}
                      onClick={() =>
                        updateQuote({ validUntil: validUntilValue })
                      }
                      className="text-lotus-emerald-700"
                      aria-label="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditValidUntil(false)}
                      className="text-stone-400"
                      aria-label="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      isEditable &&
                        "cursor-pointer text-lotus-emerald-700 hover:underline",
                    )}
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
