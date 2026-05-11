"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Filter, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Sheet } from "@/components/ui/Sheet";
import { SearchPill, Select } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { mockCategories, mockProducts } from "@/lib/mock-data";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

export default function ProductsPage() {
  const params = useSearchParams();
  const initialCategory = params.get("category") ?? "";
  const initialWholesale = params.get("wholesale") === "true";
  const initialSearch = params.get("search") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [wholesaleOnly, setWholesaleOnly] = useState(initialWholesale);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [ecoOnly, setEcoOnly] = useState(false);
  const [priceTier, setPriceTier] = useState<"all" | "under-500" | "500-1500" | "above-1500">(
    "all",
  );
  const [sort, setSort] = useState<SortKey>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockProducts
      .filter((p) => {
        if (category && p.category.slug !== category) return false;
        if (wholesaleOnly && !p.isWholesale) return false;
        if (inStockOnly && p.stock <= 0) return false;
        if (ecoOnly && p.category.slug !== "eco-friendly") return false;
        if (priceTier === "under-500" && p.priceFrom >= 500) return false;
        if (priceTier === "500-1500" && (p.priceFrom < 500 || p.priceFrom > 1500))
          return false;
        if (priceTier === "above-1500" && p.priceFrom <= 1500) return false;
        if (q) {
          const hay = `${p.name} ${p.shortDesc ?? ""} ${p.category.name}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "price-asc") return a.priceFrom - b.priceFrom;
        if (sort === "price-desc") return b.priceFrom - a.priceFrom;
        if (sort === "newest")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [category, wholesaleOnly, inStockOnly, ecoOnly, priceTier, search, sort]);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (category)
    activeChips.push({
      label: `Category: ${mockCategories.find((c) => c.slug === category)?.name ?? category}`,
      clear: () => setCategory(""),
    });
  if (wholesaleOnly) activeChips.push({ label: "Wholesale", clear: () => setWholesaleOnly(false) });
  if (inStockOnly) activeChips.push({ label: "In stock", clear: () => setInStockOnly(false) });
  if (ecoOnly) activeChips.push({ label: "Eco-friendly", clear: () => setEcoOnly(false) });
  if (priceTier !== "all")
    activeChips.push({
      label:
        priceTier === "under-500"
          ? "Under ₹500"
          : priceTier === "500-1500"
            ? "₹500 – ₹1500"
            : "Above ₹1500",
      clear: () => setPriceTier("all"),
    });

  const clearAll = () => {
    setCategory("");
    setWholesaleOnly(false);
    setInStockOnly(false);
    setEcoOnly(false);
    setPriceTier("all");
    setSearch("");
  };

  const filters = (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center gap-2 text-brand-ink-800">
          <Filter className="h-4 w-4 text-brand-green-600" />
          <h3 className="text-sm font-semibold">Categories</h3>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`w-full text-left text-sm px-3 py-2 rounded-full transition-colors ${
                category === ""
                  ? "bg-brand-ink-900 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              All products
            </button>
          </li>
          {mockCategories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCategory(c.slug)}
                className={`w-full text-left text-sm px-3 py-2 rounded-full transition-colors ${
                  category === c.slug
                    ? "bg-brand-ink-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-brand-ink-800">
          <Sparkles className="h-4 w-4 text-brand-pink-500" />
          <h3 className="text-sm font-semibold">Quick filters</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWholesaleOnly(!wholesaleOnly)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              wholesaleOnly
                ? "bg-brand-green-500 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200"
            }`}
          >
            Wholesale
          </button>
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              inStockOnly
                ? "bg-brand-green-500 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200"
            }`}
          >
            In stock
          </button>
          <button
            type="button"
            onClick={() => setEcoOnly(!ecoOnly)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              ecoOnly
                ? "bg-brand-green-500 text-white"
                : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200"
            }`}
          >
            Eco-friendly
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-brand-ink-800">Price range</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "all", label: "All" },
            { v: "under-500", label: "Under ₹500" },
            { v: "500-1500", label: "₹500 – 1500" },
            { v: "above-1500", label: "Above ₹1500" },
          ].map((p) => (
            <button
              type="button"
              key={p.v}
              onClick={() => setPriceTier(p.v as typeof priceTier)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                priceTier === p.v
                  ? "bg-brand-ink-900 text-white"
                  : "bg-stone-100 text-brand-ink-700 hover:bg-stone-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <nav className="text-xs text-stone-500 flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-brand-ink-800">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-brand-ink-800 font-semibold">Products</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Catalog</span>
            <h1 className="mt-3 h2-display">Browse our products</h1>
            <p className="mt-2 text-stone-500 text-sm sm:text-base max-w-2xl">
              Filter by category, price tier or campaign type. Add to cart for
              instant orders or to the quote bag for custom-branded volumes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchPill
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80"
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="!py-3 min-w-[160px]"
            >
              <option value="featured">Featured</option>
              <option value="rating">Best rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Newest first</option>
            </Select>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden btn-ghost"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {(activeChips.length > 0 || filtered.length !== mockProducts.length) && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </span>
            {activeChips.map((c) => (
              <Pill
                key={c.label}
                tone="green"
                size="sm"
                onClick={c.clear}
                className="cursor-pointer hover:bg-brand-green-100"
              >
                {c.label}
                <X className="h-3 w-3" />
              </Pill>
            ))}
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-brand-ink-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        <div className="mt-8 grid grid-cols-12 gap-6 lg:gap-8">
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-6 rounded-3xl bg-white border border-stone-100 p-6">
              {filters}
            </div>
          </aside>
          <div className="col-span-12 lg:col-span-9">
            {filtered.length === 0 ? (
              <div className="rounded-3xl bg-white border border-stone-100 p-12 text-center">
                <p className="text-base font-semibold text-brand-ink-900">
                  No products match those filters
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Try clearing a filter or widening the price range.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="btn-primary btn-sm mt-5 mx-auto"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="bottom"
        size="xl"
        title="Filters"
      >
        <div className="p-6">{filters}</div>
      </Sheet>
    </div>
  );
}
