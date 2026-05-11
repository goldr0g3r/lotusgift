"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviews?: number;
  className?: string;
};

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  value,
  max = 5,
  size = "sm",
  showValue = false,
  reviews,
  className,
}: StarRatingProps) {
  const rounded = Math.round(value);
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="inline-flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < rounded;
          return (
            <Star
              key={i}
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-stone-200 text-stone-200",
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-brand-ink-800 tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
      {typeof reviews === "number" && (
        <span className="text-xs text-stone-500">({reviews})</span>
      )}
    </div>
  );
}
