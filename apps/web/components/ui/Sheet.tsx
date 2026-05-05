"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type SheetSide = "right" | "left" | "bottom" | "top";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

const sizeMap = {
  sm: { x: "max-w-sm", y: "max-h-[40vh]" },
  md: { x: "max-w-md", y: "max-h-[60vh]" },
  lg: { x: "max-w-lg", y: "max-h-[75vh]" },
  xl: { x: "max-w-2xl", y: "max-h-[90vh]" },
  full: { x: "max-w-full", y: "max-h-full" },
};

export function Sheet({
  open,
  onClose,
  side = "right",
  size = "md",
  title,
  description,
  children,
  className,
  showClose = true,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;
  if (!open) return null;

  const horizontal = side === "left" || side === "right";
  const sizeCls = horizontal ? sizeMap[size]?.x : sizeMap[size]?.y;

  const positionCls =
    side === "right"
      ? "right-0 top-0 h-full w-full animate-slide-in-right"
      : side === "left"
        ? "left-0 top-0 h-full w-full animate-slide-in-left"
        : side === "bottom"
          ? "bottom-0 left-0 right-0 w-full animate-slide-up rounded-t-3xl"
          : "top-0 left-0 right-0 w-full animate-slide-down rounded-b-3xl";

  return createPortal(
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute bg-white shadow-2xl flex flex-col",
          positionCls,
          sizeCls,
          className,
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-stone-500">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
