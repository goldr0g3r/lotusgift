"use client";

import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ring-1",
  {
    variants: {
      tone: {
        emerald: "bg-lotus-emerald-50 text-lotus-emerald-800 ring-lotus-emerald-100",
        green: "bg-lotus-emerald-50 text-lotus-emerald-800 ring-lotus-emerald-100",
        gold: "bg-lotus-gold-50 text-lotus-gold-800 ring-lotus-gold-100",
        yellow: "bg-lotus-gold-50 text-lotus-gold-800 ring-lotus-gold-200",
        rose: "bg-lotus-rose-50 text-lotus-rose-700 ring-lotus-rose-100",
        pink: "bg-lotus-rose-50 text-lotus-rose-700 ring-lotus-rose-100",
        gray: "bg-stone-100 text-stone-700 ring-stone-200",
        outline: "bg-white text-stone-600 ring-stone-200",
        danger: "bg-lotus-rose-50 text-lotus-rose-800 ring-lotus-rose-200",
      },
    },
    defaultVariants: { tone: "gray" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
