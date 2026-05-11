"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselDots,
} from "@/components/ui/Carousel";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { heroSlides } from "@/lib/mock-data";

function Scribble({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 80 C 30 30, 60 30, 80 70 S 110 110, 110 50" />
    </svg>
  );
}

function FloatingTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`absolute z-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-ink-800 shadow-pill ring-1 ring-stone-100 ${className}`}
    >
      {children}
    </span>
  );
}

export function HeroSlider() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 pt-2 sm:pt-4 pb-10 sm:pb-14">
      <Carousel
        autoplay
        autoplayDelay={6500}
        options={{ loop: true }}
      >
        <CarouselTrack>
          {heroSlides.map((slide, i) => (
            <CarouselSlide key={i} basis="100%">
              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                <div className="lg:col-span-6 relative z-10">
                  <span className="eyebrow">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green-500" />
                    {slide.eyebrow}
                  </span>
                  <h1 className="mt-5 h1-display text-balance">
                    {slide.title}
                    <br />
                    <span className="text-brand-pink-500">{slide.highlight}</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-base sm:text-lg text-stone-500 leading-relaxed">
                    {slide.description}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href={slide.cta.href}
                      className="btn-primary btn-lg"
                    >
                      <span className="btn-disc">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      {slide.cta.label}
                    </Link>
                    {slide.secondaryCta && (
                      <Link
                        href={slide.secondaryCta.href}
                        className="btn-outline rounded-full"
                      >
                        {slide.secondaryCta.label}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                    <div>
                      <div className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">500+</div>
                      <div className="text-xs text-stone-500 mt-1">Brands served</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">5d</div>
                      <div className="text-xs text-stone-500 mt-1">Dispatch SLA</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-brand-ink-900 tabular-nums">4.9</div>
                      <div className="text-xs text-stone-500 mt-1">Avg. rating</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 relative">
                  <div className="relative mx-auto aspect-square w-full max-w-[560px]">
                    <div
                      aria-hidden
                      className="absolute inset-6 rounded-full bg-gradient-to-br from-brand-green-50 via-white to-brand-pink-50"
                    />
                    <Scribble className="absolute -top-4 left-6 h-24 w-24 text-brand-pink-400/70 animate-float" />
                    <Scribble className="absolute bottom-2 right-4 h-28 w-28 text-brand-green-400/60 rotate-180" />
                    <div className="absolute inset-10 rounded-[40%_60%_55%_45%/55%_45%_55%_45%] overflow-hidden shadow-elevated-lg ring-4 ring-white">
                      <ImageWithFallback
                        src={slide.image}
                        alt={slide.productLabel}
                        sizes="(max-width: 1024px) 90vw, 560px"
                        priority={i === 0}
                        className="animate-ken-burns"
                      />
                    </div>
                    {slide.floatTags.map((tag, idx) => (
                      <FloatingTag
                        key={tag}
                        className={
                          idx === 0
                            ? "top-2 right-4 animate-float"
                            : idx === 1
                              ? "top-1/3 -right-2"
                              : "bottom-12 left-2 animate-float"
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-pink-500" />
                        {tag}
                      </FloatingTag>
                    ))}
                    <div className="absolute -bottom-4 right-2 sm:right-4 rounded-3xl bg-white shadow-elevated p-4 w-52 ring-1 ring-stone-100">
                      <div className="text-xs text-stone-500">Featured</div>
                      <div className="mt-0.5 text-sm font-semibold text-brand-ink-900 line-clamp-1">
                        {slide.productLabel}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xl font-extrabold text-brand-ink-900 tabular-nums">
                          ₹{slide.productPrice}
                        </span>
                        <div className="inline-flex items-center text-amber-500 gap-0.5">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <Star
                              key={k}
                              className="h-3 w-3 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-stone-500">
                        {slide.productMoq}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselSlide>
          ))}
        </CarouselTrack>
        <div className="mt-8 flex justify-center">
          <CarouselDots />
        </div>
      </Carousel>
    </section>
  );
}
