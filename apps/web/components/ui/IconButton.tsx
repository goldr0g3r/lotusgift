"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "relative inline-flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-500/40 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        light:
          "bg-white ring-1 ring-stone-200 text-brand-ink-800 hover:bg-stone-50 hover:text-brand-ink-900 shadow-pill",
        dark: "bg-brand-ink-900 text-white hover:bg-black shadow-pill",
        green:
          "bg-brand-green-500 text-white hover:bg-brand-green-600 shadow-pill",
        pink: "bg-brand-pink-500 text-white hover:bg-brand-pink-600 shadow-pill",
        ghost: "text-stone-500 hover:bg-stone-100 hover:text-brand-ink-900",
      },
      size: {
        sm: "h-9 w-9",
        md: "h-11 w-11",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "light", size: "md" },
  },
);

type IconButtonOwnProps = {
  badgeCount?: number;
  badgeTone?: "pink" | "green";
  asLink?: string;
  ariaLabel: string;
  children: ReactNode;
};

export type IconButtonProps = IconButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      badgeCount,
      badgeTone = "pink",
      asLink,
      ariaLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        {children}
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white",
              badgeTone === "pink"
                ? "bg-brand-pink-500"
                : "bg-brand-green-500",
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </>
    );

    if (asLink) {
      return (
        <Link
          href={asLink}
          aria-label={ariaLabel}
          className={cn(button({ variant, size }), className)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={cn(button({ variant, size }), className)}
        {...props}
      >
        {content}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
