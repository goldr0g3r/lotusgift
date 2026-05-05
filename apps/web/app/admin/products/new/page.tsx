"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Save, Loader2 } from "lucide-react";
import type { Category } from "@/lib/api";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [stock, setStock] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isWholesale, setIsWholesale] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("");

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((data: any) =>
        setCategories(Array.isArray(data) ? data : data.data || []),
      )
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || !description || !categoryId || !priceFrom) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const body: Record<string, unknown> = {
        name,
        slug: slug || slugify(name),
        sku,
        description,
        categoryId,
        priceFrom: Number(priceFrom),
        isActive: true,
        isFeatured,
        isWholesale,
      };
      if (shortDesc) body.shortDesc = shortDesc;
      if (priceTo) body.priceTo = Number(priceTo);
      if (stock) body.stock = Number(stock);
      if (minOrderQty) body.minOrderQty = Number(minOrderQty);
      if (imageUrl) body.imageUrl = imageUrl;
      if (isWholesale && wholesalePrice)
        body.wholesalePrice = Number(wholesalePrice);
      if (isWholesale && wholesaleMinQty)
        body.wholesaleMinQty = Number(wholesaleMinQty);

      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create product");
      }

      toast.success("Product created");
      router.push("/admin/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="eyebrow">Catalog</span>
          <h2 className="mt-1 font-display text-2xl font-bold text-stone-900">
            Add new product
          </h2>
          <p className="text-stone-500 mt-1 text-sm">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Basic information
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label>Product name *</Label>
              <Input
                placeholder="e.g., Custom branded pens"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                className="font-mono text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <Label>SKU *</Label>
              <Input
                placeholder="e.g., PEN-001"
                className="font-mono"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              {loadingCats ? (
                <div className="flex items-center gap-2 text-stone-400 px-4 py-2.5 rounded-xl ring-1 ring-stone-200 bg-stone-50">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div>
              <Label>Min order qty</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Short description</Label>
              <Input
                placeholder="Brief one-liner for listings"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description *</Label>
              <Textarea
                rows={4}
                placeholder="Describe the product, materials, customization options..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Pricing
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label>Price from (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Price to (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Stock quantity</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-lotus-emerald-700 focus:ring-lotus-emerald-500"
              />
              <span className="text-sm text-stone-700">Featured product</span>
            </label>
          </div>

          <div className="border-t border-stone-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">
                  Wholesale pricing
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enable wholesale pricing for bulk buyers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWholesale(!isWholesale)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  isWholesale ? "bg-lotus-emerald-700" : "bg-stone-300",
                )}
                aria-label="Toggle wholesale"
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                    isWholesale && "translate-x-5",
                  )}
                />
              </button>
            </div>
            {isWholesale && (
              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <div>
                  <Label>Wholesale price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Minimum quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={wholesaleMinQty}
                    onChange={(e) => setWholesaleMinQty(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Product image
          </h3>
          <div className="grid sm:grid-cols-[1fr_220px] gap-5">
            <div>
              <Label>Image URL</Label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-stone-400 mt-2">
                Paste a public image URL. Cloudinary upload coming soon.
              </p>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 ring-1 ring-stone-200">
              {imageUrl ? (
                <ImageWithFallback
                  src={imageUrl}
                  alt="Product preview"
                  sizes="220px"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <Upload className="w-7 h-7" />
                  <span className="mt-2 text-xs">Preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/products" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}
