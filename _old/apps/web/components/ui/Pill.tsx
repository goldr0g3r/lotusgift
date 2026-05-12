"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const pill = cva(
  "inline-flex items-center gap-2 rounded-full font-medium transition-colors duration-200 cursor-pointer select-none",
  {
    variants: {
      tone: {
        neutral:
          "bg-white ring-1 ring-stone-200 text-brand-ink-700 hover:bg-stone-50",
        active:
          "bg-brand-ink-900 text-white ring-1 ring-brand-ink-900",
        green:
          "bg-brand-green-50 text-brand-green-700 ring-1 ring-brand-green-100 hover:bg-brand-green-100",
        pink: "bg-brand-pink-50 text-brand-pink-700 ring-1 ring-brand-pink-100 hover:bg-brand-pink-100",
        outline:
          "border border-stone-200 text-brand-ink-700 hover:border-brand-ink-900",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-1.5 text-sm",
        lg: "px-5 py-2 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

type PillProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pill> & {
    icon?: ReactNode;
  };

export function Pill({ className, tone, size, icon, children, ...props }: PillProps) {
  return (
    <span className={cn(pill({ tone, size }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
