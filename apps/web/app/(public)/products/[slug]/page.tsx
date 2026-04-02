"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Star,
  Check,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/lib/api";

const API = "http://localhost:3001/api";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    fetch(`${API}/products/slug/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        if (data.category?.slug) {
          return fetch(`${API}/products?categorySlug=${data.category.slug}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
              const items: Product[] = Array.isArray(list) ? list : list.data ?? [];
              setRelated(items.filter((p) => p.id !== data.id).slice(0, 4));
            });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-48 bg-gray-100 rounded" />
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="aspect-square bg-gray-100 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-6 w-3/4 bg-gray-100 rounded" />
                <div className="h-5 w-32 bg-gray-100 rounded" />
                <div className="h-20 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Product not found"}
          </h2>
          <Link href="/products" className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const customizationOptions: string[] = product.customizationOptions
    ? product.customizationOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-brand-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-brand-green-600 transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-brand-green-600 transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Image */}
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-green-50 via-white to-brand-pink-50 flex items-center justify-center border border-gray-100">
            <Package className="w-24 h-24 text-brand-green-200" />
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="badge-pink mb-3"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-bold text-brand-green-600">
                ₹{product.priceFrom}
                {product.priceTo ? ` – ₹${product.priceTo}` : "+"}
              </span>
              <span className="text-sm text-gray-400">per unit</span>
            </div>

            {product.description && (
              <p className="mt-6 text-gray-500 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-brand-green-500" />
                </div>
                <span>
                  <strong>Min. Order:</strong> {product.minOrderQty} pcs
                </span>
              </div>
              {product.isWholesale && product.wholesalePrice != null && (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-brand-pink-50 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-brand-pink-500" />
                  </div>
                  <span>
                    <strong>Wholesale:</strong> ₹{product.wholesalePrice}/unit
                    (min {product.wholesaleMinQty} pcs)
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href={`/request-quote?product=${product.slug}`}
                className="btn-primary text-base px-8 py-3"
              >
                Request Quote for this Product
                <ShoppingBag className="w-4 h-4" />
              </Link>
            </div>

            {/* Customization Options */}
            {customizationOptions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Customisation Options
                </h3>
                <ul className="space-y-2">
                  {customizationOptions.map((opt) => (
                    <li
                      key={opt}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <h2 className="text-xl font-bold text-gray-900 mb-8">
              Related Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/products/${rp.slug}`}
                  className="card group hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-green-50 to-brand-pink-50 flex items-center justify-center">
                    <Package className="w-10 h-10 text-brand-green-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-green-600 transition-colors line-clamp-1">
                      {rp.name}
                    </h3>
                    <div className="text-sm font-bold text-brand-green-600 mt-1">
                      ₹{rp.priceFrom}
                      {rp.priceTo ? ` – ₹${rp.priceTo}` : "+"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
