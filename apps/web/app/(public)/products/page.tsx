"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Product, Category } from "@/lib/api";

const API = "http://localhost:3001/api";

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data) => setCategories(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeCategory) params.set("categorySlug", activeCategory);
    const qs = params.toString();

    fetch(`${API}/products${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : data.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const activeCategoryName =
    categories.find((c) => c.slug === activeCategory)?.name ?? "All Products";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-72 h-72 rounded-full bg-brand-pink-500 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Our <span className="text-brand-pink-300">Products</span>
          </h1>
          <p className="mt-4 text-brand-green-100 max-w-xl mx-auto">
            Browse our catalogue of 500+ promotional products — from pens to
            premium gift sets.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="card p-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
          <button
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="lg:hidden btn-ghost !px-3"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Main layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex gap-8">
          {/* Sidebar (desktop always visible, mobile togglable) */}
          <aside
            className={`${
              mobileFiltersOpen ? "block" : "hidden"
            } lg:block w-full lg:w-56 flex-shrink-0`}
          >
            <div className="card p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-brand-green-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Categories
                </h2>
              </div>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => {
                      setActiveCategory("");
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      activeCategory === ""
                        ? "bg-brand-green-50 text-brand-green-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(cat.slug);
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                        activeCategory === cat.slug
                          ? "bg-brand-green-50 text-brand-green-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat._count?.products != null && (
                        <span className="text-xs text-gray-400">
                          {cat._count.products}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeCategoryName}
              </h2>
              {!loading && (
                <span className="text-sm text-gray-400">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {error && (
              <div className="card p-8 text-center">
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button onClick={fetchProducts} className="btn-secondary text-sm">
                  Try Again
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : !error && products.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No products found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filter.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="card group hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center">
                      <Package className="w-12 h-12 text-brand-green-300 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-medium text-brand-pink-500 uppercase tracking-wide">
                        {product.category?.name}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 mt-1 group-hover:text-brand-green-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="mt-2 text-lg font-bold text-brand-green-600">
                        ₹{product.priceFrom}
                        {product.priceTo ? ` – ₹${product.priceTo}` : "+"}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Min. order: {product.minOrderQty} pcs
                        </span>
                        <span className="text-sm font-medium text-brand-green-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                          Get Quote
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
