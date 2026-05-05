"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Save,
  Search,
} from "lucide-react";
import type { Category } from "@/lib/api";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    };
  };

  useEffect(() => {
    fetch(`${API}/categories`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API}/categories/${editingId}`, {
          method: "PATCH",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c)),
        );
        toast.success("Category updated");
        setEditingId(null);
      } else {
        const res = await fetch(`${API}/categories`, {
          method: "POST",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        toast.success("Category created");
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API}/categories/${deleteId}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setShowAdd(false);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
            Categories
          </h2>
          <p className="text-stone-500 mt-1 text-sm">Organize your product catalog</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Add category
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search categories..."
            className="!pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showAdd && (
        <div className="card p-5 ring-2 ring-lotus-emerald-100 bg-lotus-emerald-50/30">
          <h3 className="font-display text-lg font-semibold text-stone-900 mb-4">
            New category
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-stone-300 text-lotus-emerald-700 focus:ring-lotus-emerald-500"
                />
                <span className="text-sm text-stone-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={cancelEdit} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="btn-primary"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="card divide-y divide-stone-100">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-12" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-stone-200" />
            <p>No categories found</p>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <div className="p-5 bg-lotus-emerald-50/30">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={form.slug}
                        onChange={(e) =>
                          setForm({ ...form, slug: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Sort order</Label>
                      <Input
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) =>
                            setForm({ ...form, isActive: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-stone-300 text-lotus-emerald-700 focus:ring-lotus-emerald-500"
                        />
                        <span className="text-sm text-stone-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={cancelEdit} className="btn-ghost">
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name}
                      className="btn-primary"
                    >
                      <Save className="w-4 h-4" />{" "}
                      {saving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50/60 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-lotus-emerald-50 ring-1 ring-lotus-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-lotus-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {cat.name}
                      </span>
                      {!cat.isActive && <Badge tone="gray">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                      {cat.description || cat.slug}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <span className="text-sm font-semibold text-stone-900">
                      {cat._count?.products ?? 0}
                    </span>
                    <p className="text-xs text-stone-500">products</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="p-1.5 rounded-md hover:bg-lotus-rose-50 text-stone-400 hover:text-lotus-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete category"
        description="Products in this category will be unassigned."
        size="sm"
      >
        <p className="text-sm text-stone-600">
          Are you sure you want to delete this category?
        </p>
        <DialogFooter>
          <button onClick={() => setDeleteId(null)} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-lotus-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lotus-rose-700"
          >
            Delete
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
