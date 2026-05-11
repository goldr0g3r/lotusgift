"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  ShoppingCart,
  FileText,
  Heart,
  ShieldCheck,
  Truck,
  Award,
  Sparkles,
} from "lucide-react";
import { ProductGallery } from "@/components/ui/ProductGallery";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ProductCard } from "@/components/catalog/ProductCard";
import { formatInr } from "@/components/ui/PriceTag";
import { useCart, useQuoteBag, useWishlist } from "@/lib/store";
import { mockProducts } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const product = useMemo(
    () => mockProducts.find((p) => p.slug === slug),
    [slug],
  );

  const cart = useCart();
  const bag = useQuoteBag();
  const wish = useWishlist();
  const [qty, setQty] = useState(product?.minOrderQty ?? 25);
  const [customisation, setCustomisation] = useState<string[]>([]);

  if (!product) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-16 text-center">
        <h1 className="h2-display">Product not found</h1>
        <p className="mt-3 text-stone-500">The product you were looking for is unavailable.</p>
        <Link href="/products" className="btn-primary btn-sm mt-6 mx-auto">
          Back to catalog
        </Link>
      </div>
    );
  }

  const isWish = wish.has(product.id);

  const tier = product.tieredPricing ?? [];
  const currentUnit =
    [...tier].reverse().find((t) => qty >= t.qty)?.unitPrice ?? product.priceFrom;
  const lineTotal = currentUnit * qty;

  const customOptions = (product.customizationOptions ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const related = mockProducts
    .filter((p) => p.id !== product.id && p.category.id === product.category.id)
    .slice(0, 4);

  const toggleCustom = (opt: string) =>
    setCustomisation((c) => (c.includes(opt) ? c.filter((x) => x !== opt) : [...c, opt]));

  const onAddToCart = () => {
    cart.add(product, qty);
    toast.success(`${product.name} (×${qty}) added to cart`);
  };
  const onAddToBag = () => {
    bag.add(product, qty, customisation.join(", ") || undefined);
    toast.success(`${product.name} added to quote bag`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
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
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-brand-ink-800"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-brand-ink-800 font-semibold truncate">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-6">
            <ProductGallery
              images={product.images.length > 0
                ? product.images.map((i) => ({ src: i.url, alt: i.alt ?? product.name }))
                : [{ src: product.imageUrl ?? "", alt: product.name }]}
            />
          </div>

          <div className="lg:col-span-6">
            <div className="flex items-center gap-2">
              {product.isFeatured && <Badge tone="pink">Featured</Badge>}
              {product.isWholesale && <Badge tone="green">Wholesale</Badge>}
              <Badge tone="neutral">{product.category.name}</Badge>
            </div>
            <h1 className="mt-4 h2-display">{product.name}</h1>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <StarRating
                value={product.rating ?? 4.7}
                showValue
                reviews={product.reviews}
                size="md"
              />
              <span className="text-xs text-stone-500">
                SKU: <span className="font-medium text-brand-ink-800">{product.sku}</span>
              </span>
            </div>
            <p className="mt-5 text-base text-stone-600 leading-relaxed">
              {product.shortDesc ?? product.description}
            </p>

            <div className="mt-7 rounded-3xl border border-stone-100 bg-white p-5 sm:p-6 shadow-soft">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-stone-500">
                    Unit price at {qty}+ units
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-brand-ink-900 tabular-nums">
                    {formatInr(currentUnit)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Line total: <span className="font-semibold text-brand-ink-800">{formatInr(lineTotal)}</span>
                  </p>
                </div>
                <QuantityStepper
                  value={qty}
                  onChange={setQty}
                  min={product.minOrderQty}
                  step={product.minOrderQty}
                  max={Math.max(product.stock, product.minOrderQty * 100)}
                />
              </div>

              {tier.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Volume tiers
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tier.map((t) => {
                      const isActive = qty >= t.qty;
                      return (
                        <button
                          key={t.qty}
                          type="button"
                          onClick={() => setQty(t.qty)}
                          className={cn(
                            "rounded-2xl border p-3 text-left transition-colors",
                            isActive
                              ? "bg-brand-green-50 border-brand-green-200"
                              : "bg-white border-stone-200 hover:border-brand-ink-300",
                          )}
                        >
                          <p className="text-[11px] font-medium text-stone-500">
                            {t.qty}+ units
                          </p>
                          <p className="text-base font-bold text-brand-ink-900 tabular-nums">
                            {formatInr(t.unitPrice)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customOptions.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Branding options
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleCustom(opt)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                          customisation.includes(opt)
                            ? "bg-brand-pink-500 text-white"
                            : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onAddToCart}
                  className="btn-pink btn-lg flex-1"
                >
                  <span className="btn-disc">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  Add to cart · {formatInr(lineTotal)}
                </button>
                <button
                  type="button"
                  onClick={onAddToBag}
                  className="btn-outline rounded-full flex-1"
                >
                  <FileText className="h-4 w-4" />
                  Add to quote bag
                </button>
                <button
                  type="button"
                  onClick={() => wish.toggle(product.id)}
                  aria-label="Toggle wishlist"
                  className={cn(
                    "inline-flex items-center justify-center rounded-full h-12 w-12 ring-1",
                    isWish
                      ? "bg-brand-pink-500 text-white ring-brand-pink-500"
                      : "bg-white text-stone-500 ring-stone-200 hover:text-brand-pink-600",
                  )}
                >
                  <Heart className={cn("h-5 w-5", isWish && "fill-current")} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Truck, label: "5d dispatch" },
                { icon: ShieldCheck, label: "QC every batch" },
                { icon: Award, label: "Brand-matched" },
                { icon: Sparkles, label: "Free mockups" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-stone-50 px-3 py-2.5 inline-flex items-center gap-2"
                >
                  <s.icon className="h-4 w-4 text-brand-green-600" />
                  <span className="text-xs font-semibold text-brand-ink-800">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 text-stone-600 leading-relaxed">
                <p>{product.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>Lead time: 10–14 days from artwork approval</li>
                  <li>Minimum order: {product.minOrderQty} units</li>
                  <li>Wholesale tier starts at {product.wholesaleMinQty} units</li>
                  <li>
                    Stock on hand:{" "}
                    <span className="font-semibold text-brand-ink-800">
                      {product.stock.toLocaleString("en-IN")}
                    </span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="branding">
              <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 text-stone-600">
                <p>
                  Available branding methods for this product include:
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(customOptions.length > 0
                    ? customOptions
                    : ["Logo printing", "Custom packaging"]
                  ).map((opt) => (
                    <li
                      key={opt}
                      className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-brand-ink-700"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm">
                  Pantone-matched colours, embroidery files and packaging
                  mockups are included on every order. Final artwork sign-off is
                  required before production locks.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="shipping">
              <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8 text-stone-600 space-y-3 text-sm">
                <p>
                  <strong className="text-brand-ink-900">Dispatch:</strong>{" "}
                  3–5 working days post artwork approval, scaling with quantity.
                </p>
                <p>
                  <strong className="text-brand-ink-900">Coverage:</strong>{" "}
                  Pan-India delivery via partners (Bluedart, Delhivery, DTDC).
                  Multi-city splits supported.
                </p>
                <p>
                  <strong className="text-brand-ink-900">Tracking:</strong>{" "}
                  Live status + ETA emails per shipment, with consolidated POD
                  reports for finance.
                </p>
                <p>
                  <strong className="text-brand-ink-900">Returns:</strong>{" "}
                  Branded merchandise is non-returnable except in case of QC defects, replaced free of charge.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="reviews">
              <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-8">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-4xl font-extrabold text-brand-ink-900 tabular-nums">
                      {(product.rating ?? 4.7).toFixed(1)}
                    </p>
                    <StarRating value={product.rating ?? 4.7} size="md" />
                    <p className="text-xs text-stone-500 mt-1">
                      Based on {product.reviews ?? 0} verified reviews
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    {
                      n: "Priya Menon",
                      c: "Swift Edge",
                      d: "Quality is great, branding came out exactly like the mockup.",
                    },
                    {
                      n: "Karan Shah",
                      c: "Routebox",
                      d: "Fast delivery, helpful coordinator. Will reorder.",
                    },
                  ].map((r) => (
                    <div key={r.n} className="rounded-2xl bg-stone-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-brand-ink-900">
                          {r.n} <span className="text-stone-500 font-normal">· {r.c}</span>
                        </p>
                        <StarRating value={5} size="sm" />
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{r.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {related.length > 0 && (
          <div className="mt-12 lg:mt-16">
            <div className="flex items-end justify-between mb-6">
              <h2 className="h3-display">You might also like</h2>
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-sm font-semibold text-brand-green-600 hover:text-brand-green-700 inline-flex items-center gap-1"
              >
                View category
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
