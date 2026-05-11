"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { mockCategories, mockProducts } from "@/lib/mock-data";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const category = useMemo(
    () => mockCategories.find((c) => c.slug === slug),
    [slug],
  );
  const products = useMemo(
    () => mockProducts.filter((p) => p.category.slug === slug),
    [slug],
  );
  const other = mockCategories.filter((c) => c.slug !== slug).slice(0, 4);

  if (!category) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-16 text-center">
        <h1 className="h2-display">Category not found</h1>
        <Link href="/products" className="btn-primary btn-sm mt-6 mx-auto">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <nav className="text-xs text-stone-500 flex items-center gap-1.5 mb-6">
            <Link href="/" className="hover:text-brand-ink-800">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-brand-ink-800">
              Products
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-ink-800 font-semibold">{category.name}</span>
          </nav>

          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-stone-50 via-white to-brand-pink-50 p-6 sm:p-10 ring-1 ring-stone-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <span className="eyebrow">Category</span>
                <h1 className="mt-4 h1-display">{category.name}</h1>
                <p className="mt-4 text-base sm:text-lg text-stone-500 max-w-2xl">
                  {category.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/request-quote" className="btn-primary btn-lg">
                    <span className="btn-disc">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    Request a quote
                  </Link>
                  <Link href="/products" className="btn-outline rounded-full">
                    All products
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white shadow-elevated-lg">
                  <ImageWithFallback
                    src={category.imageUrl}
                    alt={category.name}
                    sizes="(max-width: 1024px) 90vw, 480px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <h2 className="h3-display">
              {products.length} product{products.length === 1 ? "" : "s"} in {category.name}
            </h2>
          </div>
          {products.length === 0 ? (
            <div className="rounded-3xl bg-white border border-stone-100 p-12 text-center">
              <p className="text-base font-semibold text-brand-ink-900">
                No products published yet
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Check back soon or browse the full catalog.
              </p>
              <Link href="/products" className="btn-primary btn-sm mt-6 mx-auto">
                Browse catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="h3-display mb-6">Explore other categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {other.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group rounded-3xl bg-white border border-stone-100 p-5 text-center hover:-translate-y-0.5 hover:shadow-elevated transition-all"
              >
                <div className="relative h-20 w-20 mx-auto overflow-hidden rounded-full ring-4 ring-stone-50 group-hover:ring-brand-green-100">
                  <ImageWithFallback src={c.imageUrl} alt={c.name} sizes="100px" />
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-ink-900">
                  {c.name}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {c._count?.products ?? 0} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
