"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green-500/40",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-green-500 text-white shadow-pill hover:bg-brand-green-600 active:bg-brand-green-700",
        pink:
          "bg-brand-pink-500 text-white shadow-pill hover:bg-brand-pink-600 active:bg-brand-pink-700",
        dark:
          "bg-brand-ink-900 text-white shadow-pill hover:bg-black",
        outline:
          "border border-brand-green-500 text-brand-green-600 bg-white hover:bg-brand-green-50 hover:border-brand-green-600",
        "outline-pink":
          "border border-brand-pink-500 text-brand-pink-600 bg-white hover:bg-brand-pink-50 hover:border-brand-pink-600",
        "outline-dark":
          "border border-brand-ink-900 text-brand-ink-900 bg-white hover:bg-stone-50",
        ghost:
          "text-stone-600 hover:bg-stone-100 hover:text-brand-ink-900",
        link: "text-brand-green-600 hover:text-brand-green-700 underline-offset-4 hover:underline",
        soft:
          "bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100",
        "soft-pink":
          "bg-brand-pink-50 text-brand-pink-700 hover:bg-brand-pink-100",
        danger:
          "bg-rose-600 text-white shadow-pill hover:bg-rose-700",
      },
      size: {
        sm: "px-4 py-1.5 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-7 py-3.5 text-base",
        icon: "h-11 w-11 p-0",
      },
      block: { true: "w-full" },
      withDisc: { true: "" },
    },
    compoundVariants: [
      { withDisc: true, size: "md", class: "pl-1.5 pr-5 py-1.5" },
      { withDisc: true, size: "lg", class: "pl-2 pr-7 py-2" },
      { withDisc: true, size: "xl", class: "pl-2 pr-8 py-2" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

const disc = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      tone: {
        primary: "bg-brand-green-800 text-white",
        pink: "bg-brand-pink-800 text-white",
        dark: "bg-white text-brand-ink-900",
        outline: "bg-brand-green-500 text-white",
        "outline-pink": "bg-brand-pink-500 text-white",
        "outline-dark": "bg-brand-ink-900 text-white",
        ghost: "bg-stone-200 text-brand-ink-900",
        link: "bg-brand-green-100 text-brand-green-700",
        soft: "bg-brand-green-200 text-brand-green-800",
        "soft-pink": "bg-brand-pink-200 text-brand-pink-800",
        danger: "bg-rose-800 text-white",
      },
      size: {
        sm: "h-7 w-7 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-9 w-9 text-sm",
        xl: "h-10 w-10 text-base",
        icon: "h-9 w-9 text-sm",
      },
    },
    defaultVariants: { tone: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof button> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, withDisc, leadingIcon, trailingIcon, children, ...props },
    ref,
  ) => {
    const hasDisc = !!leadingIcon && (withDisc ?? true);
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size, block, withDisc: hasDisc }), className)}
        {...props}
      >
        {hasDisc && (
          <span
            className={cn(
              disc({
                tone: (variant as never) ?? "primary",
                size: (size as never) ?? "md",
              }),
            )}
          >
            {leadingIcon}
          </span>
        )}
        {!hasDisc && leadingIcon}
        {children}
        {trailingIcon}
      </button>
    );
  },
);
Button.displayName = "Button";
