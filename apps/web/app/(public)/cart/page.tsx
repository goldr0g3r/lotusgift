"use client";

import Link from "next/link";
import { ArrowRight, FileText, ShoppingBag, Trash2 } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatInr } from "@/components/ui/PriceTag";
import { useCart, useQuoteBag } from "@/lib/store";
import { toast } from "@/components/ui/Toaster";
import { mockProducts } from "@/lib/mock-data";

export default function CartPage() {
  const cart = useCart();
  const bag = useQuoteBag();

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center rounded-4xl bg-white border border-stone-100 p-10 sm:p-14">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-pink-50 text-brand-pink-600">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="mt-5 h2-display">Your cart is empty</h1>
          <p className="mt-3 text-stone-500">
            Add a few favourites to get started, or build a custom-branded order with a quote request.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/products" className="btn-primary btn-lg">
              <span className="btn-disc">
                <ArrowRight className="h-4 w-4" />
              </span>
              Browse catalog
            </Link>
            <Link href="/quote-bag" className="btn-outline rounded-full">
              View quote bag ({bag.count})
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mockProducts.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="rounded-2xl bg-stone-50 p-3 text-left hover:bg-stone-100"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <ImageWithFallback src={p.imageUrl} alt={p.name} sizes="160px" />
                </div>
                <p className="mt-2 text-xs font-semibold line-clamp-2 text-brand-ink-900">
                  {p.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const discount = Math.round(subtotal * 0.04);
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + tax;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow">Cart</span>
            <h1 className="mt-3 h2-display">Review your order</h1>
            <p className="mt-2 text-stone-500 text-sm">
              {cart.lineCount} line item{cart.lineCount === 1 ? "" : "s"} · {cart.count} units
            </p>
          </div>
          <Link href="/products" className="btn-ghost hidden sm:inline-flex">
            Continue shopping
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-4">
            {cart.items.map((it) => (
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
                    MOQ {it.minOrderQty} · Unit {formatInr(it.unitPrice)}
                  </p>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <QuantityStepper
                      value={it.qty}
                      onChange={(q) => cart.updateQty(it.productId, q)}
                      min={it.minOrderQty}
                      step={Math.max(1, Math.floor(it.minOrderQty / 5))}
                    />
                    <button
                      type="button"
                      onClick={() => cart.remove(it.productId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right sm:min-w-[110px]">
                  <p className="text-xs text-stone-500">Line total</p>
                  <p className="text-lg font-extrabold text-brand-ink-900 tabular-nums">
                    {formatInr(it.qty * it.unitPrice)}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-3xl bg-brand-green-50 border border-brand-green-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-green-800">
                  Need custom branding or bulk pricing?
                </p>
                <p className="text-xs text-brand-green-700/80">
                  Convert this cart to a quote — we&apos;ll come back with branded mockups within 48h.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  cart.items.forEach((it) => {
                    const product = mockProducts.find((p) => p.id === it.productId);
                    if (product) bag.add(product, it.qty);
                  });
                  toast.success("Items copied to your quote bag");
                }}
                className="btn-outline rounded-full"
              >
                <FileText className="h-4 w-4" />
                Copy to quote bag
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-6 rounded-3xl bg-white border border-stone-100 p-6 shadow-soft">
              <h2 className="text-lg font-bold text-brand-ink-900">Order summary</h2>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatInr(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Volume discount (4%)</dt>
                  <dd className="font-semibold text-brand-green-700 tabular-nums">
                    − {formatInr(discount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">GST (18%)</dt>
                  <dd className="font-semibold tabular-nums">{formatInr(tax)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Shipping</dt>
                  <dd className="font-semibold tabular-nums text-brand-green-700">Free</dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-ink-900">Total</span>
                <span className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">
                  {formatInr(total)}
                </span>
              </div>
              <Link href="/checkout" className="btn-pink btn-lg w-full mt-6">
                <span className="btn-disc">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Proceed to checkout
              </Link>
              <Link
                href="/products"
                className="block text-center mt-3 text-xs font-semibold text-stone-500 hover:text-brand-ink-800"
              >
                Continue shopping
              </Link>
              <p className="mt-5 text-[11px] text-stone-500 text-center">
                Secured by Razorpay · Pan-India delivery · QC every batch
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
