"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  ArrowRight,
  Filter,
  Warehouse,
  Tag,
  Loader2,
} from "lucide-react";
import type { Product } from "@/lib/api";

const API = "http://localhost:3001/api";

export default function WholesalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch(`${API}/products?isWholesale=true`)
      .then((r) => r.json())
      .then((data: any) => setProducts(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categoryNames = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "All" || p.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const maxSavings = products.reduce((max, p) => {
    if (!p.wholesalePrice || p.priceFrom <= 0) return max;
    const pct = Math.round(
      ((p.priceFrom - p.wholesalePrice) / p.priceFrom) * 100,
    );
    return pct > max ? pct : max;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Wholesale Products
            </h2>
            <span className="badge-pink">
              <Tag className="w-3 h-3 mr-1" />
              Bulk Pricing
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Products available at wholesale pricing for bulk orders
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-brand-green-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {products.length}
            </div>
            <div className="text-xs text-gray-500">Wholesale Products</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-pink-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-brand-pink-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {maxSavings > 0 ? `Up to ${maxSavings}%` : "N/A"}
            </div>
            <div className="text-xs text-gray-500">Max Savings</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {totalStock.toLocaleString()}+
            </div>
            <div className="text-xs text-gray-500">Items in Stock</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search wholesale products..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat!)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-brand-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            No wholesale products found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {products.length === 0
              ? "No products have wholesale pricing enabled yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const savings =
              product.wholesalePrice && product.priceFrom > 0
                ? Math.round(
                    ((product.priceFrom - product.wholesalePrice) /
                      product.priceFrom) *
                      100,
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="card overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center relative">
                  <Package className="w-10 h-10 text-brand-green-300" />
                  {savings > 0 && (
                    <span className="absolute top-3 right-3 bg-brand-pink-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      Save {savings}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {product.category?.name}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 mt-1 group-hover:text-brand-green-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {product.sku}
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-lg font-bold text-brand-green-600">
                      ₹
                      {(product.wholesalePrice ?? product.priceFrom).toLocaleString("en-IN")}
                    </span>
                    {product.wholesalePrice &&
                      product.wholesalePrice < product.priceFrom && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.priceFrom.toLocaleString("en-IN")}
                        </span>
                      )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Min: {product.wholesaleMinQty} pcs</span>
                    <span>{product.stock.toLocaleString()} in stock</span>
                  </div>
                  <button className="mt-3 w-full text-sm font-medium text-brand-green-600 hover:text-brand-green-700 py-2 border border-brand-green-200 rounded-lg hover:bg-brand-green-50 transition-colors inline-flex items-center justify-center gap-1">
                    Add to Quote
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
