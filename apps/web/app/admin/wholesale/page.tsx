"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";

type Tier = { id: string; minQty: number; discountPct: number };

const initial: Tier[] = [
  { id: "t1", minQty: 50, discountPct: 5 },
  { id: "t2", minQty: 100, discountPct: 10 },
  { id: "t3", minQty: 500, discountPct: 18 },
  { id: "t4", minQty: 1000, discountPct: 25 },
];

export default function AdminWholesalePage() {
  const [tiers, setTiers] = useState<Tier[]>(initial);

  const update = (id: string, patch: Partial<Tier>) =>
    setTiers((arr) => arr.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) =>
    setTiers((arr) => arr.filter((t) => t.id !== id));

  const add = () =>
    setTiers((arr) => [
      ...arr,
      { id: `t${Date.now()}`, minQty: 0, discountPct: 0 },
    ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Marketing</span>
        <h2 className="mt-3 h2-display">Wholesale rules</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Configure volume tiers that apply across products. Individual products
          can override.
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-brand-ink-900">
            Default volume tiers
          </h3>
          <button type="button" onClick={add} className="btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Add tier
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {tiers.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end rounded-2xl bg-stone-50 p-4"
            >
              <div className="sm:col-span-5">
                <Label>Min quantity</Label>
                <Input
                  type="number"
                  min={0}
                  value={t.minQty}
                  onChange={(e) =>
                    update(t.id, { minQty: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="sm:col-span-5">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={t.discountPct}
                  onChange={(e) =>
                    update(t.id, { discountPct: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="sm:col-span-2 flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={() => toast.success("Tiers saved")}
            className="btn-primary btn-lg"
          >
            <span className="btn-disc">
              <Save className="h-4 w-4" />
            </span>
            Save changes
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 p-6">
        <h3 className="font-display text-lg font-bold text-brand-ink-900">
          Wholesale program overview
        </h3>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { label: "Active wholesale SKUs", value: "126" },
            { label: "Avg. order size", value: "₹1,82,500" },
            { label: "Repeat client rate", value: "62%" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-stone-50 p-5">
              <p className="text-3xl font-extrabold text-brand-ink-900 tabular-nums">
                {s.value}
              </p>
              <p className="mt-2 text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
