"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Search, Edit2, Trash2, Package, MoreHorizontal, Eye, X,
} from "lucide-react";
import type { Product, Category } from "@/lib/api";

const API = "http://localhost:3001/api";

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
      fetch(`${API}/products/admin`).then(r => r.json()),
      fetch(`${API}/categories`).then(r => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : prods.data || []);
        setCategories(Array.isArray(cats) ? cats : cats.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/products/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="card overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
              <div className="w-9 h-9 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
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
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or SKU..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto min-w-[160px]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Product</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Category</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Price Range</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No products found</td></tr>
              ) : filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-brand-green-500" />
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                        {product.isFeatured && <span className="ml-2 badge-pink">Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-sm text-gray-500 font-mono">{product.sku}</span></td>
                  <td className="px-5 py-3.5"><span className="badge-gray">{product.category?.name}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-gray-900">₹{product.priceFrom.toLocaleString("en-IN")}</span>
                    {product.priceTo && <span className="text-xs text-gray-400"> - ₹{product.priceTo.toLocaleString("en-IN")}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-medium ${product.stock < 10 ? "text-red-500" : "text-gray-700"}`}>
                      {product.stock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {product.isActive ? <span className="badge-green">Active</span> : <span className="badge-gray">Inactive</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === product.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-36 z-10">
                          <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Link>
                          <button onClick={() => { setDeleteId(product.id); setOpenMenu(null); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {products.length} products</span>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
