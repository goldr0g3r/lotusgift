"use client";

import Link from "next/link";
import { ArrowRight, FileText, ShoppingCart, Trash2 } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatInr } from "@/components/ui/PriceTag";
import { useCart, useQuoteBag } from "@/lib/store";
import { toast } from "@/components/ui/Toaster";
import { mockProducts } from "@/lib/mock-data";

export default function QuoteBagPage() {
  const bag = useQuoteBag();
  const cart = useCart();

  if (bag.ready && bag.items.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center rounded-4xl bg-white border border-stone-100 p-10 sm:p-14">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="mt-5 h2-display">Your quote bag is empty</h1>
          <p className="mt-3 text-stone-500">
            Add products you want custom branding or volume pricing on, and we&apos;ll come back with a tailored quote.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/products" className="btn-primary btn-lg">
              <span className="btn-disc">
                <ArrowRight className="h-4 w-4" />
              </span>
              Browse catalog
            </Link>
            <Link href="/cart" className="btn-outline rounded-full">
              View cart ({cart.count})
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = bag.subtotal;
  const estDiscount = Math.round(subtotal * 0.08);
  const estTotal = subtotal - estDiscount;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <span className="eyebrow-pink">Quote bag</span>
        <h1 className="mt-3 h2-display">Build your custom quote</h1>
        <p className="mt-2 text-stone-500 text-sm sm:text-base max-w-2xl">
          Items added here come with custom branding options and tiered volume
          pricing. Once you submit the bag, our team will share a full quote in 48
          hours.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-4">
            {bag.items.map((it) => (
              <div
                key={it.productId}
                className="rounded-3xl bg-white border border-stone-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
              >
                <Link
                  href={`/products/${it.slug}`}
                  className="relative aspect-square w-full sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-2xl bg-stone-50"
                >
                  <ImageWithFallback src={it.imageUrl} alt={it.name} sizes="120px" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-500">{it.category}</p>
                  <Link
                    href={`/products/${it.slug}`}
                    className="text-base font-bold text-brand-ink-900 hover:text-brand-green-700 line-clamp-1"
                  >
                    {it.name}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    Indicative unit {formatInr(it.unitPrice)} · MOQ {it.minOrderQty}
                  </p>
                  {it.customization && (
                    <p className="mt-1 text-[11px] text-brand-pink-700 font-medium">
                      Branding: {it.customization}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <QuantityStepper
                      value={it.qty}
                      onChange={(q) => bag.updateQty(it.productId, q)}
                      min={it.minOrderQty}
                      step={Math.max(1, Math.floor(it.minOrderQty / 5))}
                    />
                    <button
                      type="button"
                      onClick={() => bag.remove(it.productId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right sm:min-w-[110px]">
                  <p className="text-xs text-stone-500">Indicative line</p>
                  <p className="text-lg font-extrabold text-brand-ink-900 tabular-nums">
                    {formatInr(it.qty * it.unitPrice)}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-3xl bg-brand-pink-50 border border-brand-pink-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-pink-800">
                  Ready to order at listed prices instead?
                </p>
                <p className="text-xs text-brand-pink-700/80">
                  Copy this bag into your cart and checkout straight away.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  bag.items.forEach((it) => {
                    const product = mockProducts.find((p) => p.id === it.productId);
                    if (product) cart.add(product, it.qty);
                  });
                  toast.success("Items copied to your cart");
                }}
                className="btn-outline-pink rounded-full"
              >
                <ShoppingCart className="h-4 w-4" />
                Copy to cart
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-6 rounded-3xl bg-white border border-stone-100 p-6 shadow-soft">
              <h2 className="text-lg font-bold text-brand-ink-900">Bag summary</h2>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Items</dt>
                  <dd className="font-semibold tabular-nums">{bag.lineCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Units</dt>
                  <dd className="font-semibold tabular-nums">{bag.count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Indicative subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatInr(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Volume estimate (~8%)</dt>
                  <dd className="font-semibold text-brand-green-700 tabular-nums">
                    − {formatInr(estDiscount)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-ink-900">Est. total</span>
                <span className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">
                  {formatInr(estTotal)}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Final price depends on customisation, quantity tier and delivery cities.
              </p>
              <Link
                href="/request-quote?from=bag"
                className="btn-primary btn-lg w-full mt-6"
              >
                <span className="btn-disc">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Submit for quote
              </Link>
              <Link
                href="/products"
                className="block text-center mt-3 text-xs font-semibold text-stone-500 hover:text-brand-ink-800"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
