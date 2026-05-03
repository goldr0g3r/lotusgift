"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, FolderOpen, Save, X, GripVertical, Search,
} from "lucide-react";
import type { Category } from "@/lib/api";

const API = "http://localhost:3001/api";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: CategoryForm = { name: "", slug: "", description: "", sortOrder: 0, isActive: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then((data: any) => setCategories(Array.isArray(data) ? data : data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API}/categories/${editingId}`, {
          method: "PATCH", headers, body: JSON.stringify(form),
        });
        const updated = await res.json();
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...updated } : c));
        setEditingId(null);
      } else {
        const res = await fetch(`${API}/categories`, {
          method: "POST", headers, body: JSON.stringify(form),
        });
        const created = await res.json();
        setCategories(prev => [...prev, created]);
        setShowAdd(false);
      }
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API}/categories/${deleteId}`, { method: "DELETE", headers });
      setCategories(prev => prev.filter(c => c.id !== deleteId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setShowAdd(false);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder, isActive: cat.isActive });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /><div className="h-10 bg-gray-200 rounded w-36 animate-pulse" /></div>
        <div className="card divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-32" /><div className="h-3 bg-gray-200 rounded w-20" /></div>
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-500 mt-1">Organize your product catalog</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search categories..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {showAdd && (
        <div className="card p-5 border-2 border-brand-green-200 bg-brand-green-50/30">
          <h3 className="font-semibold text-gray-900 mb-4">New Category</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} placeholder="Category name" />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="category-slug" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" className="input-field" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-green-600 focus:ring-brand-green-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={cancelEdit} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="card divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>No categories found</p>
          </div>
        ) : filtered.map(cat => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <div className="p-5 bg-brand-green-50/30">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Slug</label>
                    <input className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Sort Order</label>
                    <input type="number" className="input-field" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-green-600 focus:ring-brand-green-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={cancelEdit} className="btn-ghost">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-green-50 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-brand-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    {!cat.isActive && <span className="badge-gray">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description || cat.slug}</p>
                </div>
                <div className="text-right mr-4">
                  <span className="text-sm font-semibold text-gray-900">{cat._count?.products ?? 0}</span>
                  <p className="text-xs text-gray-500">products</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure? Products in this category will be unassigned.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
