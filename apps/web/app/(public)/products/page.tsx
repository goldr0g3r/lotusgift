"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Package,
  Sparkles,
} from "lucide-react";
import type { Product, Category } from "@/lib/api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet } from "@/components/ui/Sheet";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

function FiltersPanel({
  categories,
  activeCategory,
  setActiveCategory,
  wholesaleOnly,
  setWholesaleOnly,
  inStockOnly,
  setInStockOnly,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  onClose,
}: {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (s: string) => void;
  wholesaleOnly: boolean;
  setWholesaleOnly: (v: boolean) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  priceMin: string;
  priceMax: string;
  setPriceMin: (v: string) => void;
  setPriceMax: (v: string) => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center gap-2 text-stone-700">
          <Filter className="h-4 w-4 text-lotus-emerald-700" />
          <h3 className="text-sm font-semibold">Categories</h3>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => {
                setActiveCategory("");
                onClose?.();
              }}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                activeCategory === ""
                  ? "bg-lotus-emerald-50 text-lotus-emerald-800 font-semibold"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => {
                  setActiveCategory(cat.slug);
                  onClose?.();
                }}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                  activeCategory === cat.slug
                    ? "bg-lotus-emerald-50 text-lotus-emerald-800 font-semibold"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <span>{cat.name}</span>
                {cat._count?.products != null && (
                  <span className="text-[11px] text-stone-400">
                    {cat._count.products}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-700">Price (₹)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            className="input-field !py-2"
          />
          <input
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            className="input-field !py-2"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-700">Options</h3>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 cursor-pointer">
          <span>Wholesale only</span>
          <input
            type="checkbox"
            checked={wholesaleOnly}
            onChange={(e) => setWholesaleOnly(e.target.checked)}
            className="h-4 w-4 accent-lotus-emerald-700"
          />
        </label>
        <label className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 cursor-pointer">
          <span>In stock</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-lotus-emerald-700"
          />
        </label>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeCategory) params.set("categorySlug", activeCategory);
    const qs = params.toString();
    fetch(`${API}/products${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : data.data ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load products"),
      )
      .finally(() => setLoading(false));
  }, [debouncedSearch, activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredAndSorted = useMemo(() => {
    let list = products.slice();
    if (wholesaleOnly) list = list.filter((p) => p.isWholesale);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    if (min != null && !Number.isNaN(min)) list = list.filter((p) => p.priceFrom >= min);
    if (max != null && !Number.isNaN(max)) list = list.filter((p) => p.priceFrom <= max);
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      default:
        list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }
    return list;
  }, [products, wholesaleOnly, inStockOnly, priceMin, priceMax, sort]);

  const activeCategoryName =
    categories.find((c) => c.slug === activeCategory)?.name ?? "All Products";

  const filtersProps = {
    categories,
    activeCategory,
    setActiveCategory,
    wholesaleOnly,
    setWholesaleOnly,
    inStockOnly,
    setInStockOnly,
    priceMin,
    priceMax,
    setPriceMin,
    setPriceMax,
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-lotus-cream border-b border-stone-200">
        <div className="absolute inset-0 lotus-pattern opacity-70" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
            <Link href="/" className="hover:text-lotus-emerald-800">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-stone-700 font-medium">Products</span>
          </nav>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">Catalog</span>
              <h1 className="mt-3 h1-display !text-4xl sm:!text-5xl">
                Premium gifting catalog
              </h1>
              <p className="mt-3 text-base text-stone-500 max-w-xl">
                Browse 500+ curated promotional products, hampers, apparel and tech for every program.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the catalog..."
                  className="input-field !pl-9 sm:w-80"
                />
              </div>
              <Link
                href="/request-quote"
                className="btn-primary !py-2.5"
              >
                <Sparkles className="h-4 w-4" />
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="card p-5 sticky top-28">
              <FiltersPanel {...filtersProps} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{activeCategoryName}</h2>
                {!loading && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {filteredAndSorted.length} product{filteredAndSorted.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>
                <Select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="!py-2 !pr-9 sm:w-44"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </Select>
              </div>
            </div>

            {(wholesaleOnly || inStockOnly || priceMin || priceMax) && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {wholesaleOnly && (
                  <Badge tone="gold" className="cursor-pointer" onClick={() => setWholesaleOnly(false)}>
                    Wholesale only ×
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge tone="emerald" className="cursor-pointer" onClick={() => setInStockOnly(false)}>
                    In stock ×
                  </Badge>
                )}
                {(priceMin || priceMax) && (
                  <Badge
                    tone="gray"
                    className="cursor-pointer"
                    onClick={() => {
                      setPriceMin("");
                      setPriceMax("");
                    }}
                  >
                    Price {priceMin || 0}–{priceMax || "∞"} ×
                  </Badge>
                )}
              </div>
            )}

            {error && (
              <div className="card p-8 text-center">
                <p className="text-sm text-lotus-rose-700 mb-4">{error}</p>
                <button onClick={fetchProducts} className="btn-secondary text-sm">
                  Try Again
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <Skeleton className="aspect-[4/5] rounded-none" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !error && filteredAndSorted.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="font-medium text-stone-700">No products found</p>
                <p className="text-sm text-stone-400 mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSorted.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Sheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        side="left"
        size="md"
        title="Filters"
      >
        <div className="px-5 py-5">
          <FiltersPanel {...filtersProps} onClose={() => setMobileFiltersOpen(false)} />
        </div>
      </Sheet>
    </div>
  );
}
