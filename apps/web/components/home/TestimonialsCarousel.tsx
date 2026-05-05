"use client";

import { Quote, Star } from "lucide-react";
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselDots,
} from "@/components/ui/Carousel";

const testimonials = [
  {
    quote:
      "LotusGift made our annual client kits painless — one point of contact, crisp mockups, and on-time delivery across three cities.",
    author: "Ananya Mehta",
    role: "Marketing Lead",
    company: "Northwind Analytics",
    rating: 5,
  },
  {
    quote:
      "We needed 800 branded bottles in under two weeks. The team was transparent on feasibility and the finish exceeded expectations.",
    author: "Rahul Khanna",
    role: "Procurement Manager",
    company: "Brightline Health",
    rating: 5,
  },
  {
    quote:
      "From polo sampling to trophy engraving, everything felt coordinated. Our leadership off-site looked sharp and consistent.",
    author: "Sneha Iyer",
    role: "People Operations",
    company: "Cedar & Co.",
    rating: 5,
  },
  {
    quote:
      "The wholesale pricing and tiered MOQ made budgeting incredibly clean for our region launches.",
    author: "Arjun Bose",
    role: "Brand Manager",
    company: "Indus Capital",
    rating: 5,
  },
];

export function TestimonialsCarousel() {
  return (
    <section className="bg-lotus-cream px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow">Testimonials</span>
          <h2 className="section-heading mt-4">Teams that ship with confidence</h2>
        </div>

        <Carousel
          autoplay
          autoplayDelay={6000}
          options={{ align: "start", loop: true }}
        >
          <CarouselTrack className="-mx-3">
            {testimonials.map((t, i) => (
              <CarouselSlide
                key={i}
                basis="100%"
                className="px-3 md:[&]:basis-1/2 lg:[&]:basis-1/3"
              >
                <blockquote className="group h-full card relative flex flex-col p-7 lg:p-8">
                  <Quote
                    className="absolute right-6 top-6 h-10 w-10 text-lotus-gold-200 group-hover:text-lotus-gold-300 transition-colors"
                    aria-hidden
                  />
                  <div
                    className="mb-5 flex gap-0.5"
                    role="img"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-lotus-gold-400 text-lotus-gold-400"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <p className="relative z-[1] flex-1 text-sm leading-relaxed text-stone-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lotus-emerald-700 to-lotus-emerald-900 text-sm font-bold text-white">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{t.author}</p>
                      <p className="text-xs text-stone-500">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </footer>
                </blockquote>
              </CarouselSlide>
            ))}
          </CarouselTrack>
          <CarouselDots className="mt-8" />
        </Carousel>
      </div>
    </section>
  );
}
