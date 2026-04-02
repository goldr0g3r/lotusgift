"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import type { Product, Category } from "@/lib/api";

const API = "http://localhost:3001/api";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`${API}/categories/slug/${slug}`).then((res) => {
        if (!res.ok) throw new Error("Category not found");
        return res.json();
      }),
      fetch(`${API}/products?categorySlug=${slug}`).then((res) => {
        if (!res.ok) return [];
        return res.json();
      }),
    ])
      .then(([catData, prodData]) => {
        setCategory(catData);
        setProducts(Array.isArray(prodData) ? prodData : prodData.data ?? []);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load category"),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-br from-brand-green-500 to-brand-green-700 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
            <div className="h-8 w-48 bg-white/20 rounded mb-3" />
            <div className="h-4 w-72 bg-white/10 rounded" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Category not found"}
          </h2>
          <Link href="/products" className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" />
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-500 via-brand-green-600 to-brand-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-pink-500 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-brand-green-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Products
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-brand-green-100 max-w-2xl text-lg">
              {category.description}
            </p>
          )}
          <p className="mt-3 text-sm text-brand-green-200">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No products in this category yet.
            </p>
            <Link href="/products" className="btn-secondary mt-6">
              <ArrowLeft className="w-4 h-4" />
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-green-600 transition-colors line-clamp-1">
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
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
