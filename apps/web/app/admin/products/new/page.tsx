"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Save, Loader2, AlertCircle } from "lucide-react";
import type { Category } from "@/lib/api";

const API = "http://localhost:3001/api";

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
  const [error, setError] = useState("");

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
      .catch(() => setError("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !sku || !description || !categoryId || !priceFrom) {
      setError("Please fill in all required fields");
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
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create product",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <p className="text-gray-500 mt-1">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">
            Basic Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input
                type="text"
                placeholder="e.g., Custom Branded Pens"
                className="input-field"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input
                type="text"
                className="input-field font-mono text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <label className="label">SKU *</label>
              <input
                type="text"
                placeholder="e.g., PEN-001"
                className="input-field font-mono"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Category *</label>
              {loadingCats ? (
                <div className="input-field flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <select
                  className="input-field"
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
                </select>
              )}
            </div>
            <div>
              <label className="label">Min Order Qty</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                className="input-field"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Short Description</label>
              <input
                type="text"
                placeholder="Brief one-liner for listings"
                className="input-field"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description *</label>
              <textarea
                rows={4}
                placeholder="Describe the product, materials, customization options..."
                className="input-field resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">Pricing</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Price From (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-field"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Price To (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-field"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="input-field"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-green-500 focus:ring-brand-green-500"
              />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Wholesale Pricing
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enable wholesale pricing for bulk buyers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWholesale(!isWholesale)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isWholesale ? "bg-brand-green-500" : "bg-gray-200"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isWholesale ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            {isWholesale && (
              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="label">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input-field"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Minimum Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    className="input-field"
                    value={wholesaleMinQty}
                    onChange={(e) => setWholesaleMinQty(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">
            Product Image
          </h3>
          <div>
            <label className="label">Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              className="input-field"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          {!imageUrl && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <Upload className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">
                Or enter an image URL above
              </p>
            </div>
          )}
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
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
