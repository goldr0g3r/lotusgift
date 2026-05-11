"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Edit,
  Filter,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatInr } from "@/components/ui/PriceTag";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "price" | "stock">("name");

  const list = mockProducts
    .filter((p) => {
      if (cat !== "all" && p.category.slug !== cat) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price") return a.priceFrom - b.priceFrom;
      if (sort === "stock") return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2 className="mt-3 h2-display">Products</h2>
          <p className="text-stone-500 mt-1 text-sm">
            {list.length} of {mockProducts.length} products
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary btn-lg">
          <span className="btn-disc">
            <PlusCircle className="h-4 w-4" />
          </span>
          Add product
        </Link>
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-stone-50 px-4 py-2.5">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-full bg-stone-50 border border-stone-200 px-4 py-2 text-sm font-semibold text-brand-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-green-500/30"
          >
            <option value="all">All categories</option>
            {mockCategories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              setSort((s) =>
                s === "name" ? "price" : s === "price" ? "stock" : "name",
              )
            }
            className="rounded-full bg-stone-50 border border-stone-200 px-4 py-2 text-sm font-semibold text-brand-ink-800 inline-flex items-center gap-1.5"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sort === "name" ? "Name" : sort === "price" ? "Price" : "Stock"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50/60 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-right px-5 py-3">Stock</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-stone-50">
                        <ImageWithFallback
                          src={p.imageUrl}
                          alt={p.name}
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-ink-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-stone-500">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {p.category.name}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatInr(p.priceFrom)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        p.stock > 100
                          ? "bg-brand-green-50 text-brand-green-700"
                          : p.stock > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700",
                      )}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {p.isFeatured ? (
                      <Badge tone="pink">Featured</Badge>
                    ) : p.isWholesale ? (
                      <Badge tone="green">Wholesale</Badge>
                    ) : (
                      <Badge tone="neutral">Active</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-brand-ink-900"
                        aria-label="Edit"
                        onClick={() => toast.success(`Edit ${p.name}`)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                        aria-label="Delete"
                        onClick={() => toast.error(`${p.name} archived`)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
