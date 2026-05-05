"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Plus,
  Edit2,
  Trash2,
  Save,
  MessageCircle,
  Image as ImageIcon,
  Quote,
} from "lucide-react";
import type { Testimonial } from "@/lib/api";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
  const [editingTestimonial, setEditingTestimonial] = useState<
    Partial<Testimonial> | null
  >(null);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: string;
  } | null>(null);

  const getHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    };
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/testimonials`, { credentials: "include" })
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API}/banners`, { credentials: "include" })
        .then((r) => r.json())
        .catch(() => []),
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
      const url = isNew
        ? `${API}/testimonials`
        : `${API}/testimonials/${editingTestimonial.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(editingTestimonial),
      });
      const saved = await res.json();
      if (isNew) setTestimonials((prev) => [...prev, saved]);
      else
        setTestimonials((prev) =>
          prev.map((t) => (t.id === saved.id ? saved : t)),
        );
      toast.success("Testimonial saved");
      setEditingTestimonial(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveBanner = async () => {
    if (!editingBanner) return;
    setSaving(true);
    try {
      const isNew = !editingBanner.id;
      const url = isNew
        ? `${API}/banners`
        : `${API}/banners/${editingBanner.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(editingBanner),
      });
      const saved = await res.json();
      if (isNew) setBanners((prev) => [...prev, saved]);
      else
        setBanners((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
      toast.success("Banner saved");
      setEditingBanner(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/${deleteTarget.type}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
      if (deleteTarget.type === "testimonials") {
        setTestimonials((prev) =>
          prev.filter((t) => t.id !== deleteTarget.id),
        );
      } else {
        setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      }
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Marketing</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-stone-900">
          Content management
        </h2>
        <p className="text-stone-500 mt-1 text-sm">
          Manage testimonials and banners shown on the public site.
        </p>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["testimonials", MessageCircle, testimonials.length],
            ["banners", ImageIcon, banners.length],
          ] as const
        ).map(([id, Icon, count]) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ring-1 inline-flex items-center gap-2",
                active
                  ? "bg-lotus-emerald-700 text-white ring-lotus-emerald-700"
                  : "bg-white text-stone-600 hover:bg-stone-50 ring-stone-200",
              )}
            >
              <Icon className="w-4 h-4" />
              {id.charAt(0).toUpperCase() + id.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : activeTab === "testimonials" ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingTestimonial({
                  clientName: "",
                  company: "",
                  content: "",
                  rating: 5,
                  isActive: true,
                })
              }
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add testimonial
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="card p-12 text-center">
              <Quote className="w-10 h-10 mx-auto mb-2 text-stone-200" />
              <p className="text-stone-500">No testimonials yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">
                        {t.clientName}
                      </h4>
                      {t.company && (
                        <p className="text-xs text-stone-500">{t.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!t.isActive && <Badge tone="gray">Hidden</Badge>}
                      <button
                        onClick={() => setEditingTestimonial(t)}
                        className="p-1 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ type: "testimonials", id: t.id })
                        }
                        className="p-1 rounded-md text-stone-400 hover:bg-lotus-rose-50 hover:text-lotus-rose-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5",
                          i < t.rating
                            ? "text-lotus-gold-500 fill-lotus-gold-500"
                            : "text-stone-200",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 line-clamp-3">
                    {t.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingBanner({
                  title: "",
                  subtitle: "",
                  imageUrl: "",
                  linkUrl: "",
                  sortOrder: 0,
                  isActive: true,
                })
              }
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="card p-12 text-center">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 text-stone-200" />
              <p className="text-stone-500">No banners yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="card p-4 flex items-center gap-4">
                  <div className="relative w-28 h-16 rounded-xl overflow-hidden bg-stone-100 ring-1 ring-stone-200 flex-shrink-0">
                    {b.imageUrl ? (
                      <ImageWithFallback
                        src={b.imageUrl}
                        alt={b.title}
                        sizes="112px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-stone-900">
                        {b.title}
                      </h4>
                      {!b.isActive && <Badge tone="gray">Hidden</Badge>}
                    </div>
                    {b.subtitle && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        {b.subtitle}
                      </p>
                    )}
                    {b.linkUrl && (
                      <p className="text-xs text-lotus-emerald-700 mt-0.5 truncate">
                        {b.linkUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBanner(b)}
                      className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ type: "banners", id: b.id })
                      }
                      className="p-1.5 rounded-md text-stone-400 hover:bg-lotus-rose-50 hover:text-lotus-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!editingTestimonial}
        onClose={() => setEditingTestimonial(null)}
        title={editingTestimonial?.id ? "Edit testimonial" : "Add testimonial"}
        size="md"
      >
        {editingTestimonial && (
          <div className="space-y-4">
            <div>
              <Label>Client name</Label>
              <Input
                value={editingTestimonial.clientName || ""}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    clientName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={editingTestimonial.company || ""}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    company: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        rating: r,
                      })
                    }
                    aria-label={`${r} stars`}
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        r <= (editingTestimonial.rating || 0)
                          ? "text-lotus-gold-500 fill-lotus-gold-500"
                          : "text-stone-200",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                rows={4}
                value={editingTestimonial.content || ""}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    content: e.target.value,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingTestimonial.isActive ?? true}
                onChange={(e) =>
                  setEditingTestimonial({
                    ...editingTestimonial,
                    isActive: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-stone-300 text-lotus-emerald-700 focus:ring-lotus-emerald-500"
              />
              <span className="text-sm text-stone-700">Visible on website</span>
            </label>
          </div>
        )}
        <DialogFooter>
          <button
            onClick={() => setEditingTestimonial(null)}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={saveTestimonial}
            disabled={
              saving ||
              !editingTestimonial?.clientName ||
              !editingTestimonial?.content
            }
            className="btn-primary"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={!!editingBanner}
        onClose={() => setEditingBanner(null)}
        title={editingBanner?.id ? "Edit banner" : "Add banner"}
        size="md"
      >
        {editingBanner && (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editingBanner.title || ""}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={editingBanner.subtitle || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    subtitle: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={editingBanner.imageUrl || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    imageUrl: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={editingBanner.linkUrl || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    linkUrl: e.target.value,
                  })
                }
                placeholder="/products or https://..."
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={editingBanner.sortOrder || 0}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingBanner.isActive ?? true}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    isActive: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-stone-300 text-lotus-emerald-700 focus:ring-lotus-emerald-500"
              />
              <span className="text-sm text-stone-700">Active</span>
            </label>
          </div>
        )}
        <DialogFooter>
          <button onClick={() => setEditingBanner(null)} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={saveBanner}
            disabled={saving || !editingBanner?.title}
            className="btn-primary"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === "testimonials" ? "testimonial" : "banner"}`}
        description="This action cannot be undone."
        size="sm"
      >
        <p className="text-sm text-stone-600">Are you sure?</p>
        <DialogFooter>
          <button onClick={() => setDeleteTarget(null)} className="btn-ghost">
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
