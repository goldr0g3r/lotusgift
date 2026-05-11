"use client";

import { useState } from "react";
import {
  Edit,
  Folder,
  GripVertical,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { mockCategories } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";

export default function AdminCategoriesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2 className="mt-3 h2-display">Categories</h2>
          <p className="text-stone-500 mt-1 text-sm">
            Reorder, edit, or add new categories.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary btn-lg">
          <span className="btn-disc">
            <PlusCircle className="h-4 w-4" />
          </span>
          New category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategories.map((c) => (
          <div
            key={c.id}
            className="rounded-3xl bg-white border border-stone-100 p-5 flex flex-col"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="text-stone-300 hover:text-stone-500 cursor-grab"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-50">
                <ImageWithFallback src={c.imageUrl} alt={c.name} sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-ink-900 truncate">{c.name}</p>
                <p className="text-xs text-stone-500">
                  {c._count?.products ?? 0} products
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-stone-500 line-clamp-2">
              {c.description}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
              <span className="text-[11px] font-semibold text-stone-500 inline-flex items-center gap-1.5">
                <Folder className="h-3 w-3" />
                /{c.slug}
              </span>
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => toast.success(`Edit ${c.name}`)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-brand-ink-900"
                  aria-label="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.error(`${c.name} archived`)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New category"
        description="Categories appear on the homepage, navigation, and filters."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Category created (stub)");
            setOpen(false);
          }}
          className="space-y-3"
        >
          <div>
            <Label>Name</Label>
            <Input required placeholder="e.g. Eco Friendly" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input placeholder="auto-generated" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} placeholder="One-line description" />
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm">
              Save
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
