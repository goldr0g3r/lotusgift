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
  AlertCircle,
} from "lucide-react";
import type { Client, Product } from "@/lib/api";

const API = "http://localhost:3001/api";

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
  const [error, setError] = useState("");

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
      fetch(`${API}/clients`, { headers }).then((r) => r.json()),
      fetch(`${API}/products/admin`, { headers }).then((r) => r.json()),
    ])
      .then(([c, p]) => {
        setClients(Array.isArray(c) ? c : c.data || []);
        setProducts(Array.isArray(p) ? p : p.data || []);
      })
      .catch(() => setError("Failed to load clients or products"))
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
    setError("");
    if (!clientId) {
      setError("Please select a client");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productId)) {
      setError("Please add at least one product to the quote");
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
          body: JSON.stringify({ status: "SENT" }),
        });
      }

      router.push("/admin/quotes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/quotes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Quote</h2>
          <p className="text-gray-500 mt-1">
            Build a new quotation for a client
          </p>
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
          <div className="card p-6 space-y-5">
            <h3 className="text-base font-semibold text-gray-900">Client</h3>
            <div>
              <label className="label">Select Client</label>
              <select
                className="input-field"
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
              </select>
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input
                type="date"
                className="input-field"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Line Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-ghost text-sm text-brand-green-600 hover:text-brand-green-700"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <Calculator className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">
                  No items added yet
                </p>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 text-sm font-medium text-brand-green-600 hover:text-brand-green-700"
                >
                  + Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50/50 rounded-lg"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label className="label text-xs">Product</label>
                      <select
                        className="input-field text-sm"
                        value={item.productId}
                        onChange={(e) =>
                          handleProductSelect(index, e.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹
                            {p.priceFrom.toLocaleString("en-IN")})
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
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="label text-xs">Unit Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field text-sm"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, {
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className="label text-xs">Total</label>
                      <div className="text-sm font-semibold text-gray-900 py-2.5">
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
                        className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
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
            <h3 className="text-base font-semibold text-gray-900">Notes</h3>
            <textarea
              rows={3}
              placeholder="Additional notes, terms, or special instructions..."
              className="input-field resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4 sticky top-24">
            <h3 className="text-base font-semibold text-gray-900">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Items ({items.length})</span>
                <span className="font-medium">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field w-24 text-right text-sm py-1.5"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-brand-green-600">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="btn-primary w-full justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="btn-accent w-full justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Save &amp; Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
