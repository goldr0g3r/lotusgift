"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lotus-emerald-500/40",
  {
    variants: {
      variant: {
        primary:
          "bg-lotus-emerald-700 text-white shadow-sm shadow-lotus-emerald-700/20 hover:bg-lotus-emerald-800 hover:shadow-md active:bg-lotus-emerald-900",
        secondary:
          "border border-lotus-emerald-200 text-lotus-emerald-800 bg-lotus-emerald-50/60 hover:bg-lotus-emerald-50 hover:border-lotus-emerald-300",
        accent:
          "bg-lotus-gold-600 text-white shadow-sm shadow-lotus-gold-600/25 hover:bg-lotus-gold-700",
        outline:
          "border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 hover:border-stone-400",
        ghost:
          "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        danger:
          "bg-lotus-rose-600 text-white shadow-sm hover:bg-lotus-rose-700",
        link: "text-lotus-emerald-700 hover:text-lotus-emerald-900 underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-7 py-3.5 text-base",
        icon: "h-10 w-10 p-0",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size, block }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
