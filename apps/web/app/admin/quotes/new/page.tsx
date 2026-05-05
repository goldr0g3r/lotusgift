"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  Loader2,
} from "lucide-react";
import type { Client, Product } from "@/lib/api";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface QuoteItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    Promise.all([
      fetch(`${API}/clients`, { headers, credentials: "include" }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/products/admin`, { headers, credentials: "include" }).then(
        (r) => r.json(),
      ),
    ])
      .then(([c, p]) => {
        setClients(Array.isArray(c) ? c : c.data || []);
        setProducts(Array.isArray(p) ? p : p.data || []);
      })
      .catch(() => toast.error("Failed to load clients or products"))
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    const next = [...items];
    next[index] = { ...next[index]!, ...updates } as QuoteItem;
    setItems(next);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(index, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.priceFrom,
      });
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = Math.max(0, subtotal - discount);

  const handleSave = async (sendAfterSave: boolean) => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productId)) {
      toast.error("Please add at least one product to the quote");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          clientId,
          discount,
          notes: notes || undefined,
          validUntil: validUntil || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create quote");
      }

      const quote = await res.json();

      if (sendAfterSave) {
        await fetch(`${API}/quotes/${quote.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ status: "SENT" }),
        });
      }

      toast.success(sendAfterSave ? "Quote sent" : "Quote saved");
      router.push("/admin/quotes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/quotes"
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="eyebrow">Sales</span>
          <h2 className="mt-1 font-display text-2xl font-bold text-stone-900">
            Create quote
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            Build a new quotation for a client
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Client
            </h3>
            <div>
              <Label>Select client</Label>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="" disabled>
                  Choose a client
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName} ({client.contactName})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Valid until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                Line items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
              >
                <Plus className="w-4 h-4" /> Add item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-stone-200 rounded-2xl">
                <Calculator className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-sm text-stone-500 mt-2">No items added yet</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
                >
                  + Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end p-4 bg-stone-50/60 rounded-2xl ring-1 ring-stone-200"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <Label className="!text-xs">Product</Label>
                      <Select
                        className="!text-sm"
                        value={item.productId}
                        onChange={(e) =>
                          handleProductSelect(index, e.target.value)
                        }
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
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="!text-xs">Unit (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="!text-sm"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, {
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="!text-xs">Total</Label>
                      <div className="text-sm font-semibold text-stone-900 py-2.5 tabular-nums">
                        ₹
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "en-IN",
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-md hover:bg-lotus-rose-50 text-stone-400 hover:text-lotus-rose-600"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Notes
            </h3>
            <Textarea
              rows={3}
              placeholder="Additional notes, terms, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4 sticky top-24">
            <h3 className="font-display text-lg font-semibold text-stone-900">
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Items ({items.length})</span>
                <span className="font-medium tabular-nums">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Discount</span>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="!w-24 !text-right !text-sm !py-1.5"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
              </div>
              <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="font-display text-2xl font-bold text-lotus-emerald-700 tabular-nums">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="btn-secondary w-full justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="btn-primary w-full justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Save &amp; send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
