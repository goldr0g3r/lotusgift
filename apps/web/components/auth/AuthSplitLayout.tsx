"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import Logo from "@/components/Logo";

const defaultImage =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80";

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
    <div className="min-h-screen bg-[#EEEEF2]">
      <div className="mx-auto max-w-[1480px] px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
        <div className="bg-white rounded-3xl sm:rounded-4xl shadow-panel overflow-hidden grid lg:grid-cols-2 min-h-[calc(100vh-2.5rem)]">
          <div className="relative hidden lg:block overflow-hidden">
            <ImageWithFallback
              src={imageSrc ?? defaultImage}
              alt={imageAlt ?? "Lotus Gift branded products"}
              sizes="50vw"
              priority
              className="animate-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-ink-900/90 via-brand-green-800/65 to-brand-pink-700/30" />
            <div className="relative h-full flex flex-col justify-between p-10 text-white">
              <Link href="/" className="inline-flex">
                <Logo size="md" variant="mono-white" />
              </Link>
              <div className="max-w-md">
                {badge && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-pink-200 ring-1 ring-white/15">
                    <Sparkles className="h-3 w-3" />
                    {badge}
                  </span>
                )}
                {quote && (
                  <blockquote className="mt-6 font-display text-2xl sm:text-3xl font-extrabold leading-snug">
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                )}
                {quoteAuthor && (
                  <p className="mt-4 text-sm text-white/80">— {quoteAuthor}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-md mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-ink-900 mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to website
              </Link>
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h1 className="mt-3 h2-display">{title}</h1>
              {description && (
                <p className="mt-2 text-sm text-stone-500">{description}</p>
              )}
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
