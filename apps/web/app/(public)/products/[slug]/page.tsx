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
  Truck,
  ShieldCheck,
  Award,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import type { Product } from "@/lib/api";
import { ProductGallery } from "@/components/ui/ProductGallery";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "@/components/catalog/ProductCard";
import { categoryImageMap, productImage } from "@/lib/images";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

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
        setQty(data.minOrderQty || 1);
        if (data.category?.slug) {
          return fetch(`${API}/products?categorySlug=${data.category.slug}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
              const items: Product[] = Array.isArray(list)
                ? list
                : list.data ?? [];
              setRelated(items.filter((p) => p.id !== data.id).slice(0, 4));
            });
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product"),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Package className="w-14 h-14 text-stone-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
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
    ? product.customizationOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const galleryImages = [
    productImage(product),
    ...(product.category?.slug && categoryImageMap[product.category.slug]
      ? [categoryImageMap[product.category.slug]!]
      : []),
  ].filter(Boolean) as Array<{ src: string; alt: string }>;

  // Ensure gallery has at least 1 image
  const images =
    galleryImages.length > 0
      ? galleryImages
      : [{ src: productImage(product).src, alt: product.name }];

  const tieredPricing: Array<{ qty: string; price: number }> = [
    { qty: `${product.minOrderQty}+`, price: product.priceFrom },
    ...(product.priceTo
      ? [{ qty: `${product.minOrderQty * 2}+`, price: Math.round(product.priceFrom * 0.9) }]
      : []),
    ...(product.isWholesale && product.wholesalePrice && product.wholesaleMinQty
      ? [{ qty: `${product.wholesaleMinQty}+`, price: product.wholesalePrice }]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-lotus-cream/60 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 flex-wrap">
            <Link href="/" className="hover:text-lotus-emerald-800">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/products" className="hover:text-lotus-emerald-800">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-lotus-emerald-800"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-900 font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-7">
            <ProductGallery images={images} />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-2">
                {product.category && (
                  <Link href={`/categories/${product.category.slug}`}>
                    <Badge tone="emerald">{product.category.name}</Badge>
                  </Link>
                )}
                {product.isFeatured && <Badge tone="gold">Featured</Badge>}
                {product.isWholesale && <Badge tone="rose">Wholesale</Badge>}
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-lotus-gold-400 text-lotus-gold-400"
                  />
                ))}
                <span className="ml-2 text-xs text-stone-500">4.9 · 120 reviews</span>
              </div>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-lotus-emerald-800">
                  {formatInr(product.priceFrom)}
                </span>
                {product.priceTo && (
                  <span className="text-sm text-stone-500">
                    – {formatInr(product.priceTo)}
                  </span>
                )}
                <span className="text-xs text-stone-400">per unit</span>
              </div>

              {product.shortDesc && (
                <p className="mt-4 text-sm text-stone-600 leading-relaxed">
                  {product.shortDesc}
                </p>
              )}

              {tieredPricing.length > 1 && (
                <div className="mt-5 rounded-2xl border border-lotus-gold-100 bg-lotus-cream p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lotus-gold-700 mb-3">
                    Volume pricing
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {tieredPricing.map((t) => (
                      <div
                        key={t.qty}
                        className="rounded-xl bg-white p-3 ring-1 ring-stone-200"
                      >
                        <p className="text-xs text-stone-500">{t.qty} pcs</p>
                        <p className="mt-1 font-bold text-lotus-emerald-800">
                          {formatInr(t.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-stone-200 p-3">
                  <p className="text-stone-500">Min. order</p>
                  <p className="mt-0.5 text-sm font-semibold text-stone-800">
                    {product.minOrderQty} pcs
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 p-3">
                  <p className="text-stone-500">Stock</p>
                  <p className="mt-0.5 text-sm font-semibold text-stone-800">
                    {product.stock > 0 ? `${product.stock} available` : "Made to order"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex items-center rounded-xl border border-stone-200 bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setQty((q) => Math.max(product.minOrderQty || 1, q - 1))
                    }
                    className="px-3 py-2.5 text-stone-500 hover:text-stone-900"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={product.minOrderQty || 1}
                    value={qty}
                    onChange={(e) =>
                      setQty(
                        Math.max(product.minOrderQty || 1, Number(e.target.value || 1)),
                      )
                    }
                    className="w-16 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3 py-2.5 text-stone-500 hover:text-stone-900"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-stone-400">
                  Min. {product.minOrderQty} pcs
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/request-quote?product=${product.slug}&qty=${qty}`}
                  className="btn-primary !py-3 text-base flex-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Quote
                </Link>
                <Link
                  href="/contact"
                  className="btn-outline !py-3 text-base flex-1"
                >
                  <Sparkles className="h-4 w-4" />
                  Custom request
                </Link>
              </div>

              <ul className="mt-6 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <li className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                  <Truck className="h-3.5 w-3.5 text-lotus-emerald-700" />
                  <span className="text-stone-700">3–5 day dispatch</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-lotus-emerald-700" />
                  <span className="text-stone-700">QC inspected</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                  <Award className="h-3.5 w-3.5 text-lotus-emerald-700" />
                  <span className="text-stone-700">Free mockups</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="customization">Customisation</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <div className="card p-6 text-sm leading-relaxed text-stone-600">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p>
                    Premium {product.name.toLowerCase()} crafted for corporate gifting and
                    promotional programs. Final finish, packaging and branding can be tailored
                    to your campaign.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="specs">
              <div className="card p-6 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500">SKU</span>
                  <span className="font-medium text-stone-800">{product.sku}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500">Category</span>
                  <span className="font-medium text-stone-800">
                    {product.category?.name ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500">MOQ</span>
                  <span className="font-medium text-stone-800">
                    {product.minOrderQty} pcs
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500">Wholesale MOQ</span>
                  <span className="font-medium text-stone-800">
                    {product.wholesaleMinQty || "—"}
                  </span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="customization">
              <div className="card p-6 text-sm">
                {customizationOptions.length > 0 ? (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {customizationOptions.map((opt) => (
                      <li
                        key={opt}
                        className="flex items-center gap-2 rounded-xl bg-lotus-emerald-50/40 px-3 py-2 ring-1 ring-lotus-emerald-100"
                      >
                        <Check className="h-4 w-4 text-lotus-emerald-700" />
                        <span className="text-stone-700">{opt}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-500">
                    Logo printing, embroidery, deboss and custom packaging available on
                    request. Share artwork and we&apos;ll send mockups within 24 hours.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="shipping">
              <div className="card p-6 text-sm text-stone-600 space-y-2">
                <p>
                  Standard production runs ship within 7–10 business days from artwork
                  approval. Express slots available for urgent campaigns.
                </p>
                <p>
                  Pan-India delivery via tracked logistics. International shipping available
                  on request.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-stone-50/50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="mb-8 flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-stone-900">
                You may also like
              </h2>
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-sm font-semibold text-lotus-emerald-700 hover:text-lotus-emerald-900"
                >
                  More in {product.category.name}
                </Link>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
