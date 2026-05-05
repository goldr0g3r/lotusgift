"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  Filter,
  Warehouse,
  Tag,
} from "lucide-react";
import type { Product } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { productImage } from "@/lib/images";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function WholesalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch(`${API}/products?isWholesale=true`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryNames = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean))),
  ];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "All" || p.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const maxSavings = products.reduce((max, p) => {
    if (!p.wholesalePrice || p.priceFrom <= 0) return max;
    const pct = Math.round(
      ((p.priceFrom - p.wholesalePrice) / p.priceFrom) * 100,
    );
    return pct > max ? pct : max;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Marketing</span>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Wholesale products
            </h2>
            <Badge tone="gold">
              <Tag className="w-3 h-3 mr-1" />
              Bulk pricing
            </Badge>
          </div>
          <p className="text-stone-500 mt-1 text-sm">
            Products available at wholesale pricing for bulk orders
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Warehouse,
            value: products.length,
            label: "Wholesale products",
            tone: "emerald" as const,
          },
          {
            icon: Tag,
            value: maxSavings > 0 ? `Up to ${maxSavings}%` : "—",
            label: "Max savings",
            tone: "rose" as const,
          },
          {
            icon: Package,
            value: `${totalStock.toLocaleString()}+`,
            label: "Items in stock",
            tone: "gold" as const,
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center ring-1",
                stat.tone === "emerald" &&
                  "bg-lotus-emerald-50 ring-lotus-emerald-100",
                stat.tone === "rose" &&
                  "bg-lotus-rose-50 ring-lotus-rose-100",
                stat.tone === "gold" &&
                  "bg-lotus-gold-50 ring-lotus-gold-100",
              )}
            >
              <stat.icon
                className={cn(
                  "h-5 w-5",
                  stat.tone === "emerald" && "text-lotus-emerald-700",
                  stat.tone === "rose" && "text-lotus-rose-700",
                  stat.tone === "gold" && "text-lotus-gold-700",
                )}
              />
            </div>
            <div>
              <div className="text-xl font-bold text-stone-900">
                {stat.value}
              </div>
              <div className="text-xs text-stone-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search wholesale products..."
              className="!pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat!)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ring-1",
                  selectedCategory === cat
                    ? "bg-lotus-emerald-700 text-white ring-lotus-emerald-700"
                    : "bg-white text-stone-600 hover:bg-stone-50 ring-stone-200",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-10 h-10 text-stone-200 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-stone-900">
            No wholesale products found
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            {products.length === 0
              ? "No products have wholesale pricing enabled yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const savings =
              product.wholesalePrice && product.priceFrom > 0
                ? Math.round(
                    ((product.priceFrom - product.wholesalePrice) /
                      product.priceFrom) *
                      100,
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
              >
                <div className="relative aspect-[4/3] bg-stone-100">
                  <ImageWithFallback
                    src={productImage(product).src}
                    alt={product.name}
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  {savings > 0 && (
                    <span className="absolute top-3 right-3 rounded-full bg-lotus-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-warm">
                      Save {savings}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lotus-gold-700">
                    {product.category?.name}
                  </span>
                  <h3 className="text-sm font-semibold text-stone-900 mt-1 group-hover:text-lotus-emerald-700 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {product.sku}
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-lg font-bold text-lotus-emerald-700">
                      ₹
                      {(
                        product.wholesalePrice ?? product.priceFrom
                      ).toLocaleString("en-IN")}
                    </span>
                    {product.wholesalePrice &&
                      product.wholesalePrice < product.priceFrom && (
                        <span className="text-sm text-stone-400 line-through">
                          ₹{product.priceFrom.toLocaleString("en-IN")}
                        </span>
                      )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                    <span>Min: {product.wholesaleMinQty} pcs</span>
                    <span>{product.stock.toLocaleString()} in stock</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
