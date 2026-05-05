"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselDots,
  CarouselPrev,
  CarouselNext,
} from "@/components/ui/Carousel";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { heroSlides } from "@/lib/images";

export function HeroSlider() {
  return (
    <section className="relative">
      <Carousel
        autoplay
        autoplayDelay={5500}
        options={{ loop: true }}
        className="relative"
      >
        <CarouselTrack>
          {heroSlides.map((slide, i) => (
            <CarouselSlide key={i} basis="100%">
              <div className="relative h-[560px] sm:h-[620px] lg:h-[680px] w-full overflow-hidden">
                <div className="absolute inset-0">
                  <ImageWithFallback
                    src={slide.image.src}
                    alt={slide.image.alt}
                    sizes="100vw"
                    priority={i === 0}
                    className="animate-ken-burns"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/15" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />
                </div>
                <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl text-white">
                    <span className="eyebrow !bg-white/10 !text-lotus-gold-200 !ring-white/15">
                      {slide.eyebrow}
                    </span>
                    <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                      {slide.title}{" "}
                      <span className="bg-gradient-to-r from-lotus-gold-300 to-lotus-gold-100 bg-clip-text text-transparent">
                        {slide.highlight}
                      </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-100/85 sm:text-lg">
                      {slide.description}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Link
                        href={slide.cta.href}
                        className="group inline-flex items-center gap-2 rounded-xl bg-lotus-gold-500 px-7 py-3.5 text-sm font-bold text-stone-900 shadow-elevated hover:bg-lotus-gold-400 active:scale-[0.98] transition-all"
                      >
                        {slide.cta.label}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      {slide.secondaryCta && (
                        <Link
                          href={slide.secondaryCta.href}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
                        >
                          {slide.secondaryCta.label}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselSlide>
          ))}
        </CarouselTrack>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between px-6 sm:px-10">
          <div className="pointer-events-auto">
            <CarouselDots className="[&>button]:bg-white/40 [&>button.bg-lotus-emerald-700]:!bg-white" />
          </div>
          <div className="pointer-events-auto hidden sm:flex items-center gap-2">
            <CarouselPrev className="bg-white/15 text-white ring-white/30 backdrop-blur-sm hover:bg-white/30 hover:text-white" />
            <CarouselNext className="bg-white/15 text-white ring-white/30 backdrop-blur-sm hover:bg-white/30 hover:text-white" />
          </div>
        </div>
      </Carousel>
    </section>
  );
}
