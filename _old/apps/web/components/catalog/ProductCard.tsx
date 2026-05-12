"use client";

import Link from "next/link";
import { ShoppingCart, FileText, Heart } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/components/ui/PriceTag";
import { useCart, useQuoteBag, useWishlist } from "@/lib/store";
import type { Product } from "@/lib/api-types";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

export function ProductCard({
  product,
  className,
  variant = "tall",
}: {
  product: Product;
  className?: string;
  variant?: "tall" | "compact" | "wide";
}) {
  const cart = useCart();
  const bag = useQuoteBag();
  const wish = useWishlist();
  const isWish = wish.has(product.id);

  const addToCart = () => {
    cart.add(product, product.minOrderQty);
    toast.success(`${product.name} added to cart`);
  };
  const addToBag = () => {
    bag.add(product, product.minOrderQty);
    toast.success(`${product.name} added to quote bag`);
  };
  const toggleWish = () => {
    wish.toggle(product.id);
  };

  if (variant === "wide") {
    return (
      <article
        className={cn(
          "group flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-3xl border border-stone-100 bg-white p-3 sm:p-4 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300",
          className,
        )}
      >
        <Link
          href={`/products/${product.slug}`}
          className="relative aspect-[4/3] sm:aspect-square sm:w-44 lg:w-52 shrink-0 overflow-hidden rounded-2xl bg-stone-50"
        >
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 90vw, 220px"
            className="group-hover:scale-105 transition-transform duration-500"
          />
          {product.isFeatured && (
            <Badge tone="pink" className="absolute left-3 top-3 !text-[10px]">
              Featured
            </Badge>
          )}
        </Link>
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="text-base sm:text-lg font-bold text-brand-ink-900 hover:text-brand-green-700 line-clamp-2"
            >
              {product.name}
            </Link>
            <button
              type="button"
              onClick={toggleWish}
              aria-label="Toggle wishlist"
              className={cn(
                "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1",
                isWish
                  ? "bg-brand-pink-500 text-white ring-brand-pink-500"
                  : "bg-white text-stone-500 ring-stone-200 hover:text-brand-pink-600",
              )}
            >
              <Heart className={cn("h-4 w-4", isWish && "fill-current")} />
            </button>
          </div>
          <p className="mt-1 text-sm text-stone-500 line-clamp-2">
            {product.shortDesc ?? product.description}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <StarRating value={product.rating ?? 4.6} reviews={product.reviews} />
            <span className="text-xs font-medium text-stone-500">
              MOQ {product.minOrderQty}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-stone-500">From</p>
              <p className="text-xl sm:text-2xl font-extrabold text-brand-ink-900 tabular-nums">
                {formatInr(product.priceFrom)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addToBag}
                className="btn-outline btn-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                Quote
              </button>
              <button type="button" onClick={addToCart} className="btn-pink btn-sm">
                <ShoppingCart className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default "tall" / "compact" share the same vertical card with image on top.
  const isCompact = variant === "compact";
  return (
    <article
      className={cn(
        "group flex flex-col rounded-3xl bg-white border border-stone-100 overflow-hidden hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="relative block">
        <div
          className={cn(
            "relative overflow-hidden bg-stone-50",
            isCompact ? "aspect-[4/3]" : "aspect-[4/5]",
          )}
        >
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isFeatured && (
              <Badge tone="pink" className="!text-[10px]">
                Featured
              </Badge>
            )}
            {product.isWholesale && !product.isFeatured && (
              <Badge tone="green" className="!text-[10px]">
                Wholesale
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleWish();
            }}
            aria-label="Toggle wishlist"
            className={cn(
              "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors",
              isWish
                ? "bg-brand-pink-500 text-white ring-brand-pink-500"
                : "bg-white text-stone-500 ring-stone-200 hover:text-brand-pink-600",
            )}
          >
            <Heart className={cn("h-4 w-4", isWish && "fill-current")} />
          </button>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500">
          {product.category?.name}
          <span aria-hidden>·</span>
          <span>MOQ {product.minOrderQty}</span>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 text-base font-bold text-brand-ink-900 hover:text-brand-green-700 line-clamp-2"
        >
          {product.name}
        </Link>
        <div className="mt-2">
          <StarRating value={product.rating ?? 4.6} reviews={product.reviews} />
        </div>
        <div className="mt-4 flex items-end justify-between gap-2 border-t border-stone-100 pt-4">
          <div>
            <p className="text-[11px] text-stone-500">From</p>
            <p className="text-lg font-extrabold text-brand-ink-900 tabular-nums">
              {formatInr(product.priceFrom)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addToBag}
              aria-label="Add to quote bag"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100"
              title="Add to quote bag"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={addToCart}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink-600"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
