"use client";

import Link from "next/link";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/api";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Badge } from "@/components/ui/Badge";
import { productImage } from "@/lib/images";
import { cn } from "@/lib/cn";

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function ProductCard({
  product,
  className,
  onAddToQuote,
}: {
  product: Product;
  className?: string;
  onAddToQuote?: (p: Product) => void;
}) {
  const img = productImage(product);
  return (
    <article
      className={cn(
        "group relative card flex flex-col overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
          <ImageWithFallback
            src={img.src}
            alt={product.name}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="transition-transform duration-700 group-hover:scale-105"
          />
          {product.category?.name && (
            <Badge tone="emerald" className="absolute left-3 top-3 !text-[10px]">
              {product.category.name}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge tone="gold" className="absolute right-3 top-3 !text-[10px]">
              Featured
            </Badge>
          )}
          {product.isWholesale && !product.isFeatured && (
            <Badge tone="rose" className="absolute right-3 top-3 !text-[10px]">
              Wholesale
            </Badge>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/products/${product.slug}`}
          className="text-base font-semibold text-stone-900 group-hover:text-lotus-emerald-800 transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        {(product.shortDesc || product.description) && (
          <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">
            {product.shortDesc || product.description}
          </p>
        )}
        <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-stone-100 pt-4">
          <p className="text-lg font-bold text-lotus-emerald-800">
            {formatInr(product.priceFrom)}
            {product.priceTo ? (
              <span className="font-medium text-stone-500"> – {formatInr(product.priceTo)}</span>
            ) : (
              <span className="font-medium text-stone-500">+</span>
            )}
          </p>
          <p className="text-[11px] text-stone-400">MOQ {product.minOrderQty}</p>
        </div>
        <div className="mt-4 flex gap-2">
          {onAddToQuote ? (
            <button
              type="button"
              onClick={() => onAddToQuote(product)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-lotus-emerald-50 px-3 py-2 text-sm font-semibold text-lotus-emerald-800 hover:bg-lotus-emerald-100 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Quote
            </button>
          ) : (
            <Link
              href={`/request-quote?product=${product.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-lotus-emerald-50 px-3 py-2 text-sm font-semibold text-lotus-emerald-800 hover:bg-lotus-emerald-100 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Get Quote
            </Link>
          )}
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:border-lotus-emerald-300 hover:text-lotus-emerald-800 hover:bg-lotus-emerald-50/40 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
