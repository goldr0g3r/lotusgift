"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "panel" | "flat" | "outline";
  interactive?: boolean;
};

export function Card({
  className,
  variant = "default",
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "panel" && "bg-white rounded-4xl shadow-panel",
        variant === "default" &&
          "bg-white rounded-3xl border border-stone-100 shadow-soft",
        variant === "flat" && "bg-white rounded-3xl border border-stone-100",
        variant === "outline" && "rounded-3xl border border-stone-200",
        interactive &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

export function CardHeader({
  className,
  title,
  description,
  action,
}: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-stone-100",
        className,
      )}
    >
      <div className="min-w-0">
        {title && (
          <h3 className="font-display text-lg font-bold text-brand-ink-900">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardActions({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-5 sm:px-6 py-4 border-t border-stone-100 bg-stone-50/40 rounded-b-3xl",
        className,
      )}
      {...props}
    />
  );
}
