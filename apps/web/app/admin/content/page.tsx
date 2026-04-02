"use client";
import { useState, useEffect } from "react";
import {
  Star, Plus, Edit2, Trash2, Save, X, MessageCircle, Image as ImageIcon,
  Eye, EyeOff, Quote,
} from "lucide-react";
import type { Testimonial } from "@/lib/api";

const API = "http://localhost:3001/api";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

type Tab = "testimonials" | "banners";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("testimonials");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/testimonials`).then(r => r.json()).catch(() => []),
      fetch(`${API}/banners`).then(r => r.json()).catch(() => []),
    ])
      .then(([t, b]) => {
        setTestimonials(Array.isArray(t) ? t : t.data || []);
        setBanners(Array.isArray(b) ? b : b.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    setSaving(true);
    try {
      const isNew = !editingTestimonial.id;
      const url = isNew ? `${API}/testimonials` : `${API}/testimonials/${editingTestimonial.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers,
        body: JSON.stringify(editingTestimonial),
      });
      const saved = await res.json();
      if (isNew) {
        setTestimonials(prev => [...prev, saved]);
      } else {
        setTestimonials(prev => prev.map(t => t.id === saved.id ? saved : t));
      }
      setEditingTestimonial(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveBanner = async () => {
    if (!editingBanner) return;
    setSaving(true);
    try {
      const isNew = !editingBanner.id;
      const url = isNew ? `${API}/banners` : `${API}/banners/${editingBanner.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers,
        body: JSON.stringify(editingBanner),
      });
      const saved = await res.json();
      if (isNew) {
        setBanners(prev => [...prev, saved]);
      } else {
        setBanners(prev => prev.map(b => b.id === saved.id ? saved : b));
      }
      setEditingBanner(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/${deleteTarget.type}/${deleteTarget.id}`, { method: "DELETE", headers });
      if (deleteTarget.type === "testimonials") {
        setTestimonials(prev => prev.filter(t => t.id !== deleteTarget.id));
      } else {
        setBanners(prev => prev.filter(b => b.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="flex gap-2"><div className="h-10 bg-gray-200 rounded w-32 animate-pulse" /><div className="h-10 bg-gray-200 rounded w-28 animate-pulse" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-32 mb-3" /><div className="h-12 bg-gray-200 rounded" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <p className="text-gray-500 mt-1">Manage testimonials and banners</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab("testimonials")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "testimonials" ? "bg-brand-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Testimonials ({testimonials.length})</span>
        </button>
        <button onClick={() => setActiveTab("banners")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "banners" ? "bg-brand-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
          <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Banners ({banners.length})</span>
        </button>
      </div>

      {activeTab === "testimonials" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setEditingTestimonial({ clientName: "", company: "", content: "", rating: 5, isActive: true })} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>

          {testimonials.length === 0 && !editingTestimonial ? (
            <div className="card p-12 text-center">
              <Quote className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No testimonials yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {testimonials.map(t => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{t.clientName}</h4>
                      {t.company && <p className="text-xs text-gray-500">{t.company}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!t.isActive && <span className="badge-gray mr-2">Hidden</span>}
                      <button onClick={() => setEditingTestimonial(t)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget({ type: "testimonials", id: t.id })} className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{t.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "banners" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setEditingBanner({ title: "", subtitle: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true })} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          {banners.length === 0 && !editingBanner ? (
            <div className="card p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No banners yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map(b => (
                <div key={b.id} className="card p-5 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{b.title}</h4>
                      {!b.isActive && <span className="badge-gray">Hidden</span>}
                    </div>
                    {b.subtitle && <p className="text-xs text-gray-500 mt-0.5">{b.subtitle}</p>}
                    {b.linkUrl && <p className="text-xs text-brand-green-600 mt-0.5 truncate">{b.linkUrl}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingBanner(b)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "banners", id: b.id })} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editingTestimonial.id ? "Edit" : "Add"} Testimonial</h3>
              <button onClick={() => setEditingTestimonial(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Client Name</label>
                <input className="input-field" value={editingTestimonial.clientName || ""} onChange={e => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })} />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input-field" value={editingTestimonial.company || ""} onChange={e => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })} />
              </div>
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: r })}>
                      <Star className={`w-6 h-6 ${r <= (editingTestimonial.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea className="input-field resize-none" rows={4} value={editingTestimonial.content || ""} onChange={e => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingTestimonial.isActive ?? true} onChange={e => setEditingTestimonial({ ...editingTestimonial, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-green-600" />
                <span className="text-sm text-gray-700">Visible on website</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setEditingTestimonial(null)} className="btn-ghost">Cancel</button>
              <button onClick={saveTestimonial} disabled={saving || !editingTestimonial.clientName || !editingTestimonial.content} className="btn-primary">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editingBanner.id ? "Edit" : "Add"} Banner</h3>
              <button onClick={() => setEditingBanner(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Title</label>
                <input className="input-field" value={editingBanner.title || ""} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Subtitle</label>
                <input className="input-field" value={editingBanner.subtitle || ""} onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} />
              </div>
              <div>
                <label className="label">Image URL</label>
                <input className="input-field" value={editingBanner.imageUrl || ""} onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="label">Link URL</label>
                <input className="input-field" value={editingBanner.linkUrl || ""} onChange={e => setEditingBanner({ ...editingBanner, linkUrl: e.target.value })} placeholder="/products or https://..." />
              </div>
              <div>
                <label className="label">Sort Order</label>
                <input type="number" className="input-field" value={editingBanner.sortOrder || 0} onChange={e => setEditingBanner({ ...editingBanner, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingBanner.isActive ?? true} onChange={e => setEditingBanner({ ...editingBanner, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-green-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setEditingBanner(null)} className="btn-ghost">Cancel</button>
              <button onClick={saveBanner} disabled={saving || !editingBanner.title} className="btn-primary">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Delete {deleteTarget.type === "testimonials" ? "Testimonial" : "Banner"}</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
