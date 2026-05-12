"use client";

import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselDots,
} from "@/components/ui/Carousel";
import { StarRating } from "@/components/ui/StarRating";
import { SectionShell } from "@/components/ui/SectionShell";
import { mockTestimonials } from "@/lib/mock-data";

export function TestimonialsCarousel() {
  return (
    <SectionShell
      eyebrow={<span className="eyebrow">Client love</span>}
      heading="What our clients say"
      subheading="Real teams. Real campaigns. Real outcomes."
      align="center"
    >
      <Carousel options={{ align: "start" }}>
        <CarouselTrack className="-ml-4">
          {mockTestimonials.map((t) => (
            <CarouselSlide
              key={t.id}
              basis="90%"
              className="pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <div className="h-full rounded-3xl bg-white border border-stone-100 p-6 sm:p-7 shadow-soft">
                <Quote className="h-7 w-7 text-brand-pink-300" />
                <p className="mt-4 text-base text-brand-ink-900 leading-relaxed">
                  {t.content}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink-900">
                      {t.clientName}
                    </p>
                    <p className="text-xs text-stone-500">{t.company}</p>
                  </div>
                  <StarRating value={t.rating} size="md" showValue />
                </div>
              </div>
            </CarouselSlide>
          ))}
        </CarouselTrack>
        <div className="mt-8 flex justify-center">
          <CarouselDots />
        </div>
      </Carousel>
    </SectionShell>
  );
}
