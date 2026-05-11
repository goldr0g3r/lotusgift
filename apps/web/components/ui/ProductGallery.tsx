"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Dialog } from "./Dialog";
import { cn } from "@/lib/cn";

export interface ProductGalleryProps {
  images: Array<{ src: string; alt: string }>;
  className?: string;
}

export function ProductGallery({ images, className }: ProductGalleryProps) {
  const safeImages = images.length > 0 ? images : [];
  const [mainRef, mainApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!mainApi || !thumbApi) return;
    const onSel = () => {
      const i = mainApi.selectedScrollSnap();
      setSelected(i);
      thumbApi.scrollTo(i);
    };
    onSel();
    mainApi.on("select", onSel);
    mainApi.on("reInit", onSel);
    return () => {
      mainApi.off("select", onSel);
      mainApi.off("reInit", onSel);
    };
  }, [mainApi, thumbApi]);

  if (safeImages.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-3xl bg-stone-100 ring-1 ring-stone-200">
        <div ref={mainRef} className="overflow-hidden">
          <div className="flex">
            {safeImages.map((img, i) => (
              <div
                key={`main-${i}`}
                className="relative aspect-[4/5] min-w-0 shrink-0 basis-full sm:aspect-square"
              >
                <ImageWithFallback src={img.src} alt={img.alt} priority={i === 0} />
              </div>
            ))}
          </div>
        </div>

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => mainApi?.scrollPrev()}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-pill text-brand-ink-700 hover:bg-brand-ink-900 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => mainApi?.scrollNext()}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-pill text-brand-ink-700 hover:bg-brand-ink-900 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Open lightbox"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-pill text-brand-ink-700 hover:bg-brand-ink-900 hover:text-white"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>

      {safeImages.length > 1 && (
        <div ref={thumbRef} className="overflow-hidden">
          <div className="flex gap-2">
            {safeImages.map((img, i) => (
              <button
                type="button"
                key={`thumb-${i}`}
                onClick={() => mainApi?.scrollTo(i)}
                className={cn(
                  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all",
                  i === selected
                    ? "ring-2 ring-brand-green-500"
                    : "ring-stone-200 hover:ring-stone-300",
                )}
              >
                <ImageWithFallback src={img.src} alt={img.alt} sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        size="xl"
        showClose
        className="bg-stone-950"
      >
        <div className="relative aspect-square w-full bg-stone-950">
          <ImageWithFallback
            src={safeImages[selected]?.src ?? ""}
            alt={safeImages[selected]?.alt ?? ""}
            sizes="(max-width: 1024px) 90vw, 720px"
          />
        </div>
      </Dialog>
    </div>
  );
}
