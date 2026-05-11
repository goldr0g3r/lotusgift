"use client";

import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ring-1",
  {
    variants: {
      tone: {
        green: "bg-brand-green-50 text-brand-green-700 ring-brand-green-100",
        pink: "bg-brand-pink-50 text-brand-pink-700 ring-brand-pink-100",
        neutral: "bg-stone-100 text-stone-700 ring-stone-200",
        outline: "bg-white text-stone-600 ring-stone-200",
        warning: "bg-amber-50 text-amber-800 ring-amber-200",
        danger: "bg-rose-50 text-rose-700 ring-rose-200",
        dark: "bg-brand-ink-900 text-white ring-brand-ink-900",
        // Back-compat aliases used by older code.
        emerald: "bg-brand-green-50 text-brand-green-700 ring-brand-green-100",
        gold: "bg-brand-pink-50 text-brand-pink-700 ring-brand-pink-100",
        yellow: "bg-amber-50 text-amber-800 ring-amber-200",
        rose: "bg-brand-pink-50 text-brand-pink-700 ring-brand-pink-100",
        gray: "bg-stone-100 text-stone-700 ring-stone-200",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-3 py-1",
        lg: "text-sm px-4 py-1.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone, size }), className)} {...props} />;
}
