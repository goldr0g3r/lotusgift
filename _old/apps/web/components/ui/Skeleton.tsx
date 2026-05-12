"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-stone-200/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
