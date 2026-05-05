"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Package, ArrowLeft, ChevronRight } from "lucide-react";
import type { Product, Category } from "@/lib/api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Skeleton } from "@/components/ui/Skeleton";
import { categoryHero } from "@/lib/images";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
      fetch(`${API}/products?categorySlug=${slug}`).then((res) =>
        res.ok ? res.json() : [],
      ),
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

  const heroImg = slug ? categoryHero(slug) : null;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[260px] w-full rounded-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <Skeleton className="aspect-[4/5] rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
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
        <div className="text-center px-6">
          <Package className="w-14 h-14 text-stone-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            {error || "Category not found"}
          </h2>
          <Link href="/products" className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" />
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative h-[300px] md:h-[360px] overflow-hidden">
        {heroImg && (
          <ImageWithFallback
            src={heroImg.src}
            alt={category.name}
            sizes="100vw"
            priority
            className="animate-ken-burns"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-stone-950/15" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-stone-200">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-white">Products</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">{category.name}</span>
          </nav>
          <span className="eyebrow !bg-white/10 !text-lotus-gold-200 !ring-white/15 self-start">
            Collection
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-white leading-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-stone-200/85">
              {category.description}
            </p>
          )}
          <p className="mt-3 text-xs text-stone-300">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="font-medium text-stone-700">No products in this category yet.</p>
            <Link href="/products" className="btn-secondary mt-6">
              <ArrowLeft className="w-4 h-4" />
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
