"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Save } from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { mockCategories } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    slug: "",
    categoryId: mockCategories[0]?.id ?? "",
    shortDesc: "",
    description: "",
    priceFrom: "",
    wholesalePrice: "",
    moq: "25",
    wholesaleMoq: "100",
    stock: "0",
    customization: "",
    featured: false,
    wholesale: true,
  });
  const update = (k: keyof typeof form, v: typeof form[keyof typeof form]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Product "${form.name}" saved (stub)`);
    router.push("/admin/products");
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-brand-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>
      <div>
        <span className="eyebrow">New product</span>
        <h2 className="mt-3 h2-display">Add a product to the catalog</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Save now and publish from the listing page.
        </p>
      </div>

      <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Basic info
            </h3>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  placeholder="LG-XXX-001"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                >
                  {mockCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Stock on hand</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => update("stock", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Short description</Label>
                <Input
                  value={form.shortDesc}
                  onChange={(e) => update("shortDesc", e.target.value)}
                  placeholder="One-liner for cards and listings"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Full description</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Pricing
            </h3>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>List price (from)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.priceFrom}
                  onChange={(e) => update("priceFrom", e.target.value)}
                  placeholder="₹"
                />
              </div>
              <div>
                <Label>Wholesale unit price</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.wholesalePrice}
                  onChange={(e) => update("wholesalePrice", e.target.value)}
                />
              </div>
              <div>
                <Label>MOQ</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.moq}
                  onChange={(e) => update("moq", e.target.value)}
                />
              </div>
              <div>
                <Label>Wholesale MOQ</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.wholesaleMoq}
                  onChange={(e) => update("wholesaleMoq", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-100 p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Customisation options
            </h3>
            <Textarea
              className="mt-5"
              rows={3}
              value={form.customization}
              onChange={(e) => update("customization", e.target.value)}
              placeholder="Comma separated, e.g. Logo printing, Custom box, Engraved tag"
            />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-3xl bg-white border border-stone-100 p-6">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Images
            </h3>
            <div className="mt-4 aspect-square rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400">
              <ImagePlus className="h-6 w-6" />
              <p className="mt-2 text-xs text-center px-4">
                Drop product images, PNG or JPG, up to 4MB each.
              </p>
              <button
                type="button"
                className="btn-outline btn-sm mt-4"
                onClick={() => toast.success("File picker would open here")}
              >
                Upload images
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-stone-100 p-6">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Status
            </h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-brand-ink-900">
                    Featured
                  </p>
                  <p className="text-xs text-stone-500">
                    Show on the home carousel
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                  className="h-4 w-4 accent-brand-green-500"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-brand-ink-900">
                    Wholesale
                  </p>
                  <p className="text-xs text-stone-500">
                    Eligible for tiered pricing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.wholesale}
                  onChange={(e) => update("wholesale", e.target.checked)}
                  className="h-4 w-4 accent-brand-green-500"
                />
              </label>
            </div>
            <button type="submit" className="btn-primary btn-lg w-full mt-6">
              <span className="btn-disc">
                <Save className="h-4 w-4" />
              </span>
              Save product
            </button>
            <button
              type="button"
              className="btn-outline rounded-full w-full mt-3"
              onClick={() => toast.success("Saved as draft")}
            >
              Save as draft
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
