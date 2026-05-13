"use client";

import { useState } from "react";
import { Edit, Eye, Image as ImageIcon, MessageSquare, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { StarRating } from "@/components/ui/StarRating";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { heroSlides, mockTestimonials, trustLogos } from "@/lib/mock-data";
import { toast } from "@/components/ui/Toaster";

export default function AdminContentPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Marketing</span>
        <h2 className="mt-3 h2-display">Content & visuals</h2>
        <p className="text-stone-500 mt-1 text-sm">
          Manage homepage hero slides, testimonials and trust logos.
        </p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="!flex flex-wrap !rounded-full">
          <TabsTrigger value="hero">
            <ImageIcon className="h-4 w-4" />
            Hero slides
          </TabsTrigger>
          <TabsTrigger value="testimonials">
            <MessageSquare className="h-4 w-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="logos">
            <Eye className="h-4 w-4" />
            Trust logos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Homepage hero slides
            </h3>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" />
              New slide
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroSlides.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-stone-100 overflow-hidden"
              >
                <div className="relative aspect-[16/10]">
                  <ImageWithFallback src={s.image} alt={s.title} sizes="320px" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-brand-pink-700 inline-flex items-center gap-1.5 rounded-full bg-brand-pink-50 px-3 py-1">
                    {s.eyebrow}
                  </span>
                  <p className="mt-3 font-bold text-brand-ink-900">
                    {s.title} {s.highlight}
                  </p>
                  <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-[11px] text-stone-500">
                      CTA → {s.cta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toast.success("Slide editor would open")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-700 hover:text-brand-green-800"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testimonials">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-brand-ink-900">
              Testimonials
            </h3>
            <button
              type="button"
              onClick={() => toast.success("Testimonial form would open")}
              className="btn-primary btn-sm"
            >
              <Plus className="h-4 w-4" />
              New testimonial
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTestimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl bg-white border border-stone-100 p-5"
              >
                <StarRating value={t.rating} />
                <p className="mt-3 text-sm text-brand-ink-900 line-clamp-4">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-ink-900">
                      {t.clientName}
                    </p>
                    <p className="text-xs text-stone-500">{t.company}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success("Edit testimonial")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
                    aria-label="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logos">
          <h3 className="font-display text-lg font-bold text-brand-ink-900">
            Trust logos
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Brands shown in the homepage logo marquee.
          </p>
          <div className="mt-5 rounded-3xl bg-white border border-stone-100 p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {trustLogos.map((l) => (
              <div
                key={l}
                className="rounded-full bg-stone-100 px-3 py-2 text-center text-sm font-semibold text-brand-ink-700"
              >
                {l}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New hero slide"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Slide saved (stub)");
            setOpen(false);
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Eyebrow</Label>
              <Input placeholder="e.g. Premium gifting" />
            </div>
            <div>
              <Label>CTA label</Label>
              <Input placeholder="e.g. Browse catalog" />
            </div>
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label>Image URL</Label>
              <Input />
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm">
              Save slide
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
