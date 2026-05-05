"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type EmblaApi = UseEmblaCarouselType[1];
type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

type CarouselContextValue = {
  api: EmblaApi | undefined;
  selected: number;
  scrollSnaps: number[];
  canPrev: boolean;
  canNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (i: number) => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

export const useCarousel = () => {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("Carousel.* must be used inside <Carousel>");
  return ctx;
};

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  options?: EmblaOptions;
  autoplayDelay?: number;
  autoplay?: boolean;
  children: ReactNode;
}

export function Carousel({
  className,
  options,
  autoplay = false,
  autoplayDelay = 5000,
  children,
  ...props
}: CarouselProps) {
  const plugins = autoplay
    ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
    : [];
  const [viewportRef, api] = useEmblaCarousel(
    { loop: true, align: "start", ...options },
    plugins,
  );

  const [selected, setSelected] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback((emblaApi: EmblaApi) => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  return (
    <CarouselContext.Provider
      value={{ api, selected, scrollSnaps, canPrev, canNext, scrollPrev, scrollNext, scrollTo }}
    >
      <div className={cn("relative", className)} {...props}>
        <div ref={viewportRef} className="overflow-hidden">
          {children}
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselTrack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex", className)} {...props} />;
}

export interface CarouselSlideProps extends HTMLAttributes<HTMLDivElement> {
  basis?: string;
}
export function CarouselSlide({ className, basis = "100%", ...props }: CarouselSlideProps) {
  return (
    <div
      className={cn("min-w-0 shrink-0", className)}
      style={{ flex: `0 0 ${basis}` }}
      {...props}
    />
  );
}

const navBase =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-elevated ring-1 ring-stone-200 transition-all hover:bg-white hover:text-lotus-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed";

export function CarouselPrev({
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const { scrollPrev, canPrev } = useCarousel();
  return (
    <button
      type="button"
      aria-label="Previous slide"
      onClick={scrollPrev}
      disabled={!canPrev}
      className={cn(navBase, className)}
      {...props}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

export function CarouselNext({
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const { scrollNext, canNext } = useCarousel();
  return (
    <button
      type="button"
      aria-label="Next slide"
      onClick={scrollNext}
      disabled={!canNext}
      className={cn(navBase, className)}
      {...props}
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  );
}

export function CarouselDots({ className }: { className?: string }) {
  const { scrollSnaps, selected, scrollTo } = useCarousel();
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {scrollSnaps.map((_, i) => (
        <button
          type="button"
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => scrollTo(i)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === selected ? "w-8 bg-lotus-emerald-700" : "w-3 bg-stone-300 hover:bg-stone-400",
          )}
        />
      ))}
    </div>
  );
}
