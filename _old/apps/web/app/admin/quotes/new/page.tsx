"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, Send, Trash2 } from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatInr } from "@/components/ui/PriceTag";
import { mockClients, mockProducts } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";

type Line = {
  productId: string;
  qty: number;
  unitPrice: number;
};

export default function NewQuoteAdminPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState(mockClients[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [addProductId, setAddProductId] = useState(mockProducts[0]?.id ?? "");

  const addLine = () => {
    const p = mockProducts.find((x) => x.id === addProductId);
    if (!p) return;
    if (lines.find((l) => l.productId === p.id)) return;
    setLines([
      ...lines,
      { productId: p.id, qty: p.minOrderQty, unitPrice: p.wholesalePrice ?? p.priceFrom },
    ]);
  };

  const removeLine = (id: string) =>
    setLines((arr) => arr.filter((l) => l.productId !== id));

  const updateLine = (id: string, patch: Partial<Line>) =>
    setLines((arr) =>
      arr.map((l) => (l.productId === id ? { ...l, ...patch } : l)),
    );

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const discount = Math.round(subtotal * 0.05);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/quotes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotes
      </Link>
      <div>
        <span className="eyebrow">New quote</span>
        <h2 className="mt-3 h2-display">Build a quote</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Client
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Select client</Label>
                <Select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  {mockClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Valid for</Label>
                <Select defaultValue="21">
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-brand-ink-900">
                Line items
              </h3>
              <div className="flex items-center gap-2">
                <Select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="!py-2"
                >
                  {mockProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <button type="button" onClick={addLine} className="btn-primary btn-sm">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
            <div className="mt-4 divide-y divide-stone-100">
              {lines.length === 0 && (
                <p className="text-sm text-stone-500 py-6 text-center">
                  No line items yet — pick a product above and click Add.
                </p>
              )}
              {lines.map((l) => {
                const p = mockProducts.find((x) => x.id === l.productId)!;
                return (
                  <div
                    key={l.productId}
                    className="py-3 flex flex-col sm:flex-row gap-3 sm:items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-ink-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        MOQ {p.minOrderQty}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <QuantityStepper
                        value={l.qty}
                        onChange={(q) => updateLine(l.productId, { qty: q })}
                        min={p.minOrderQty}
                      />
                      <Input
                        type="number"
                        min={0}
                        value={l.unitPrice}
                        onChange={(e) =>
                          updateLine(l.productId, {
                            unitPrice: Number(e.target.value) || 0,
                          })
                        }
                        className="w-28 !rounded-full"
                      />
                      <p className="text-sm font-semibold tabular-nums w-24 text-right">
                        {formatInr(l.qty * l.unitPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeLine(l.productId)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Notes
            </h3>
            <Textarea
              rows={4}
              className="mt-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lead time, customisation notes, payment terms…"
            />
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-6 rounded-3xl bg-white border border-stone-100 p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Summary
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-semibold tabular-nums">
                  {formatInr(subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Discount (5%)</dt>
                <dd className="font-semibold tabular-nums text-brand-green-700">
                  − {formatInr(discount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">GST (18%)</dt>
                <dd className="font-semibold tabular-nums">{formatInr(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-3">
                <dt className="text-sm font-bold text-brand-ink-900">Total</dt>
                <dd className="text-xl font-extrabold tabular-nums">
                  {formatInr(total)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                toast.success("Quote saved (stub)");
                router.push("/admin/quotes");
              }}
              className="btn-primary btn-lg w-full mt-6"
            >
              <span className="btn-disc">
                <Send className="h-4 w-4" />
              </span>
              Save & send
            </button>
            <button
              type="button"
              onClick={() => toast.success("Saved as draft")}
              className="btn-outline rounded-full w-full mt-3"
            >
              Save as draft
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
