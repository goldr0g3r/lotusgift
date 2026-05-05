"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import type { Product, Category } from "@/lib/api";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { productImage } from "@/lib/images";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/products/admin`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API}/categories`).then((r) => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : prods.data || []);
        setCategories(Array.isArray(cats) ? cats : cats.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/products/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Products
          </h2>
          <p className="text-stone-500 mt-1 text-sm">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add product
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name or SKU..."
              className="!pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-56"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Product
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  SKU
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Category
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Price
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Stock
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Status
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3.5">
                      <Skeleton className="h-10" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package className="mx-auto mb-2 w-10 h-10 text-stone-200" />
                    <p className="text-stone-500">No products found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                          <ImageWithFallback
                            src={productImage(product).src}
                            alt={product.name}
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-stone-900">
                            {product.name}
                          </span>
                          {product.isFeatured && (
                            <Badge tone="gold" className="ml-2 !text-[10px]">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-stone-500 font-mono">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone="gray">{product.category?.name}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span className="text-sm font-semibold text-stone-900">
                        ₹{product.priceFrom.toLocaleString("en-IN")}
                      </span>
                      {product.priceTo && (
                        <span className="text-xs text-stone-400">
                          {" "}
                          – ₹{product.priceTo.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span
                        className={
                          product.stock < 10
                            ? "text-sm font-medium text-lotus-rose-600"
                            : "text-sm font-medium text-stone-700"
                        }
                      >
                        {product.stock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {product.isActive ? (
                        <Badge tone="emerald">Active</Badge>
                      ) : (
                        <Badge tone="gray">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === product.id ? null : product.id)
                          }
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          aria-label="Open actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenu === product.id && (
                          <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border border-stone-200 bg-white shadow-elevated py-1 animate-slide-down">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Link>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <button
                              onClick={() => {
                                setDeleteId(product.id);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-lotus-rose-600 hover:bg-lotus-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between text-sm text-stone-500">
          <span>
            Showing {filtered.length} of {products.length} products
          </span>
        </div>
      </div>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete product"
        description="This action cannot be undone."
        size="sm"
      >
        <p className="text-sm text-stone-600">
          Are you sure you want to delete this product?
        </p>
        <DialogFooter>
          <button onClick={() => setDeleteId(null)} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-lotus-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lotus-rose-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
