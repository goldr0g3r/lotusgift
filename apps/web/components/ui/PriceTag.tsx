"use client";

import { cn } from "@/lib/cn";

export const formatInr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

type PriceTagProps = {
  from: number;
  to?: number;
  size?: "sm" | "md" | "lg" | "xl";
  unit?: string;
  className?: string;
};

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function PriceTag({ from, to, size = "md", unit, className }: PriceTagProps) {
  return (
    <div className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span
        className={cn(
          "font-extrabold text-brand-ink-900 tracking-tight tabular-nums",
          sizeMap[size],
        )}
      >
        {formatInr(from)}
      </span>
      {typeof to === "number" && to > from && (
        <span className="text-sm font-medium text-stone-500 tabular-nums">
          – {formatInr(to)}
        </span>
      )}
      {!to && <span className="text-sm font-medium text-stone-500">+</span>}
      {unit && <span className="text-xs font-medium text-stone-500">/ {unit}</span>}
    </div>
  );
}
