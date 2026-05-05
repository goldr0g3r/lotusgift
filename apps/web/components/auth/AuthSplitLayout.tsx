"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { authImage } from "@/lib/images";

export function AuthSplitLayout({
  children,
  eyebrow,
  title,
  description,
  quote,
  quoteAuthor,
  imageSrc,
  imageAlt,
  badge,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  quote?: string;
  quoteAuthor?: string;
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
}) {
  return (
    <div className="min-h-screen bg-lotus-cream">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:block overflow-hidden">
          <ImageWithFallback
            src={imageSrc ?? authImage.src}
            alt={imageAlt ?? authImage.alt}
            sizes="50vw"
            priority
            className="animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-lotus-emerald-900/85 via-lotus-emerald-800/60 to-stone-900/30" />
          <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex items-center gap-2.5 self-start">
              <div className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <span className="font-display text-base font-bold">L</span>
              </div>
              <div className="leading-none">
                <span className="block font-display text-lg font-bold tracking-tight">
                  Lotus Gift
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-lotus-gold-200">
                  Wholesale Gifting
                </span>
              </div>
            </Link>
            <div className="max-w-md">
              {badge && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lotus-gold-200 ring-1 ring-white/15">
                  <Sparkles className="h-3 w-3" />
                  {badge}
                </span>
              )}
              {quote && (
                <blockquote className="mt-6 font-display text-2xl leading-snug">
                  “{quote}”
                </blockquote>
              )}
              {quoteAuthor && (
                <p className="mt-4 text-sm text-stone-200/80">— {quoteAuthor}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-lotus-emerald-800 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-stone-900">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-stone-500">{description}</p>
            )}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
